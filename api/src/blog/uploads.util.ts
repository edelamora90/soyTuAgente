// api/src/blog/uploads.util.ts
import { join, dirname, relative } from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';

// Igual que main.ts: raíz repo -> api/public
export const PUBLIC_ROOT = join(process.cwd(), 'api', 'public');

// Carpeta específica del blog
export const BLOG_ROOT = join(PUBLIC_ROOT, 'blog');

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Optimiza una imagen:
 *  - Reescala a máximo 1024×1024 (fit: inside)
 *  - Convierte a WebP
 *  - Reduce calidad hasta alcanzar `targetKB`
 *  - Guarda y devuelve { bytes, path }
 */
export async function saveOptimizedWebp(
  buffer: Buffer,
  outPath: string,
  opts: { maxWidth: number; targetKB: number },
): Promise<{ bytes: number; path: string }> {

  const { maxWidth, targetKB } = opts;

  // Garantiza carpeta final
  await fs.mkdir(dirname(outPath), { recursive: true });

  let quality = 80;
  let optimized: Buffer;

  while (quality >= 40) {
    optimized = await sharp(buffer)
      .resize({
        width: maxWidth,
        height: maxWidth,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    // Convert bytes → KB
    const sizeKB = optimized.length / 1024;

    if (sizeKB <= targetKB) break;

    // Reduce calidad e intenta nuevamente
    quality -= 10;
  }

  // Guarda buffer final
  await fs.writeFile(outPath, optimized!);

  return {
    bytes: optimized!.length,
    path: outPath,
  };
}

/**
 * Convierte una ruta absoluta dentro de PUBLIC_ROOT en
 * ruta servible pública:  /blog/slug/cover/archivo.webp
 */
export function toPublicRelative(savedPath: string): string {
  const rel = relative(PUBLIC_ROOT, savedPath).replace(/\\/g, '/');
  return `/${rel}`;
}
