import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SUMMARIZATION_PROVIDER, SummarizationProvider } from '../llm/summarization-provider.interface';
import { JobHandler, QueueService } from '../queue/queue.service';
import { CANDIDATE_SUMMARY_GENERATE_JOB, CandidateSummaryGenerateJobPayload } from './candidate-summary-job.types';

@Injectable()
export class CandidateSummaryWorker implements OnModuleInit {
  private readonly logger = new Logger(CandidateSummaryWorker.name);

  constructor(
    @InjectRepository(CandidateDocument)
    private readonly documentRepository: Repository<CandidateDocument>,
    @InjectRepository(CandidateSummary)
    private readonly summaryRepository: Repository<CandidateSummary>,
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,
    private readonly queueService: QueueService,
  ) {}

  onModuleInit(): void {
    const handler: JobHandler<CandidateSummaryGenerateJobPayload> = async (payload) => {
      await this.processSummaryGeneration(payload);
    };

    this.queueService.registerHandler(CANDIDATE_SUMMARY_GENERATE_JOB, handler);
  }

  private async processSummaryGeneration(payload: CandidateSummaryGenerateJobPayload): Promise<void> {
    const summary = await this.summaryRepository.findOne({ where: { id: payload.summaryId, candidateId: payload.candidateId } });
    if (!summary) {
      this.logger.warn(`Summary record ${payload.summaryId} not found for candidate ${payload.candidateId}`);
      return;
    }

    try {
      const documents = await this.documentRepository.find({
        where: { candidateId: payload.candidateId },
        order: { uploadedAt: 'ASC' },
      });

      if (documents.length === 0) {
        throw new Error('Cannot generate summary without any candidate documents');
      }

      const providerResult = await this.summarizationProvider.generateCandidateSummary({
        candidateId: payload.candidateId,
        documents: documents.map((doc) => `${doc.documentType}: ${doc.rawText}`),
      });

      summary.status = 'completed';
      summary.score = providerResult.score;
      summary.strengths = providerResult.strengths;
      summary.concerns = providerResult.concerns;
      summary.summary = providerResult.summary;
      summary.recommendedDecision = providerResult.recommendedDecision;
      summary.provider = this.summarizationProvider.name;
      summary.errorMessage = null;

      await this.summaryRepository.save(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown summary generation failure';

      summary.status = 'failed';
      summary.errorMessage = message;
      summary.provider = this.summarizationProvider.name;

      await this.summaryRepository.save(summary);
    }
  }
}
