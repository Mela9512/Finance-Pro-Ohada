import {
  Controller, Get, Post, Delete, Param, Query, UploadedFile,
  UseInterceptors, Body, Res, HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DocumentCategory } from '../../entities/document.entity';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // GET /api/documents — list all documents for the current company
  @Get()
  listDocuments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category?: string,
  ) {
    return this.documentsService.listDocuments(user.companyId, category);
  }

  // GET /api/documents/stats — storage stats
  @Get('stats')
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.getStats(user.companyId);
  }

  // POST /api/documents/upload — upload a file
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  }))
  uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name?: string,
    @Body('category') category?: DocumentCategory,
    @Body('tags') tags?: string,
    @Body('linkedPieceNumber') linkedPieceNumber?: string,
    @Body('linkedEntryId') linkedEntryId?: string,
  ) {
    return this.documentsService.uploadDocument(user.companyId, user.userId, file, {
      name,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      linkedPieceNumber,
      linkedEntryId,
    });
  }

  // GET /api/documents/:id/download-url — get a fresh signed download URL
  @Get(':id/download-url')
  getDownloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.documentsService.getDownloadUrl(user.companyId, id);
  }

  // DELETE /api/documents/:id — soft-delete a document
  @Delete(':id')
  @HttpCode(204)
  async deleteDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.documentsService.deleteDocument(user.companyId, id);
  }
}
