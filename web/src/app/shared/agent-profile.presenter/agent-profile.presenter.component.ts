// web/src/app/shared/agent-profile.presenter/agent-profile.presenter.component.ts
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AgentProfileVM } from '../../pages/agentes/profile/agent-profile.vm';

type Estado = { name: string; slug: string };

const ESTADOS_CAT: Estado[] = [
  { name: 'Aguascalientes', slug: 'aguascalientes' },
  { name: 'Baja California', slug: 'baja-california' },
  { name: 'Baja California Sur', slug: 'baja-california-sur' },
  { name: 'Campeche', slug: 'campeche' },
  { name: 'Coahuila de Zaragoza', slug: 'coahuila-de-zaragoza' },
  { name: 'Colima', slug: 'colima' },
  { name: 'Chiapas', slug: 'chiapas' },
  { name: 'Chihuahua', slug: 'chihuahua' },
  { name: 'Ciudad de México', slug: 'ciudad-de-mexico' },
  { name: 'Durango', slug: 'durango' },
  { name: 'Guanajuato', slug: 'guanajuato' },
  { name: 'Guerrero', slug: 'guerrero' },
  { name: 'Hidalgo', slug: 'hidalgo' },
  { name: 'Jalisco', slug: 'jalisco' },
  { name: 'México', slug: 'mexico' },
  { name: 'Michoacán de Ocampo', slug: 'michoacan-de-ocampo' },
  { name: 'Morelos', slug: 'morelos' },
  { name: 'Nayarit', slug: 'nayarit' },
  { name: 'Nuevo León', slug: 'nuevo-leon' },
  { name: 'Oaxaca', slug: 'oaxaca' },
  { name: 'Puebla', slug: 'puebla' },
  { name: 'Querétaro', slug: 'queretaro' },
  { name: 'Quintana Roo', slug: 'quintana-roo' },
  { name: 'San Luis Potosí', slug: 'san-luis-potosi' },
  { name: 'Sinaloa', slug: 'sinaloa' },
  { name: 'Sonora', slug: 'sonora' },
  { name: 'Tabasco', slug: 'tabasco' },
  { name: 'Tamaulipas', slug: 'tamaulipas' },
  { name: 'Tlaxcala', slug: 'tlaxcala' },
  { name: 'Veracruz de Ignacio de la Llave', slug: 'veracruz-de-ignacio-de-la-llave' },
  { name: 'Yucatán', slug: 'yucatan' },
  { name: 'Zacatecas', slug: 'zacatecas' },
];

