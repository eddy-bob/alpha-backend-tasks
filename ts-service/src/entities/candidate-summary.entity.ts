import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SampleCandidate } from './sample-candidate.entity';

export type CandidateSummaryStatus = 'pending' | 'completed' | 'failed';

@Entity({ name: 'candidate_summaries' })
export class CandidateSummary {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'candidate_id', type: 'varchar', length: 64 })
  candidateId!: string;

  @Column({ type: 'varchar', length: 16 })
  status!: CandidateSummaryStatus;

  @Column({ type: 'int', nullable: true })
  score!: number | null;

  @Column({ type: 'text', array: true, default: '{}' })
  strengths!: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  concerns!: string[];

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ name: 'recommended_decision', type: 'varchar', length: 20, nullable: true })
  recommendedDecision!: string | null;

  @Column({ type: 'varchar', length: 60 })
  provider!: string;

  @Column({ name: 'prompt_version', type: 'varchar', length: 40 })
  promptVersion!: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => SampleCandidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: SampleCandidate;
}
