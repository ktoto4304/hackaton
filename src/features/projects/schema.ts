import { z } from 'zod';

export const coverageStrategySchema = z.enum(['boustrophedon', 'spiral', 'grid']);
export const divisionStrategySchema = z.enum(['balanced', 'by-area', 'voronoi']);

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Название должно быть не короче 3 символов')
    .max(100, 'Название слишком длинное'),
  date: z.string().min(1, 'Укажите дату'),
  description: z
    .string()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional()
    .or(z.literal('')),
  bvsIds: z.array(z.string()).min(1, 'Выберите хотя бы один БВС'),
  cameraId: z.string().min(1, 'Выберите камеру'),
  flightHeightM: z
    .number({ invalid_type_error: 'Укажите высоту полёта' })
    .min(5, 'Минимум 5 м')
    .max(5000, 'Максимум 5000 м'),
  spacingM: z
    .number({ invalid_type_error: 'Укажите шаг галсов' })
    .min(5, 'Минимум 5 м')
    .max(2000, 'Максимум 2000 м'),
  coverageStrategy: coverageStrategySchema,
  divisionStrategy: divisionStrategySchema,
});

export type ProjectFormData = z.infer<typeof projectSchema>;

/** Параметры, которые реально уходят в SurveyMap. */
export interface SurveyParams {
  bvsIds: string[];
  cameraId: string;
  flightHeightM: number;
  spacingM: number;
  coverageStrategy: z.infer<typeof coverageStrategySchema>;
  divisionStrategy: z.infer<typeof divisionStrategySchema>;
}