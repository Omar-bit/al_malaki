import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { Role } from '../generated/prisma';
import {
  createMediaUploadOptions,
  isVideoMimeType,
} from '../common/storage/upload-storage';
import {
  ContentService,
  ContentMediaResponse,
  ContentResponse,
} from './content.service';
import { UpdateContentMediaDto } from './dto/update-content-media.dto';
import { ReorderContentMediaDto } from './dto/reorder-content-media.dto';

@Controller('admin/content')
@UseGuards(JwtAuthGuard, AdminGuard)
@Roles(Role.ADMIN)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  async listContent(): Promise<ContentResponse> {
    return this.contentService.listContent();
  }

  @Post(':slot/media')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('media', 12, createMediaUploadOptions('./uploads/content')),
  )
  async uploadMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slot') slot: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ContentMediaResponse[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    return this.contentService.addMedia(
      slot,
      files.map((file) => ({
        filename: file.filename,
        isVideo: isVideoMimeType(file.mimetype),
      })),
      { id: user.userId, email: user.email },
    );
  }

  @Patch('media/:id')
  async updateMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateContentMediaDto,
  ): Promise<ContentMediaResponse> {
    return this.contentService.updateMedia(id, dto, {
      id: user.userId,
      email: user.email,
    });
  }

  @Patch(':slot/reorder')
  async reorderSlot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slot') slot: string,
    @Body() dto: ReorderContentMediaDto,
  ): Promise<ContentMediaResponse[]> {
    return this.contentService.reorderSlot(slot, dto.ids, {
      id: user.userId,
      email: user.email,
    });
  }

  @Delete('media/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.contentService.deleteMedia(id, {
      id: user.userId,
      email: user.email,
    });
  }
}
