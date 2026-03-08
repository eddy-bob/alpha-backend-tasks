import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  RecommendedDecision,
  SummarizationProvider,
} from './summarization-provider.interface';

interface GeminiJsonResponse {
  score: number;
  strengths: string[];
  concerns: string[];
  summary: string;
  recommendedDecision: RecommendedDecision;
}

@Injectable()
export class GeminiSummarizationProvider implements SummarizationProvider {
  readonly name = 'gemini-1.5-flash';

  constructor(private readonly configService: ConfigService) {}

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const prompt = this.buildPrompt(input);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.name}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini request failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Gemini response did not include summary content');
    }

    let parsed: GeminiJsonResponse;
    try {
      parsed = JSON.parse(rawText) as GeminiJsonResponse;
    } catch {
      throw new Error('Gemini returned malformed JSON');
    }

    this.validateStructuredResult(parsed);

    return parsed;
  }

  private buildPrompt(input: CandidateSummaryInput): string {
    return [
      'You are an assistant creating a recruiter-facing candidate summary.',
      'Return strict JSON only with keys: score (0-100 integer), strengths (string[]), concerns (string[]), summary (string), recommendedDecision (advance|hold|reject).',
      `Candidate ID: ${input.candidateId}`,
      'Candidate documents:',
      ...input.documents.map((document, index) => `Document ${index + 1}: ${document}`),
    ].join('\n');
  }

  private validateStructuredResult(result: GeminiJsonResponse): void {
    if (!Number.isInteger(result.score) || result.score < 0 || result.score > 100) {
      throw new Error('Gemini JSON score must be an integer from 0 to 100');
    }

    if (!Array.isArray(result.strengths) || !result.strengths.every((item) => typeof item === 'string')) {
      throw new Error('Gemini JSON strengths must be a string array');
    }

    if (!Array.isArray(result.concerns) || !result.concerns.every((item) => typeof item === 'string')) {
      throw new Error('Gemini JSON concerns must be a string array');
    }

    if (typeof result.summary !== 'string' || result.summary.trim().length === 0) {
      throw new Error('Gemini JSON summary must be a non-empty string');
    }

    if (!['advance', 'hold', 'reject'].includes(result.recommendedDecision)) {
      throw new Error('Gemini JSON recommendedDecision must be advance|hold|reject');
    }
  }
}
