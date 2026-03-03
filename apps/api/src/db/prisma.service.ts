import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@ai-aztec/db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
