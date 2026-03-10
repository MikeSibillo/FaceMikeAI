import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
  UploadedFile,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { VoiceEnabledGuard } from './voice-enabled.guard';
import { CorrelationInterceptor } from '../../common/interceptors/correlation.interceptor';
import { OracleVoiceService } from './oracle-voice.service';
import { OracleVoiceSessionMode } from '@ai-aztec/db';

const multerMem = { storage: multer.memoryStorage() };

@Controller('oracle/voice')
@UseGuards(VoiceEnabledGuard, JwtAuthGuard)
@UseInterceptors(CorrelationInterceptor)
export class OracleVoiceController {
  constructor(private readonly voice: OracleVoiceService) {}

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Body() dto: { mode?: OracleVoiceSessionMode; organizationId?: string; projectId?: string; settings?: Record<string, unknown> },
    @Req() req: { user?: { id: string } },
  ) {
    return this.voice.createSession({
      ...dto,
      createdByUserId: req.user?.id,
    });
  }

  @Post('sessions/:id/close')
  async closeSession(@Param('id') id: string) {
    await this.voice.closeSession(id);
    return { closed: true };
  }

  @Get('sessions/:id/timeline')
  async getTimeline(@Param('id') id: string): Promise<{ segments: unknown[]; events: unknown[] }> {
    return this.voice.getTimeline(id);
  }

  @Post('sessions/:id/chunks')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('audio', multerMem))
  async ingestChunk(
    @Param('id') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-chunk-index') chunkIndexHeader: string,
    @Headers('x-sample-rate') sampleRateHeader: string,
    @Headers('x-channels') channelsHeader: string,
  ) {
    const chunkIndex = parseInt(chunkIndexHeader || '0', 10);
    const sampleRate = sampleRateHeader ? parseInt(sampleRateHeader, 10) : undefined;
    const channels = channelsHeader ? parseInt(channelsHeader, 10) : undefined;
    const buffer = file?.buffer ?? Buffer.from([]);
    const mimeType = file?.mimetype ?? 'audio/wav';
    return this.voice.ingestChunk(sessionId, buffer, chunkIndex, mimeType, sampleRate, channels);
  }

  @Post('speakers')
  @HttpCode(HttpStatus.CREATED)
  async createSpeaker(@Body() dto: { displayName: string; roleLabel?: string; organizationId?: string }) {
    return this.voice.createSpeaker(dto);
  }

  @Post('speakers/:id/enroll')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('sample', multerMem))
  async enrollSpeaker(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const buffer = file?.buffer ?? Buffer.from([]);
    const mimeType = file?.mimetype ?? 'audio/wav';
    return this.voice.enrollSpeaker(id, buffer, mimeType);
  }

  @Get('speakers')
  async listSpeakers(@Query('organizationId') organizationId?: string) {
    return this.voice.listSpeakers(organizationId);
  }

  @Post('speakers/:id/revoke-voiceprint/:voiceprintId')
  async revokeVoiceprint(@Param('id') id: string, @Param('voiceprintId') voiceprintId: string) {
    await this.voice.revokeVoiceprint(id, voiceprintId);
    return { revoked: true };
  }

  @Post('sessions/:id/artifacts/generate')
  @HttpCode(HttpStatus.CREATED)
  async generateArtifacts(
    @Param('id') sessionId: string,
    @Body() dto: { types?: Array<'MINUTES' | 'DECISIONS' | 'LEGAL_ACT'>; legalStyle?: string },
  ) {
    const types = dto.types ?? ['MINUTES'];
    return this.voice.generateArtifacts(sessionId, types, dto.legalStyle);
  }

  @Get('sessions/:id/artifacts')
  async getArtifacts(@Param('id') sessionId: string): Promise<unknown[]> {
    return this.voice.getArtifacts(sessionId);
  }

  @Get('artifacts/:artifactId')
  async getArtifact(@Param('artifactId') artifactId: string): Promise<unknown> {
    return this.voice.getArtifact(artifactId);
  }
}