function slugify(s: string): string {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Component({
  selector: 'app-agent-profile-presenter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-profile.presenter.component.html',
  styleUrls: ['./agent-profile.presenter.component.scss'],
})
export class AgentProfilePresenterComponent implements OnChanges {
  @Input({ required: true }) agent!: AgentProfileVM | null;
  @Input() loading = false;

  private http = inject(HttpClient);

  /** Lista final a mostrar (una línea por “Municipio, Estado”) */
  locations: string[] = [];

  // ===== Redes (sin cambios) =====
  get socials() {
    return Array.isArray(this.agent?.redes) ? this.agent!.redes : [];
  }

  resolveIcon(icon: string): string {
    const v = String(icon || '').trim();
    if (!v) return 'assets/icons/link.svg';
    if (/^https?:\/\//i.test(v)) return v;
    const lower = v.toLowerCase();
    const known: Record<string,string> = {
      facebook:  'assets/icons/facebook.svg',
      instagram: 'assets/icons/instagram.svg',
      linkedin:  'assets/icons/linkedin.svg',
      tiktok:    'assets/icons/tiktok.svg',
      x:         'assets/icons/x.svg',
      twitter:   'assets/icons/x.svg',
      youtube:   'assets/icons/youtube.svg',
      link:      'assets/icons/link.svg',
    };
    if (known[lower]) return known[lower];
    if (lower.startsWith('assets/')) return v;
    return 'assets/icons/link.svg';
  }

  ngOnChanges(ch: SimpleChanges) {
    if (ch['agent']) {
      this.resolveLocations();
      try { console.log('[Presenter] redes:', this.agent?.redes); } catch {/**/ }
    }
  }

  /** Construye `locations` según lo que haya en el agente */
  private async resolveLocations() {
    const a = this.agent || ({} as any);

    // 1) Si ya viene `ubicaciones: string[]`, úsala tal cual.
    if (Array.isArray(a.ubicaciones) && a.ubicaciones.length) {
      this.locations = a.ubicaciones.filter(Boolean);
      return;
    }

    // 2) Si hay arrays de estados/municipios, empareja.
    const estados: string[] = Array.isArray(a.estados) ? a.estados.filter(Boolean) : [];
    const municipiosSel: string[] = Array.isArray(a.municipios) ? a.municipios.filter(Boolean) : [];

    if (estados.length && municipiosSel.length) {
      // Un solo estado → todos sus municipios van con ese estado.
      if (estados.length === 1) {
        this.locations = municipiosSel.map(m => `${m}, ${estados[0]}`);
        return;
      }

      // Varios estados → cargamos los JSON de assets y mapeamos municipio → estado.
      const stateMunicipiosMap = new Map<string, Set<string>>();
      await Promise.all(
        estados.map(async (edo) => {
          const slug = ESTADOS_CAT.find(e => e.name === edo)?.slug ?? slugify(edo);
          const url = `assets/locations/municipios/${slug}.json`;
          try {
            const list = await this.http.get<string[]>(url).toPromise();
            stateMunicipiosMap.set(edo, new Set((list || []).map(s => s.trim())));
          } catch {
            stateMunicipiosMap.set(edo, new Set());
          }
        })
      );

      const out: string[] = [];
      for (const m of municipiosSel) {
        let paired = false;
        for (const [edo, set] of stateMunicipiosMap.entries()) {
          if (set.has(m)) {
            out.push(`${m}, ${edo}`);
            paired = true;
            break;
          }
        }
        if (!paired) {
          // si no encontramos el estado para ese municipio, lo emparejamos con el primero seleccionado
          out.push(`${m}, ${estados[0]}`);
        }
      }
      // evita duplicados y ordena alfabéticamente
      this.locations = Array.from(new Set(out)).sort((a, b) => a.localeCompare(b, 'es'));
      return;
    }

    // 3) Fallback legacy: solo `ubicacion: string`
    if (a.ubicacion) {
      this.locations = [a.ubicacion];
      return;
    }

    this.locations = [];
  }

  // -------- CTA helpers --------
  get phoneHref(): string | null {
    const raw = (this.agent as any)?.telefono ?? (this.agent as any)?.whatsapp ?? '';
    const digits = String(raw).replace(/\D+/g, '');
    return digits ? `tel:${digits}` : null;
  }

  iconFor(raw: string): string | null {
    const e = (raw || '').toLowerCase().trim();
    if (e.includes('vehículo') || e.includes('vehiculo') || e.includes('auto') || e.includes('vehiculos'))
      return 'assets/icons/rep-auto.svg';
    if (e.includes('salud') || e.includes('bienestar') || e.includes('médic') || e.includes('medic'))
      return 'assets/icons/corazon.svg';
    if (e.includes('hogar') || e.includes('casa') || e.includes('negocio'))
      return 'assets/icons/seguro-hogar.svg';
    if (e.includes('inversión') || e.includes('inversion') || e.includes('ahorro'))
      return 'assets/icons/obtener-dinero.svg';
    return null;
  }

  openWhatsApp() {
    const phoneRaw = (this.agent as any)?.whatsapp ?? (this.agent as any)?.telefono ?? '';
    const phone = String(phoneRaw).replace(/\D+/g, '');
    if (!phone) return;
    const nombre = prompt('¿Cómo te llamas? (se incluirá en el mensaje)')?.trim();
    const text = nombre
      ? `Hola, soy ${nombre} y te contacto desde la plataforma de Soy tu Agente.`
      : `Hola, te contacto desde la plataforma de Soy tu Agente.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  // -------- Galería --------
  showLightbox = false;
  currentIndex = 0;
  currentImg: string | null = null;
  get thumbs(): string[] { return this.agent?.mediaThumbs ?? []; }

  openGallery(src: string) {
    const i = this.thumbs.indexOf(src);
    this.currentIndex = i >= 0 ? i : 0;
    this.currentImg = this.thumbs[this.currentIndex] ?? null;
    this.showLightbox = !!this.currentImg;
  }
  closeGallery() { this.showLightbox = false; this.currentImg = null; }
  prev() { if (!this.thumbs.length) return; this.currentIndex = (this.currentIndex - 1 + this.thumbs.length) % this.thumbs.length; this.currentImg = this.thumbs[this.currentIndex]; }
  next() { if (!this.thumbs.length) return; this.currentIndex = (this.currentIndex + 1) % this.thumbs.length; this.currentImg = this.thumbs[this.currentIndex]; }

  trackByIndex = (i: number) => i;
}
