import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUserPayload {
  id: string;
  name: string;
  phone: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUserPayload;
    return data ? user?.[data] : user;
  },
);
