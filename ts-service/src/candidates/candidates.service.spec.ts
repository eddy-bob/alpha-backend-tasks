import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { QueueService } from '../queue/queue.service';
import { CandidatesService } from './candidates.service';

describe('CandidatesService', () => {
  let service: CandidatesService;

  const candidateRepository = {
    findOne: jest.fn(),
  };

  const documentRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const summaryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const queueService = {
    enqueue: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        {
          provide: getRepositoryToken(SampleCandidate),
          useValue: candidateRepository,
        },
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: documentRepository,
        },
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: summaryRepository,
        },
        {
          provide: QueueService,
          useValue: queueService,
        },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  it('uploads a document for an in-workspace candidate', async () => {
    candidateRepository.findOne.mockResolvedValue({ id: 'c-1', workspaceId: 'w-1' });
    documentRepository.create.mockImplementation((value: unknown) => value);
    documentRepository.save.mockImplementation(async (value: unknown) => value);

    const result = await service.uploadDocument(
      { userId: 'u-1', workspaceId: 'w-1' },
      'c-1',
      {
        documentType: 'resume' as never,
        fileName: 'resume.txt',
        storageKey: 'local/resume.txt',
        rawText: 'Senior backend engineer',
      },
    );

    expect(result.candidateId).toBe('c-1');
    expect(result.documentType).toBe('resume');
    expect(documentRepository.save).toHaveBeenCalled();
  });

  it('enqueues a summary generation job', async () => {
    candidateRepository.findOne.mockResolvedValue({ id: 'c-1', workspaceId: 'w-1' });
    summaryRepository.create.mockImplementation((value: unknown) => value);
    summaryRepository.save.mockImplementation(async (value: any) => ({ ...value, id: 's-1' }));

    const result = await service.requestSummaryGeneration(
      { userId: 'u-1', workspaceId: 'w-1' },
      'c-1',
    );

    expect(result.status).toBe('pending');
    expect(queueService.enqueue).toHaveBeenCalledWith('candidate.summary.generate', {
      summaryId: 's-1',
      candidateId: 'c-1',
    });
  });

  it('rejects cross-workspace candidate access', async () => {
    candidateRepository.findOne.mockResolvedValue({ id: 'c-1', workspaceId: 'w-2' });

    await expect(
      service.listSummaries({ userId: 'u-1', workspaceId: 'w-1' }, 'c-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('fails when candidate does not exist', async () => {
    candidateRepository.findOne.mockResolvedValue(null);

    await expect(
      service.listSummaries({ userId: 'u-1', workspaceId: 'w-1' }, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
