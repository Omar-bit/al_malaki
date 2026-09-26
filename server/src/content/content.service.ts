import { promises as fs } from 'fs';
import { join } from 'path';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ContentMediaType } from '../generated/prisma';
import { CONTENT_SLOTS, isContentSlot, type ContentSlot } from './content.constants';
import { UpdateContentMediaDto } from './dto/update-content-media.dto';

export interface ContentMediaResponse {
  id: string;
  slot: string;
  type: 'image' | 'video';
  url: string;
  position: number;
  focalX: number;
  focalY: number;
  zoom: number;
}

/** All slots, always present — an empty slot returns an empty list. */
export type ContentResponse = Record<string, ContentMediaResponse[]>;

interface Actor {
  id: string;
  email: string;
}

const CONTENT_UPLOAD_DIR = './uploads/content';

/**
 * Build the public URL for an uploaded content file. `API_URL` is the base the
 * browser should use: `/api` in the single-origin production deploy (where
 * nginx serves these paths straight off the uploads volume), or the API origin
 * in local development.
 */
const getContentUrl = (filename: string): string => {
  if (filename.startsWith('http')) return filename;
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/content/${filename}`;
};

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  /** Every slot with its media, ordered for display. */
  async listContent(): Promise<ContentResponse> {
    const media = await this.prismaService.contentMedia.findMany({
      orderBy: [{ slot: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
    });

    const grouped: ContentResponse = {};
    for (const slot of CONTENT_SLOTS) {
      grouped[slot] = [];
    }

    for (const item of media) {
      if (!grouped[item.slot]) continue;
      grouped[item.slot].push(this.mapMedia(item));
    }

    return grouped;
  }

  async addMedia(
    slot: string,
    files: { filename: string; isVideo: boolean }[],
    actor?: Actor,
  ): Promise<ContentMediaResponse[]> {
    const validSlot = this.assertSlot(slot);

    if (files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const lastPosition = await this.prismaService.contentMedia.aggregate({
      where: { slot: validSlot },
      _max: { position: true },
    });

    let nextPosition = (lastPosition._max.position ?? -1) + 1;

    const created = await this.prismaService.$transaction(
      files.map((file) =>
        this.prismaService.contentMedia.create({
          data: {
            slot: validSlot,
            filename: file.filename,
            type: file.isVideo
              ? ContentMediaType.VIDEO
              : ContentMediaType.IMAGE,
            position: nextPosition++,
          },
        }),
      ),
    );

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        entityType: 'ContentMedia',
        action: 'CREATE',
        description: `Added ${created.length} media item(s) to "${validSlot}"`,
      });
    }

    return created.map((item) => this.mapMedia(item));
  }

  async updateMedia(
    id: string,
    dto: UpdateContentMediaDto,
    actor?: Actor,
  ): Promise<ContentMediaResponse> {
    const existing = await this.prismaService.contentMedia.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Content media not found');
    }

    const updated = await this.prismaService.contentMedia.update({
      where: { id },
      data: {
        focalX: dto.focalX ?? undefined,
        focalY: dto.focalY ?? undefined,
        zoom: dto.zoom ?? undefined,
        position: dto.position ?? undefined,
      },
    });

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        entityType: 'ContentMedia',
        entityId: updated.id,
        action: 'UPDATE',
        description: `Updated framing for a media item in "${updated.slot}"`,
      });
    }

    return this.mapMedia(updated);
  }

  async reorderSlot(
    slot: string,
    ids: string[],
    actor?: Actor,
  ): Promise<ContentMediaResponse[]> {
    const validSlot = this.assertSlot(slot);

    const existing = await this.prismaService.contentMedia.findMany({
      where: { slot: validSlot },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((item) => item.id));

    const unknownId = ids.find((id) => !existingIds.has(id));
    if (unknownId) {
      throw new BadRequestException(
        `Media "${unknownId}" does not belong to slot "${validSlot}"`,
      );
    }

    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.contentMedia.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        entityType: 'ContentMedia',
        action: 'UPDATE',
        description: `Reordered media in "${validSlot}"`,
      });
    }

    const reordered = await this.prismaService.contentMedia.findMany({
      where: { slot: validSlot },
      orderBy: { position: 'asc' },
    });

    return reordered.map((item) => this.mapMedia(item));
  }

  async deleteMedia(id: string, actor?: Actor): Promise<void> {
    const existing = await this.prismaService.contentMedia.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Content media not found');
    }

    await this.prismaService.contentMedia.delete({ where: { id } });
    await this.removeUploadedFile(existing.filename);

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        entityType: 'ContentMedia',
        entityId: existing.id,
        action: 'DELETE',
        description: `Removed a media item from "${existing.slot}"`,
      });
    }
  }

  private assertSlot(slot: string): ContentSlot {
    if (!isContentSlot(slot)) {
      throw new BadRequestException(`Unknown content slot "${slot}"`);
    }
    return slot;
  }

  /**
   * Best-effort cleanup of the file on disk. A failure here must not fail the
   * request — the database row is already gone, which is what the site reads.
   */
  private async removeUploadedFile(filename: string): Promise<void> {
    try {
      await fs.unlink(join(process.cwd(), CONTENT_UPLOAD_DIR, filename));
    } catch (error) {
      this.logger.warn(
        `Could not remove content file "${filename}": ${String(error)}`,
      );
    }
  }

  private mapMedia(item: {
    id: string;
    slot: string;
    type: ContentMediaType;
    filename: string;
    position: number;
    focalX: number;
    focalY: number;
    zoom: number;
  }): ContentMediaResponse {
    return {
      id: item.id,
      slot: item.slot,
      type: item.type === ContentMediaType.VIDEO ? 'video' : 'image',
      url: getContentUrl(item.filename),
      position: item.position,
      focalX: item.focalX,
      focalY: item.focalY,
      zoom: item.zoom,
    };
  }
}
