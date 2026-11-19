import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(currentDir, '../uploads');

const ALLOWED_MIME_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter(_req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(
        ApiError.badRequest('Upload a JPEG, PNG, or WebP image.')
      );
      return;
    }
    callback(null, true);
  },
});

function uploadToCloudinary(buffer, folder = 'cravio') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(ApiError.badRequest('The image could not be uploaded. Please try again.'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          provider: 'cloudinary',
        });
      }
    );

    stream.end(buffer);
  });
}

async function uploadToDisk(buffer, mimetype) {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const extension = ALLOWED_MIME_TYPES.get(mimetype) || '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return {
    url: `/uploads/${filename}`,
    publicId: filename,
    provider: 'local',
  };
}

export async function storeImage(file) {
  if (!file?.buffer?.length) {
    throw ApiError.badRequest('Choose an image to upload.');
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw ApiError.badRequest('Upload a JPEG, PNG, or WebP image.');
  }

  if (env.cloudinaryEnabled) {
    return uploadToCloudinary(file.buffer);
  }

  return uploadToDisk(file.buffer, file.mimetype);
}

export { UPLOAD_DIR };
