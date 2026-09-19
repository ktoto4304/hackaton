import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, type ProjectFormData } from './schema';
import { useCatalog } from '@/store/catalog';
import { useProjectDraft } from '@/store/projectDraft';
import { useProjects } from '@/store/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Select, DatePicker, InputNumber, notification } from 'antd';
import dayjs from 'dayjs';

const COVERAGE_OPTIONS = [
  { value: 'boustrophedon', label: 'Змейка (boustrophedon)' },
  { value: 'spiral', label: 'Спираль' },
  { value: 'grid', label: 'Сетка' },
];

const DIVISION_OPTIONS = [
  { value: 'balanced', label: 'Поровну (balanced)' },
  { value: 'by-area', label: 'По площади' },
  { value: 'voronoi', label: 'Вороного' },
];

export function ProjectForm() {
  const { drones, cameras } = useCatalog();
  const replaceDraft = useProjectDraft((s) => s.replaceDraft);
  const createProject = useProjects((s) => s.createProject);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      date: '',
      description: '',
      bvsIds: [],
      cameraId: '',
      flightHeightM: 120,
      spacingM: 30,
      coverageStrategy: 'boustrophedon',
      divisionStrategy: 'balanced',
    },
  });

  const watched = useWatch({ control });

  // Пушим черновик в стор при любом изменении формы — SurveyMap читает его.
  useEffect(() => {
    replaceDraft(watched as ProjectFormData);
  }, [watched, replaceDraft]);

  const onSubmit = (data: ProjectFormData) => {
    const project = createProject(data);
    notification.success({
      message: 'Проект сохранён',
      description: `«${project.form.name}» — ${project.form.bvsIds.length} БВС`,
      placement: 'topRight',
    });
  };

  const selectedDrones = drones.filter((d) => (watched.bvsIds ?? []).includes(d.id));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Название проекта</FieldLabel>
            <Input
              id={field.name}
              placeholder="Например, Облёт ЛЭП-500"
              aria-invalid={fieldState.invalid}
              maxLength={100}
              {...field}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={control}
        name="date"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Дата полёта</FieldLabel>
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Выберите дату"
              format="DD.MM.YYYY"
              value={field.value ? dayjs(field.value) : null}
              onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
              onBlur={field.onBlur}
              status={fieldState.invalid ? 'error' : undefined}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Описание</FieldLabel>
            <Textarea
              id={field.name}
              placeholder="Цели, район работ, особые условия"
              aria-invalid={fieldState.invalid}
              maxLength={500}
              rows={3}
              {...field}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={control}
        name="bvsIds"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Состав группы БВС</FieldLabel>
            <Select
              mode="multiple"
              placeholder="Выберите БВС из справочника"
              style={{ width: '100%' }}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              status={fieldState.invalid ? 'error' : undefined}
              options={drones.map((d) => ({
                value: d.id,
                label: `${d.name} — ${d.maxFlightTimeMin} мин, ${d.cruiseSpeedMs} м/с`,
              }))}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}

            {selectedDrones.length > 0 && (
              <div className="mt-3 rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-1.5 text-left">Модель</th>
                      <th className="px-3 py-1.5 text-right">Время, мин</th>
                      <th className="px-3 py-1.5 text-right">Скорость, м/с</th>
                      <th className="px-3 py-1.5 text-right">Вес, г</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDrones.map((d) => (
                      <tr key={d.id} className="border-t border-border">
                        <td className="px-3 py-1.5">{d.name}</td>
                        <td className="px-3 py-1.5 text-right">{d.maxFlightTimeMin}</td>
                        <td className="px-3 py-1.5 text-right">{d.cruiseSpeedMs}</td>
                        <td className="px-3 py-1.5 text-right">{d.maxTakeoffWeightG}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Field>
        )}
      />

      <Controller
        control={control}
        name="cameraId"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Камера</FieldLabel>
            <Select
              placeholder="Выберите камеру"
              style={{ width: '100%' }}
              value={field.value || undefined}
              onChange={(v) => field.onChange(v)}
              onBlur={field.onBlur}
              showSearch
              optionFilterProp="label"
              status={fieldState.invalid ? 'error' : undefined}
              options={cameras.map((c) => ({
                value: c.id,
                label: `${c.name} — FOV ${c.fovDeg}°, ${c.resolutionMp} Мп, перекрытие ${c.overlapPercent}%`,
              }))}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="flightHeightM"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Высота полёта, м</FieldLabel>
              <InputNumber
                min={5}
                max={5000}
                className="w-full"
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                onBlur={field.onBlur}
                status={fieldState.invalid ? 'error' : undefined}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="spacingM"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Шаг галсов, м</FieldLabel>
              <InputNumber
                min={5}
                max={2000}
                className="w-full"
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                onBlur={field.onBlur}
                status={fieldState.invalid ? 'error' : undefined}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="coverageStrategy"
          render={({ field }) => (
            <Field>
              <FieldLabel>Покрытие</FieldLabel>
              <Select
                style={{ width: '100%' }}
                value={field.value}
                onChange={field.onChange}
                options={COVERAGE_OPTIONS}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="divisionStrategy"
          render={({ field }) => (
            <Field>
              <FieldLabel>Деление</FieldLabel>
              <Select
                style={{ width: '100%' }}
                value={field.value}
                onChange={field.onChange}
                options={DIVISION_OPTIONS}
              />
            </Field>
          )}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          Сохранить проект
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()}>
          Сбросить
        </Button>
      </div>
    </form>
  );
}