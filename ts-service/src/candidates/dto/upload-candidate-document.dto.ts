import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export enum CandidateDocumentType {
  Resume = 'resume',
  CoverLetter = 'cover_letter',
  Portfolio = 'portfolio',
  Other = 'other',
}

export class UploadCandidateDocumentDto {
  @IsEnum(CandidateDocumentType)
  documentType!: CandidateDocumentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  storageKey!: string;

  @IsString()
  @IsNotEmpty()
  rawText!: string;
}
