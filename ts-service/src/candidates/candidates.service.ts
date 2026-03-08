import { randomUUID } from 'crypto';

import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { QueueService } from '../queue/queue.service';
import { CANDIDATE_SUMMARY_GENERATE_JOB, CandidateSummaryGenerateJobPayload } from './candidate-summary-job.types';
import { UploadCandidateDocumentDto } from './dto/upload-candidate-document.dto';

const PROMPT_VERSION = 'candidate-summary-v1';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(SampleCandidate)
    private readonly candidateRepository: Repository<SampleCandidate>,
    @InjectRepository(CandidateDocument)
    private readonly documentRepository: Repository<CandidateDocument>,
    @InjectRepository(CandidateSummary)
    private readonly summaryRepository: Repository<CandidateSummary>,
    @Inject(QueueService)
    private readonly queueService: QueueService,
  ) {}

  async uploadDocument(
    user: AuthUser,
    candidateId: string,
    dto: UploadCandidateDocumentDto,
  ): Promise<CandidateDocument> {
    await this.ensureCandidateAccess(user, candidateId);

    const document = this.documentRepository.create({
      id: randomUUID(),
      candidateId,
      documentType: dto.documentType,
      fileName: dto.fileName.trim(),
      storageKey: dto.storageKey.trim(),
      rawText: dto.rawText.trim(),
    });

    return this.documentRepository.save(document);
  }

  async requestSummaryGeneration(user: AuthUser, candidateId: string): Promise<CandidateSummary> {
    await this.ensureCandidateAccess(user, candidateId);

    const pendingSummary = this.summaryRepository.create({
      id: randomUUID(),
      candidateId,
      status: 'pending',
      score: null,
      strengths: [],
      concerns: [],
      summary: null,
      recommendedDecision: null,
      provider: 'pending',
      promptVersion: PROMPT_VERSION,
      errorMessage: null,
    });

    const savedSummary = await this.summaryRepository.save(pendingSummary);

    const payload: CandidateSummaryGenerateJobPayload = {
      summaryId: savedSummary.id,
      candidateId,
    };
    this.queueService.enqueue(CANDIDATE_SUMMARY_GENERATE_JOB, payload);

    return savedSummary;
  }

  async listSummaries(user: AuthUser, candidateId: string): Promise<CandidateSummary[]> {
    await this.ensureCandidateAccess(user, candidateId);

    return this.summaryRepository.find({
      where: { candidateId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSummary(user: AuthUser, candidateId: string, summaryId: string): Promise<CandidateSummary> {
    await this.ensureCandidateAccess(user, candidateId);

    const summary = await this.summaryRepository.findOne({ where: { id: summaryId, candidateId } });
    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    return summary;
  }

  private async ensureCandidateAccess(user: AuthUser, candidateId: string): Promise<SampleCandidate> {
    const candidate = await this.candidateRepository.findOne({ where: { id: candidateId } });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (candidate.workspaceId !== user.workspaceId) {
      throw new ForbiddenException('Candidate does not belong to your workspace');
    }

    return candidate;
  }
}
