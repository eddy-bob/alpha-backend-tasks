import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { InitialStarterEntities1710000000000 } from '../migrations/1710000000000-InitialStarterEntities';
import { CandidateDocumentsAndSummaries1710001000000 } from '../migrations/1710001000000-CandidateDocumentsAndSummaries';
import { EntityIndexes1710002000000 } from '../migrations/1710002000000-EntityIndexes';

export const defaultDatabaseUrl =
  'postgres://assessment_user:assessment_pass@localhost:5432/assessment_db';

export const getTypeOrmOptions = (
  databaseUrl: string,
): TypeOrmModuleOptions & DataSourceOptions => ({
  type: 'postgres',
  url: databaseUrl,
  entities: [SampleWorkspace, SampleCandidate, CandidateDocument, CandidateSummary],
  migrations: [
    InitialStarterEntities1710000000000,
    CandidateDocumentsAndSummaries1710001000000,
    EntityIndexes1710002000000,
  ],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: false,
});
