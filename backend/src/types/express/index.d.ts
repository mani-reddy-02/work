import { Role } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        role: Role;
        hospitalId: string | null;
        active: boolean;
      };
    }
  }
}
