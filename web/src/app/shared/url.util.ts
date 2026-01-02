import { environment } from '../../environments/environment';


export function toPublicUrl(input?: string | null): string {
  if (!input) return '';

  const value = String(input).trim();

  // ✅ Ya es URL absoluta
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  // ✅ data:image
  if (value.startsWith('data:')) {
    return value;
  }

  // ✅ assets del frontend
  if (value.startsWith('assets/')) {
    return value;
  }

  // ✅ rutas del backend (/public/...)
  if (value.startsWith('/public/')) {
    return `${window.location.origin}${value}`;
  }

  // fallback seguro
  return `${window.location.origin}/public/${value.replace(/^\/+/, '')}`;
}
