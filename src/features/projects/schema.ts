import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(3, 'Название должно быть не короче 3 символов').max(100, 'Название слишком длинное'),
  date: z.string().min(1, 'Укажите дату'),
  description: z.string().max(500, 'Описание не должно превышать 500 символов').optional().or(z.literal('')),
  bvsIds: z.array(z.string()).min(1, 'Выберите хотя бы один БВС'),
  cameraId: z.string().min(1, 'Выберите камеру'),
});

export type ProjectFormData = z.infer<typeof projectSchema>;