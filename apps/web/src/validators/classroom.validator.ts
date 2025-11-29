import { z } from 'zod';

export const createClassRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome da turma é obrigatório')
    .min(2, 'Nome da turma deve ter pelo menos 2 caracteres'),
  period: z
    .number()
    .int('Período deve ser um número inteiro')
    .min(1, 'O período deve ser pelo menos 1')
    .max(20, 'O período não pode ser maior que 20'),
});

export type CreateClassRoomFormData = z.infer<typeof createClassRoomSchema>;

