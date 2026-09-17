import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, type ProjectFormData } from './schema';
import { BvsSelector } from '@/features/bvs/BvsSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Label } from '@/components/ui/label';

export function ProjectForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      date: '',
      description: '',
      bvsIds: [],
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    console.log('Валидные данные:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* 1. Название */}
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
              {...field}
            />
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      {/* 2. Дата */}
      <Controller
        control={control}
        name="date"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Дата полёта</FieldLabel>
            <Input
              id={field.name}
              type="date"
              aria-invalid={fieldState.invalid}
              {...field}
            />
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      {/* 3. Описание */}
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
              {...field}
            />
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      {/* 4. Выбор БВС */}
      <Controller
        control={control}
        name="bvsIds"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Состав группы БВС</FieldLabel>
            <BvsSelector
              selectedIds={field.value}
              onChange={field.onChange}
            />
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      <Button type="submit" disabled={isSubmitting}>
        Создать проект
      </Button>
    </form>
  );
}