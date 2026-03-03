import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class OrgMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const orgId = req.headers['x-org-id'] as string | undefined;
    const projectId = req.headers['x-project-id'] as string | undefined;

    (req as Request & { orgId?: string; projectId?: string }).orgId = orgId;
    (req as Request & { orgId?: string; projectId?: string }).projectId =
      projectId;

    next();
  }
}
