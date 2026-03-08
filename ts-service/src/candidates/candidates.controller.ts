import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { CandidatesService } from './candidates.service';
import { UploadCandidateDocumentDto } from './dto/upload-candidate-document.dto';

@Controller('candidates/:candidateId')
@UseGuards(FakeAuthGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post('documents')
  async uploadDocument(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Body() dto: UploadCandidateDocumentDto,
  ) {
    return this.candidatesService.uploadDocument(user, candidateId, dto);
  }

  @Post('summaries/generate')
  async generateSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ) {
    const summary = await this.candidatesService.requestSummaryGeneration(user, candidateId);

    return {
      status: 'accepted',
      summaryId: summary.id,
      candidateId,
      state: summary.status,
    };
  }

  @Get('summaries')
  async listSummaries(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ) {
    return this.candidatesService.listSummaries(user, candidateId);
  }

  @Get('summaries/:summaryId')
  async getSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
  ) {
    return this.candidatesService.getSummary(user, candidateId, summaryId);
  }
}
