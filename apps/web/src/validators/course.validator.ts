import { z } from 'zod';

export const editCourseSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome do curso é obrigatório')
    .min(3, 'Nome do curso deve ter pelo menos 3 caracteres'),
  periods: z
    .number()
    .int('Períodos deve ser um número inteiro')
    .min(1, 'O curso deve ter pelo menos 1 período')
    .max(20, 'O curso não pode ter mais de 20 períodos'),
});

export type EditCourseFormData = z.infer<typeof editCourseSchema>;

