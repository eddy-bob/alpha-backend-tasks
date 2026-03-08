import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FakeSummarizationProvider } from './fake-summarization.provider';
import { GeminiSummarizationProvider } from './gemini-summarization.provider';
import { SUMMARIZATION_PROVIDER } from './summarization-provider.interface';

@Module({
  providers: [
    FakeSummarizationProvider,
    GeminiSummarizationProvider,
    {
      provide: SUMMARIZATION_PROVIDER,
      inject: [ConfigService, FakeSummarizationProvider, GeminiSummarizationProvider],
      useFactory: (
        configService: ConfigService,
        fakeProvider: FakeSummarizationProvider,
        geminiProvider: GeminiSummarizationProvider,
      ) => {
        const provider = configService.get<string>('SUMMARY_PROVIDER')?.toLowerCase();

        if (provider === 'gemini') {
          return geminiProvider;
        }

        return fakeProvider;
      },
    },
  ],
  exports: [SUMMARIZATION_PROVIDER, FakeSummarizationProvider, GeminiSummarizationProvider],
})
export class LlmModule {}
