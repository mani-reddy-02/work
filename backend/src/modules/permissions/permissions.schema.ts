import { z } from 'zod';
import { Role } from '@prisma/client';

export const updatePermissionsSchema = z.object({
  body: z.object({
    permissions: z.record(z.string(), z.boolean())
  }),
  params: z.object({
    role: z.nativeEnum(Role)
  })
});

export const getPermissionsSchema = z.object({
  params: z.object({
    role: z.nativeEnum(Role)
  })
});
