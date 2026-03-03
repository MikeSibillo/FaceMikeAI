import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function createTestToken(payload: {
  sub: string;
  email?: string;
  organizationId?: string;
  isAdmin?: boolean;
}): string {
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email || 'test@example.com',
      organizationId: payload.organizationId || 'org1',
      isAdmin: payload.isAdmin ?? true,
    },
    secret,
    { expiresIn: '1h' },
  );
}
