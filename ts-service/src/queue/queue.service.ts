import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

export interface EnqueuedJob<TPayload = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  enqueuedAt: string;
}

export type JobHandler<TPayload = unknown> = (payload: TPayload) => Promise<void>;

@Injectable()
export class QueueService {
  private readonly jobs: EnqueuedJob[] = [];
  private readonly handlers = new Map<string, JobHandler>();

  enqueue<TPayload>(name: string, payload: TPayload): EnqueuedJob<TPayload> {
    const job: EnqueuedJob<TPayload> = {
      id: randomUUID(),
      name,
      payload,
      enqueuedAt: new Date().toISOString(),
    };

    this.jobs.push(job);

    queueMicrotask(() => {
      void this.processJob(job);
    });

    return job;
  }

  registerHandler<TPayload>(name: string, handler: JobHandler<TPayload>): void {
    this.handlers.set(name, handler as JobHandler);
  }

  getQueuedJobs(): readonly EnqueuedJob[] {
    return this.jobs;
  }

  private async processJob(job: EnqueuedJob): Promise<void> {
    const handler = this.handlers.get(job.name);

    if (!handler) {
      return;
    }

    await handler(job.payload);
  }
}
