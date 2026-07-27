import { IsIn, IsString, MinLength } from 'class-validator';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export class InvoiceOcrDto {
  @IsString()
  @MinLength(1)
  fileBase64: string;

  @IsIn(ALLOWED_MIME_TYPES)
  mimeType: string;
}
