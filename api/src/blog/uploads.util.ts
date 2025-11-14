// api/src/blog/uploads.util.ts
import { promises as fs } from 'fs';
import { join, resolve, sep } from 'path';
import sharp from 'sharp';

const UPLOADS_DIR_ENV = process.env.UPLOADS_DIR;
export const UPLOADS_ROOT = UPLOADS_DIR_ENV
  ? resolve(UPLOADS_DIR_ENV)
  : resolve(process.cwd(), 'api', 'uploads');

// ✔️ Solo una carpeta "blog"
export const BLOG_ROOT = join(UPLOADS_ROOT, 'blog');

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function saveOptimizedWebp(
  data: Buffer,
  outPath: string,
  opts: { maxWidth: number; targetKB: number }
): Promise<{ bytes: number; path: string }> {
  const targetBytes = opts.targetKB * 1024;
  let quality = 80;
  let width = opts.maxWidth;

  while (quality >= 50) {
    const webpBuf = await sharp(data).rotate().resize({ width, withoutEnlargement: true })
      .webp({ quality }).toBuffer();
    if (webpBuf.length <= targetBytes) {
      await fs.writeFile(outPath, webpBuf);
      return { bytes: webpBuf.length, path: outPath };
    }
    if (quality > 60) quality -= 10;
    else { width = Math.max(Math.floor(width * 0.9), 800); quality -= 5; }
  }

  const last = await sharp(data).rotate().resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 50 }).toBuffer();
  await fs.writeFile(outPath, last);
  return { bytes: last.length, path: outPath };
}

export function publicUrlFromPath(absPath: string, baseUrl: string) {
  const root = UPLOADS_ROOT.endsWith(sep) ? UPLOADS_ROOT : UPLOADS_ROOT + sep;
  const rel = absPath.startsWith(root) ? absPath.substring(root.length) : '';
  const prefix = baseUrl.replace(/\/+$/, '');
  return `${prefix}/public/${rel.replace(/\\/g, '/')}`;
}
