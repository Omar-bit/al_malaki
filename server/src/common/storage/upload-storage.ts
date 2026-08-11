import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed image MIME types mapped to a safe, server-controlled extension. */
const IMAGE_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/**
 * Build a multer options object for image uploads into `destination`.
 *
 * Filenames are generated with `crypto.randomUUID()` and the extension is
 * derived from the validated MIME type — never from the user-supplied
 * filename — which avoids path-traversal and extension-spoofing issues.
 */
export function createImageUploadOptions(destination: string): MulterOptions {
  return {
    storage: diskStorage({
      destination,
      filename: (_req, file, cb) => {
        const ext = IMAGE_MIME_EXTENSIONS[file.mimetype] ?? '';
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (IMAGE_MIME_EXTENSIONS[file.mimetype]) {
        cb(null, true);
        return;
      }
      cb(
        new BadRequestException(
          'Only image files are allowed (jpeg, png, webp, gif)',
        ),
        false,
      );
    },
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  };
}
