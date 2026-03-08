import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SUMMARIZATION_PROVIDER } from '../llm/summarization-provider.interface';
import { QueueService } from '../queue/queue.service';
import { CandidateSummaryWorker } from './candidate-summary.worker';

describe('CandidateSummaryWorker', () => {
  const documentRepository = {
    find: jest.fn(),
  };

  const summaryRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const provider = {
    name: 'fake',
    generateCandidateSummary: jest.fn(),
  };

  let queueService: QueueService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateSummaryWorker,
        QueueService,
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: documentRepository,
        },
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: summaryRepository,
        },
        {
          provide: SUMMARIZATION_PROVIDER,
          useValue: provider,
        },
      ],
    }).compile();

    queueService = module.get<QueueService>(QueueService);
    module.get<CandidateSummaryWorker>(CandidateSummaryWorker).onModuleInit();
  });

  it('marks summary completed when provider succeeds', async () => {
    summaryRepository.findOne.mockResolvedValue({
      id: 's-1',
      candidateId: 'c-1',
      status: 'pending',
    });
    documentRepository.find.mockResolvedValue([
      { documentType: 'resume', rawText: 'Node.js and NestJS' },
    ]);
    provider.generateCandidateSummary.mockResolvedValue({
      score: 86,
      strengths: ['API design'],
      concerns: ['Limited cloud scale'],
      summary: 'Strong backend candidate.',
      recommendedDecision: 'advance',
    });

    queueService.enqueue('candidate.summary.generate', {
      summaryId: 's-1',
      candidateId: 'c-1',
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(summaryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        provider: 'fake',
      }),
    );
  });
});
