import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { OracleVoiceService } from './oracle-voice.service';

@Controller('oracle/voice')
export class OracleVoiceController {
  constructor(private readonly voiceService: OracleVoiceService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      module: 'oracle-voice',
      enabled: this.voiceService.isEnabled(),
    };
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createSession(
    @Body() dto: { mode?: string; organizationId?: string; projectId?: string; settings?: object },
    @CurrentUser() user?: RequestUser,
  ) {
    return this.voiceService.createSession({
      ...dto,
      userId: user?.id,
    });
  }

  @Post('sessions/:id/close')
  @UseGuards(JwtAuthGuard)
  async closeSession(@Param('id') id: string) {
    return this.voiceService.closeSession(id);
  }

  @Get('sessions/:id/timeline')
  @UseGuards(JwtAuthGuard)
  async getTimeline(@Param('id') id: string) {
    return this.voiceService.getTimeline(id);
  }

  @Post('sessions/:id/chunks')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('audio'))
  async ingestChunk(
    @Param('id') sessionId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype?: string },
    @Body() body: { chunkIndex?: string },
    @Headers('x-chunk-index') chunkIndexHeader?: string,
    @Headers('x-sample-rate') _sampleRate?: string,
    @Headers('x-channels') _channels?: string,
  ) {
    const chunkIndex = parseInt(chunkIndexHeader ?? body?.chunkIndex ?? '0', 10);
    if (!file?.buffer) throw new BadRequestException('Audio file required');
    const sampleRate = _sampleRate ? parseInt(_sampleRate, 10) : undefined;
    const channels = _channels ? parseInt(_channels, 10) : undefined;
    return this.voiceService.ingestChunk(
      sessionId,
      chunkIndex,
      file.buffer,
      file.mimetype || 'audio/wav',
      sampleRate,
      channels,
    );
  }

  @Post('speakers')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createSpeaker(
    @Body() dto: { displayName: string; roleLabel?: string; organizationId?: string },
  ) {
    return this.voiceService.createSpeaker(dto);
  }

  @Post('speakers/:id/enroll')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('audio'))
  async enrollVoice(
    @Param('id') speakerProfileId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype?: string },
  ) {
    if (!file?.buffer) throw new BadRequestException('Audio sample required');
    return this.voiceService.enrollVoice(
      speakerProfileId,
      file.buffer,
      file.mimetype || 'audio/wav',
    );
  }

  @Get('speakers')
  @UseGuards(JwtAuthGuard)
  async listSpeakers() {
    return this.voiceService.listSpeakers();
  }

  @Post('speakers/:id/revoke-voiceprint/:voiceprintId')
  @UseGuards(JwtAuthGuard)
  async revokeVoiceprint(
    @Param('id') speakerProfileId: string,
    @Param('voiceprintId') voiceprintId: string,
  ) {
    return this.voiceService.revokeVoiceprint(speakerProfileId, voiceprintId);
  }

  @Post('sessions/:id/artifacts/generate')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async generateArtifacts(
    @Param('id') sessionId: string,
    @Body() dto: { types?: string[]; legalStyle?: string },
  ) {
    return this.voiceService.generateArtifacts(
      sessionId,
      dto?.types || ['MINUTES'],
      dto?.legalStyle,
    );
  }

  @Get('sessions/:id/artifacts')
  @UseGuards(JwtAuthGuard)
  async getSessionArtifacts(@Param('id') sessionId: string) {
    return this.voiceService.getSessionArtifacts(sessionId);
  }

  @Get('artifacts/:artifactId')
  @UseGuards(JwtAuthGuard)
  async getArtifact(@Param('artifactId') artifactId: string) {
    return this.voiceService.getArtifact(artifactId);
  }
}
