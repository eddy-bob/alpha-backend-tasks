export const CANDIDATE_SUMMARY_GENERATE_JOB = 'candidate.summary.generate';

export interface CandidateSummaryGenerateJobPayload {
  summaryId: string;
  candidateId: string;
}
