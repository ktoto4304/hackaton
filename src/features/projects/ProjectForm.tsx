import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, type ProjectFormData } from './schema';
import { useCatalog } from '@/store/catalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Select, DatePicker, notification } from 'antd';
import dayjs from 'dayjs';

export function ProjectForm() {
  const { drones, cameras } = useCatalog();

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: 'onChange',
    defaultValues: { name: '', date: '', description: '', bvsIds: [], cameraId: undefined },
  });

  const onSubmit = (data: ProjectFormData) => {
    console.log('Валидные данные:', data);
    notification.success({
      message: 'Проект создан',
      description: `«${data.name}» — ${data.bvsIds.length} БВС`,
      placement: 'topRight',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Controller control={control} name="name" render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>Название проекта</FieldLabel>
          <Input id={field.name} placeholder="Например, Облёт ЛЭП-500" aria-invalid={fieldState.invalid} {...field} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )} />

      <Controller control={control} name="date" render={({ field, fieldState }) => (
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
      )} />

      <Controller control={control} name="description" render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>Описание</FieldLabel>
          <Textarea id={field.name} placeholder="Цели, район работ, особые условия" aria-invalid={fieldState.invalid} {...field} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )} />

      <Controller control={control} name="bvsIds" render={({ field, fieldState }) => (
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
            options={drones.map((d) => ({ value: d.id, label: `${d.name} — ${d.maxFlightTimeMin} мин, ${d.cruiseSpeedMs} м/с` }))}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          {field.value.length > 0 && (
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
                  {drones.filter((d) => field.value.includes(d.id)).map((d) => (
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
      )} />

      <Controller control={control} name="cameraId" render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>Камера</FieldLabel>
          <Select
            placeholder="Выберите камеру"
            style={{ width: '100%' }}
            value={field.value || undefined}
            onChange={(value) => field.onChange(value)}
            onBlur={field.onBlur}
            allowClear={false}
            showSearch
            optionFilterProp="label"
            status={fieldState.invalid ? 'error' : undefined}
            options={cameras.map((c) => ({ value: c.id, label: `${c.name} — FOV ${c.fovDeg}°, ${c.resolutionMp} Мп, перекрытие ${c.overlapPercent}%` }))}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )} />

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>Создать проект</Button>
        <Button type="button" variant="outline" onClick={() => reset()}>Сбросить</Button>
      </div>
    </form>
  );
}