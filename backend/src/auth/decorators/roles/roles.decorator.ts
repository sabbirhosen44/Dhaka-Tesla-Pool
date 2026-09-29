import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('PASSENGER' | 'DRIVER' | 'ADMIN')[]) =>
  SetMetadata(ROLES_KEY, roles);
