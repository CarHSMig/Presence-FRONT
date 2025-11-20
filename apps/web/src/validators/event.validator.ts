import { z } from 'zod';

export const createEventSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome do evento é obrigatório')
    .min(3, 'Nome do evento deve ter pelo menos 3 caracteres'),
  descricao: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  data: z
    .string()
    .min(1, 'Data de início é obrigatória'),
  hora: z
    .string()
    .min(1, 'Hora de início é obrigatória'),
  dataFim: z
    .string()
    .min(1, 'Data de término é obrigatória'),
  horaFim: z
    .string()
    .min(1, 'Hora de término é obrigatória'),
  local: z
    .string()
    .min(1, 'Local é obrigatório')
    .min(3, 'Local deve ter pelo menos 3 caracteres'),
  locationOptional: z
    .boolean()
    .default(false),
  course_ids: z
    .array(z.string())
    .default([]),
  class_room_ids: z
    .array(z.string())
    .default([]),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;

