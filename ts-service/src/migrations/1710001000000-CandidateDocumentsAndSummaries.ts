import { MigrationInterface, QueryRunner, Table, TableCheck, TableForeignKey, TableIndex } from 'typeorm';

export class CandidateDocumentsAndSummaries1710001000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'candidate_documents',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'candidate_id', type: 'varchar', length: '64', isNullable: false },
          { name: 'document_type', type: 'varchar', length: '40', isNullable: false },
          { name: 'file_name', type: 'varchar', length: '255', isNullable: false },
          { name: 'storage_key', type: 'varchar', length: '255', isNullable: false },
          { name: 'raw_text', type: 'text', isNullable: false },
          { name: 'uploaded_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'candidate_documents',
      new TableForeignKey({
        name: 'fk_candidate_documents_candidate_id',
        columnNames: ['candidate_id'],
        referencedTableName: 'sample_candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'candidate_documents',
      new TableIndex({ name: 'idx_candidate_documents_candidate_id', columnNames: ['candidate_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'candidate_summaries',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'candidate_id', type: 'varchar', length: '64', isNullable: false },
          { name: 'status', type: 'varchar', length: '16', isNullable: false },
          { name: 'score', type: 'int', isNullable: true },
          { name: 'strengths', type: 'text[]', default: "'{}'", isNullable: false },
          { name: 'concerns', type: 'text[]', default: "'{}'", isNullable: false },
          { name: 'summary', type: 'text', isNullable: true },
          { name: 'recommended_decision', type: 'varchar', length: '20', isNullable: true },
          { name: 'provider', type: 'varchar', length: '60', isNullable: false },
          { name: 'prompt_version', type: 'varchar', length: '40', isNullable: false },
          { name: 'error_message', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        checks: [new TableCheck({ name: 'chk_candidate_summaries_status', expression: "status IN ('pending','completed','failed')" })],
      }),
    );

    await queryRunner.createForeignKey(
      'candidate_summaries',
      new TableForeignKey({
        name: 'fk_candidate_summaries_candidate_id',
        columnNames: ['candidate_id'],
        referencedTableName: 'sample_candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({ name: 'idx_candidate_summaries_candidate_id', columnNames: ['candidate_id'] }),
    );

    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({ name: 'idx_candidate_summaries_candidate_status', columnNames: ['candidate_id', 'status'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_candidate_status');
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_candidate_id');
    await queryRunner.dropForeignKey('candidate_summaries', 'fk_candidate_summaries_candidate_id');
    await queryRunner.dropTable('candidate_summaries');

    await queryRunner.dropIndex('candidate_documents', 'idx_candidate_documents_candidate_id');
    await queryRunner.dropForeignKey('candidate_documents', 'fk_candidate_documents_candidate_id');
    await queryRunner.dropTable('candidate_documents');
  }
}
