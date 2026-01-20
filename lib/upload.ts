import formidable, { File as FormidableFile } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { IncomingMessage } from 'http';
import type { UploadedFile } from '@/types';
import { validateFile } from '@/utils/validateFile';
import { validateFileSecurely } from '@/lib/file-security';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10) * 1024 * 1024;

export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export interface ParsedFormData {
  files: UploadedFile[];
  fields: formidable.Fields;
}

export async function parseFormData(req: IncomingMessage): Promise<ParsedFormData> {
  await ensureUploadDir();

  const form = formidable({
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
    maxFileSize: MAX_FILE_SIZE,
    filename: (name, ext, part) => {
      const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
      return `${uniqueSuffix}${ext}`;
    },
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(new Error(`File upload failed: ${err.message}`));
        return;
      }

      const uploadedFiles: UploadedFile[] = [];

      Object.values(files).forEach((fileArray) => {
        const fileList = Array.isArray(fileArray) ? fileArray : [fileArray];
        fileList.forEach((file) => {
          if (file && file.filepath) {
            const validation = validateFile(
              file.mimetype || '',
              file.size,
              file.originalFilename || ''
            );

            if (!validation.valid) {
              fs.unlink(file.filepath).catch(console.error);
              reject(new Error(validation.error));
              return;
            }

            uploadedFiles.push({
              filepath: file.filepath,
              originalFilename: file.originalFilename || 'unknown',
              mimetype: file.mimetype || 'application/octet-stream',
              size: file.size,
            });
          }
        });
      });

      if (uploadedFiles.length === 0) {
        reject(new Error('No valid files uploaded'));
        return;
      }

      resolve({
        files: uploadedFiles,
        fields,
      });
    });
  });
}

export async function saveUploadedFile(file: File, filename?: string): Promise<UploadedFile> {
  await ensureUploadDir();

  const buffer = Buffer.from(await file.arrayBuffer());
  const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
  const ext = path.extname(filename || file.name);
  const savedFilename = `${uniqueSuffix}${ext}`;
  const filepath = path.join(UPLOAD_DIR, savedFilename);

  await fs.writeFile(filepath, buffer);

  // Perform security validation on uploaded file
  const securityCheck = await validateFileSecurely(filepath, file.type, filename || file.name);

  if (!securityCheck.valid) {
    // Delete the file if security check fails
    await cleanupUploadedFile(filepath);
    throw new Error(`Security validation failed: ${securityCheck.error}`);
  }

  // Log warnings if any (but allow upload)
  if (securityCheck.warnings && securityCheck.warnings.length > 0) {
    console.warn(
      `[Security] File validation warnings for ${savedFilename}:`,
      securityCheck.warnings
    );
  }

  return {
    filepath,
    originalFilename: filename || file.name,
    mimetype: file.type,
    size: buffer.length,
  };
}

export async function cleanupUploadedFile(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath);
  } catch (error) {
    console.error(`Failed to cleanup uploaded file ${filepath}:`, error);
  }
}

export async function getFileStats(filepath: string): Promise<{
  size: number;
  createdAt: Date;
  modifiedAt: Date;
}> {
  const stats = await fs.stat(filepath);
  return {
    size: stats.size,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
  };
}
