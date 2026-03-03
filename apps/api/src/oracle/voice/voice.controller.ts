import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseInterceptors,
  Req,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { VoiceSessionService } from './voice-session.service';
import { VoiceSpeakerService } from './voice-speaker.service';
import type { VoiceSessionMode, ArtifactType } from '@prisma/client';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      user?: { id: string; email?: string; organizationId?: string; isSuperAdmin?: boolean };
    }
  }
}

// X-Correlation-Id set by CorrelationMiddleware on all responses

@Controller('oracle/voice')
export class VoiceController {
  constructor(
    private readonly sessionService: VoiceSessionService,
    private readonly speakerService: VoiceSpeakerService,
  ) {}

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Body() body: { mode?: VoiceSessionMode; organizationId?: string; projectId?: string; settings?: object },
    @Req() req: Request,
  ) {
    const { sessionId, correlationId } = await this.sessionService.createSession({
      ...body,
      createdByUserId: req.user?.id,
    });
    return { sessionId, correlationId, ...(req.correlationId ? { 'X-Correlation-Id': req.correlationId } : {}) };
  }

  @Post('sessions/:id/close')
  async closeSession(@Param('id') id: string) {
    await this.sessionService.closeSession(id);
    return { closed: true };
  }

  @Get('sessions/:id/timeline')
  async getTimeline(@Param('id') id: string) {
    return this.sessionService.getTimeline(id);
  }

  @Post('sessions/:id/chunks')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('audio', { storage: memoryStorage() }))
  async ingestChunk(
    @Param('id') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file?.buffer) throw new BadRequestException('audio file required');
    const chunkIndex = parseInt(req.headers['x-chunk-index'] as string || '0', 10);
    const sampleRate = parseInt(req.headers['x-sample-rate'] as string || '16000', 10);
    const channels = parseInt(req.headers['x-channels'] as string || '1', 10);
    const mimeType = file.mimetype || 'audio/wav';
    return this.sessionService.ingestChunk(
      sessionId,
      chunkIndex,
      file.buffer,
      mimeType,
      sampleRate,
      channels,
    );
  }

  @Post('sessions/:id/artifacts/generate')
  @HttpCode(HttpStatus.CREATED)
  async generateArtifacts(
    @Param('id') sessionId: string,
    @Body() body: { types: ArtifactType[]; legalStyle?: string },
    @Req() req: Request,
  ) {
    const types = body.types || ['MINUTES', 'LEGAL_ACT'];
    return this.sessionService.generateArtifacts(
      sessionId,
      types,
      body.legalStyle,
      req.user?.id,
    );
  }

  @Get('sessions/:id/artifacts')
  async getArtifacts(@Param('id') sessionId: string) {
    return this.sessionService.getArtifacts(sessionId);
  }

  @Get('artifacts/:artifactId')
  async getArtifact(@Param('artifactId') artifactId: string) {
    const art = await this.sessionService.getArtifact(artifactId);
    if (!art) throw new BadRequestException('Artifact not found');
    return art;
  }

  @Post('speakers')
  @HttpCode(HttpStatus.CREATED)
  async createSpeaker(
    @Body() body: { displayName: string; roleLabel?: string; organizationId?: string },
    @Req() req: Request,
  ) {
    return this.speakerService.createSpeaker(
      body.displayName,
      body.roleLabel,
      body.organizationId ?? req.user?.organizationId,
    );
  }

  @Get('speakers')
  async listSpeakers(@Query('organizationId') organizationId?: string, @Req() req?: Request) {
    return this.speakerService.listSpeakers(organizationId ?? req?.user?.organizationId);
  }

  @Post('speakers/:id/enroll')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('audio', { storage: memoryStorage() }))
  async enrollVoice(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) throw new BadRequestException('audio sample required');
    return this.speakerService.enrollVoice(id, file.buffer, file.mimetype || 'audio/wav');
  }

  @Post('speakers/:speakerId/revoke-voiceprint/:voiceprintId')
  async revokeVoiceprint(
    @Param('speakerId') speakerId: string,
    @Param('voiceprintId') voiceprintId: string,
  ) {
    await this.speakerService.revokeVoiceprint(speakerId, voiceprintId);
    return { revoked: true };
  }
}
