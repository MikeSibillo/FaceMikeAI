import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  id: string;
  email?: string;
  organizationId?: string;
  isAdmin?: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext): RequestUser | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;
    if (data && user) return user[data];
    return user;
  },
);
