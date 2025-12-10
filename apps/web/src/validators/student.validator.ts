import { z } from 'zod';

export const studentSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome do aluno é obrigatório')
    .min(3, 'Nome do aluno deve ter pelo menos 3 caracteres'),
  ra: z
    .string()
    .min(1, 'RA é obrigatório')
    .regex(/^\d+(-\d+)?$/, 'RA deve conter apenas números, opcionalmente separados por hífen (ex: 241403-1 ou 2311041)'),
  email: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val === '' || z.string().email().safeParse(val).success, {
      message: 'Email inválido',
    })
    .transform((val) => val === '' ? null : val),
});

export const createStudentsSchema = z.array(studentSchema).min(1, 'Adicione pelo menos um aluno');

export type StudentFormData = z.infer<typeof studentSchema>;
export type CreateStudentsFormData = z.infer<typeof createStudentsSchema>;

