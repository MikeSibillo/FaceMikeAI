export interface JwtPayload {
  sub: string;
  email?: string;
  organizationId?: string;
  isAdmin?: boolean;
}
