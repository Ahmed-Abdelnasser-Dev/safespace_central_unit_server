/**
 * File signature (magic number) validation middleware.
 *
 * This validates uploaded files based on binary signatures, not MIME type alone.
 */

const fs = require('fs');
const fsp = require('fs/promises');
const AppError = require('../utils/AppError');

function isJpeg(buf) {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isPng(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return buf.length >= sig.length && sig.every((byte, i) => buf[i] === byte);
}

function isWebp(buf) {
  if (buf.length < 12) return false;
  return (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

function isRiffKind(buf, kind) {
  if (buf.length < 12) return false;
  return (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === kind
  );
}

function isEbml(buf) {
  return buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
}

function isMp4Like(buf) {
  if (buf.length < 12) return false;
  return buf.subarray(4, 8).toString('ascii') === 'ftyp';
}

function isMpegPs(buf) {
  return (
    buf.length >= 4 &&
    buf[0] === 0x00 &&
    buf[1] === 0x00 &&
    buf[2] === 0x01 &&
    (buf[3] === 0xba || buf[3] === 0xb3)
  );
}

function detectKind(buf) {
  if (isJpeg(buf)) return 'image/jpeg';
  if (isPng(buf)) return 'image/png';
  if (isWebp(buf)) return 'image/webp';
  if (isRiffKind(buf, 'AVI ')) return 'video/x-msvideo';
  if (isEbml(buf)) return 'video/webm';
  if (isMp4Like(buf)) return 'video/mp4';
  if (isMpegPs(buf)) return 'video/mpeg';
  return null;
}

async function readHeader(filePath, bytes = 64) {
  const handle = await fsp.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buffer, 0, bytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

async function cleanupFiles(files) {
  await Promise.all(
    files
      .filter((f) => f && f.path && fs.existsSync(f.path))
      .map((f) => fsp.unlink(f.path).catch(() => undefined))
  );
}

function getReqFiles(req) {
  if (Array.isArray(req.files)) return req.files;
  if (req.file) return [req.file];
  return [];
}

function validateFileSignatures(allowedKinds) {
  const allowed = new Set(allowedKinds);

  return async (req, res, next) => {
    try {
      const files = getReqFiles(req);
      if (files.length === 0) return next();

      const invalid = [];

      for (const file of files) {
        if (!file.path) {
          invalid.push(file);
          continue;
        }

        const header = await readHeader(file.path);
        const detectedKind = detectKind(header);
        if (!detectedKind || !allowed.has(detectedKind)) {
          invalid.push(file);
        }
      }

      if (invalid.length > 0) {
        await cleanupFiles(files);
        return next(new AppError('Invalid uploaded file signature detected', 400));
      }

      return next();
    } catch (error) {
      return next(new AppError(`File validation failed: ${error.message}`, 400));
    }
  };
}

const validateUploadedImageSignatures = validateFileSignatures([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const validateUploadedMediaSignatures = validateFileSignatures([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/x-msvideo',
  'video/mpeg',
]);

module.exports = {
  validateFileSignatures,
  validateUploadedImageSignatures,
  validateUploadedMediaSignatures,
};
