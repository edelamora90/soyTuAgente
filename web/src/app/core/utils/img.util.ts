// web/src/app/core/utils/img.util.ts
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBaseUrl || 'http://localhost:3000';
const PUBLIC_PREFIX = (environment.publicUrl || '/public').replace(/^\//, ''); // "public"

export function toPublicUrl(src?: string | null): string {
  if (!src) return 'assets/placeholders/agent.webp';

  const s = String(src).trim();

  // Absoluta (http/https)
  if (/^https?:\/\//i.test(s)) return s;

  // /public/…  →  http://host/public/…
  if (/^\/?public\//i.test(s)) {
    return `${API_BASE}/${s.replace(/^\/?public\//i, PUBLIC_PREFIX + '/')}`;
  }

  // assets o cualquier otro relativo dentro del frontend
  return s;
}
