// Devuelve una URL de imagen válida para portada de posts
export function buildCoverUrl(src?: string | null): string {
  if (!src) return 'assets/blog/fallback.webp';

  const s = src.trim();

  // Ya es absoluta
  if (/^https?:\/\//i.test(s)) return s;

  // Ya viene con /public
  if (s.startsWith('/public/')) return s;

  // Caso común: sólo el nombre/relativo -> servimos desde /public
  return `/public/${s}`;
}
