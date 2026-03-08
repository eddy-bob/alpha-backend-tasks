import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class EntityIndexes1710002000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'sample_candidates',
      new TableIndex({
        name: 'idx_sample_candidates_workspace_created_at',
        columnNames: ['workspace_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_documents',
      new TableIndex({
        name: 'idx_candidate_documents_candidate_uploaded_at',
        columnNames: ['candidate_id', 'uploaded_at'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({
        name: 'idx_candidate_summaries_candidate_created_at',
        columnNames: ['candidate_id', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_candidate_created_at');
    await queryRunner.dropIndex('candidate_documents', 'idx_candidate_documents_candidate_uploaded_at');
    await queryRunner.dropIndex('sample_candidates', 'idx_sample_candidates_workspace_created_at');
  }
}
