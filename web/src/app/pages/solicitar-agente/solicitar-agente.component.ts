//web/src/app/pages/solicitar-agente/solicitar-agente.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { SubmissionsApi } from '../../core/submissions/submissions.api';
import { MultiCheckComponent } from '../../shared/multi-check/multi-check.component';

/* =========== util =========== */
function slugify(s: string): string {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

/* =========== Catálogos compartidos =========== */
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

const CERTS = ['Qualitas Pro 2024', 'AXA Health Partner', 'GNP Agente Elite', 'MetLife Senior'];

const CARRIER_LOGOS: Record<string, string> = {
  Qualitas: 'assets/aseguradoras/Qualitas.png',
  Allianz: 'assets/aseguradoras/Allianz.png',
  AXA: 'assets/aseguradoras/Axa.png',
  GNP: 'assets/aseguradoras/Gnp.png',
  HDI: 'assets/aseguradoras/Hdi.png',
  INBURSA: 'assets/aseguradoras/Inbursa.png',
  MAPFRE: 'assets/aseguradoras/Mapfre.png',
  MetLife: 'assets/aseguradoras/Metlife.png',
  Primero: 'assets/aseguradoras/Primeroseguros.png',
  'Seguros Atlas': 'assets/aseguradoras/Segurosatlas.png',
  'Seguros Monterrey': 'assets/aseguradoras/Segurosmonterrey.png',
  Sura: 'assets/aseguradoras/Sura.png',
  Zurich: 'assets/aseguradoras/Zurich.png',
};
const CARRIERS = Object.keys(CARRIER_LOGOS);
const norm = (s: string) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
const CARRIER_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(CARRIER_LOGOS).map(([n, u]) => [norm(n), u]),
);
const carrierToLogo = (v: string) => {
  if (!v) return v;
  if (/^https?:\/\//i.test(v) || v.startsWith('assets/')) return v;
  return CARRIER_LOOKUP[norm(v)] ?? v;
};

const SERVICES_BY_ESPECIALIDAD: Record<string, string[]> = {
  vehiculos: ['Autos particulares', 'Pickups y Vans', 'Amplia / Limitada', 'RC'],
  'hogar-negocio': ['Seguro de hogar', 'PyME', 'Daños a terceros', 'Equipo electrónico'],
  'salud-asistencia': ['Gastos médicos mayores', 'Seguro dental', 'Accidentes personales'],
};

/* Redes (igual que admin) */
type SocialKey = 'facebook' | 'instagram' | 'linkedin' | 'tiktok';
const SOCIALS: Array<{ key: SocialKey; label: string; icon: string; base: string }> = [
  { key: 'facebook', label: 'Facebook', icon: 'assets/icons/facebook.svg', base: 'https://facebook.com' },
  { key: 'instagram', label: 'Instagram', icon: 'assets/icons/instagram.svg', base: 'https://instagram.com' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'assets/icons/linkedin.svg', base: 'https://linkedin.com/in' },
  { key: 'tiktok', label: 'TikTok', icon: 'assets/icons/tiktok.svg', base: 'https://tiktok.com/@' },
];

@Component({
  selector: 'app-solicitar-agente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MultiCheckComponent],
  templateUrl: './solicitar-agente.component.html',
  styleUrls: ['./solicitar-agente.component.scss'],
})
export class SolicitarAgenteComponent {
  private fb = inject(FormBuilder);
  private api = inject(SubmissionsApi);
  private router = inject(Router);
  private http = inject(HttpClient);

  sending = signal(false);
  ok = signal(false);
  errorMsg = signal<string | null>(null);

  // ======= Estados / Municipios (multi) =======
  estadosCat = ESTADOS_CAT;
  private _municipios = signal<string[]>([]);
  private _loadingMun = signal(false);
  loadingMun() { return this._loadingMun(); }
  get allMunicipios() { return this._municipios(); }

  // ======= Drag & drop (igual que admin) =======
  dragOverAvatar = signal(false);
  dragOverGallery = signal(false);
  avatarPreview = signal<string | null>(null);
  galleryPreviews = signal<string[]>([]);

  // ======= Redes (igual que admin) =======
  private socialEnabled = new Set<SocialKey>();
  private socialUser = new Map<SocialKey, string>();
  isSocialEnabled(k: SocialKey) { return this.socialEnabled.has(k); }
  setSocialEnabled(k: SocialKey, on: boolean) { if (on) this.socialEnabled.add(k); else this.socialEnabled.delete(k); }
  getSocialUsername(k: SocialKey) { return this.socialUser.get(k) ?? ''; }
  setSocialUsername(k: SocialKey, v: string) { this.socialUser.set(k, v?.trim()); }

  // ======= FORM =======
  form = this.fb.group({
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]*$/)]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    cedula: ['', [Validators.required]],

    // multi selección (como admin)
    estados: this.fb.control<string[]>([]),
    municipios: this.fb.control<string[]>([]),
    ubicacion: [''],

    // imágenes
    mediaHero: [''],               // igualaremos a avatar si no hay
    avatar: [''],
    mediaThumbs: this.fb.control<string[]>([]),

    // otros
    verificado: [false],
    whatsapp: [''],

    // chips
    especialidades: this.fb.control<string[]>([]),
    servicios: this.fb.control<string[]>([]),
    certificaciones: this.fb.control<string[]>([]),
    aseguradoras: this.fb.control<string[]>([]),

    experienciaText: [''],

    // (las redes salen del set/map)
  });

  /* ===== helpers de chips ===== */
  has(ctrl: 'especialidades' | 'servicios' | 'certificaciones' | 'aseguradoras', value: string) {
    return (this.form.value[ctrl] ?? []).includes(value);
  }
  toggleFromEvent(
    ctrl: 'especialidades' | 'servicios' | 'certificaciones' | 'aseguradoras',
    value: string,
    ev: Event,
  ) {
    const checked = (ev.target as HTMLInputElement | null)?.checked ?? false;
    this.toggle(ctrl, value, checked);
  }
  toggle(
    ctrl: 'especialidades' | 'servicios' | 'certificaciones' | 'aseguradoras',
    value: string,
    on: boolean,
  ) {
    const cur = new Set(this.form.value[ctrl] ?? []);
    if (on) cur.add(value); else cur.delete(value);

    if (ctrl === 'especialidades') {
      const valid = new Set(this.availableServices());
      const current = new Set(this.form.value.servicios ?? []);
      for (const s of Array.from(current)) if (!valid.has(s)) current.delete(s);
      this.form.patchValue({ servicios: Array.from(current) });
    }
    this.form.patchValue({ [ctrl]: Array.from(cur) } as any);
  }
  availableServices(): string[] {
    const esp = this.form.value.especialidades ?? [];
    const set = new Set<string>();
    esp.forEach((e) => (SERVICES_BY_ESPECIALIDAD[e] || []).forEach((s) => set.add(s)));
    return Array.from(set);
  }

  /* ===== Estados→Municipios dinámicos (multi) ===== */
  private async loadMunicipiosForMany(estadosNames: string[]) {
    this._loadingMun.set(true);
    const result = new Set<string>();

    await Promise.all(
      estadosNames.map(async (name) => {
        const found = this.estadosCat.find(e => e.name === name);
        const slug = found?.slug ?? slugify(name);
        const url = `assets/locations/municipios/${slug}.json`;
        try {
          const arr = await firstValueFrom(this.http.get<string[]>(url));
          (arr || []).forEach(m => { if (m?.trim()) result.add(m.trim()); });
        } catch { /* sin archivo => ignora */ }
      })
    );

    const list = Array.from(result).sort((a, b) => a.localeCompare(b, 'es'));
    this._municipios.set(list);

    // limpia municipios no válidos
    const cur = new Set(this.form.value.municipios ?? []);
    let changed = false;
    for (const m of Array.from(cur)) {
      if (!result.has(m)) { cur.delete(m); changed = true; }
    }
    if (changed) this.form.patchValue({ municipios: Array.from(cur) });

    this._loadingMun.set(false);
  }

  /** deriva 'ubicacion' del primer municipio/estado seleccionados */
  private updateUbicacionFromSelections() {
    const est = this.form.value.estados ?? [];
    const mun = this.form.value.municipios ?? [];
    const primary = [mun[0], est[0]].filter(Boolean).join(', ');
    this.form.patchValue({ ubicacion: primary });
  }

  /* ===== Drag & drop (avatar/galería) ===== */
  onDragOver(which: 'avatar' | 'gallery', e: DragEvent) {
    e.preventDefault(); e.stopPropagation();
    if (which === 'avatar') {
      this.dragOverAvatar.set(true);
    } else {
      this.dragOverGallery.set(true);
    }
  }
  onDragLeave(which: 'avatar' | 'gallery') {
    if (which === 'avatar') {
      this.dragOverAvatar.set(false);
    } else {
      this.dragOverGallery.set(false);
    }
  }

  async onAvatarDrop(e: DragEvent) {
    e.preventDefault(); e.stopPropagation();
    this.dragOverAvatar.set(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) await this.handleAvatarFile(f);
  }
  async onAvatarSelect(e: Event) {
    const i = e.target as HTMLInputElement;
    const f = i.files?.[0];
    if (f) await this.handleAvatarFile(f);
    i.value = '';
  }
  private async handleAvatarFile(file: File) {
    this.avatarPreview.set(URL.createObjectURL(file));
    const url = await this.upload(file);
    this.form.patchValue({ avatar: url });
    // Si no hay hero, úsalo también
    if (!this.form.value.mediaHero) {
      this.form.patchValue({ mediaHero: url });
    }
  }

  async onGalleryDrop(e: DragEvent) {
    e.preventDefault(); e.stopPropagation();
    const files = Array.from(e.dataTransfer?.files || []);
    await this.handleGalleryFiles(files);
  }
  async onGallerySelect(e: Event) {
    const i = e.target as HTMLInputElement;
    const files = Array.from(i.files || []);
    await this.handleGalleryFiles(files);
    i.value = '';
  }
  private async handleGalleryFiles(files: File[]) {
    if (!files.length) return;
    const previews = [...this.galleryPreviews()];
    const urls = [...(this.form.value.mediaThumbs ?? [])];

    for (const f of files) {
      if (previews.length >= 3 || urls.length >= 3) break;
      previews.push(URL.createObjectURL(f));
      const u = await this.upload(f);
      urls.push(u);
    }

    this.galleryPreviews.set(previews.slice(0, 3));
    this.form.patchValue({ mediaThumbs: urls.slice(0, 3) });

    if (!this.form.value.mediaHero && urls.length > 0) {
      this.form.patchValue({ mediaHero: urls[0] });
    }
  }
  removeGalleryItem(i: number) {
    const previews = [...this.galleryPreviews()];
    previews.splice(i, 1);
    this.galleryPreviews.set(previews);

    const urls = [...(this.form.value.mediaThumbs ?? [])];
    urls.splice(i, 1);
    this.form.patchValue({ mediaThumbs: urls });

    if (i === 0 && this.form.value.mediaHero) {
      const newHero = urls[0] ?? '';
      this.form.patchValue({ mediaHero: newHero });
    }
  }

  /* ===== ciclo de vida ===== */
  constructor() {
    // Autogenerar slug desde nombre
    this.form.get('nombre')!.valueChanges.subscribe(n => {
      const next = slugify(n || '');
      this.form.patchValue({ slug: next }, { emitEvent: false });
    });

    // Mantén mediaHero = avatar si cambia avatar
    this.form.get('avatar')!.valueChanges.subscribe(url => {
      if (url) this.form.patchValue({ mediaHero: url }, { emitEvent: false });
    });

    // Estados→Municipios y ubicación
    this.form.get('estados')!.valueChanges.subscribe((vals: string[] | null) => {
      const v = vals ?? [];
      this.loadMunicipiosForMany(v);
      this.updateUbicacionFromSelections();
    });
    this.form.get('municipios')!.valueChanges.subscribe(() => {
      this.updateUbicacionFromSelections();
    });
  }

  /* ===== submit (envío a SubmissionsApi) ===== */
  submit() {
    this.errorMsg.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.sending.set(true);

    // redes
    const redes = Array.from(this.socialEnabled)
      .map((k) => {
        const s = SOCIALS.find((x) => x.key === k)!;
        const username = this.socialUser.get(k) ?? '';
        if (!username) return null;
        const isUrl = /^https?:\/\//i.test(username);
        const url = isUrl ? username : `${s.base.replace(/\/+$/, '')}/${username.replace(/^\/+/, '')}`;
        return { icon: s.icon, url };
      })
      .filter(Boolean) as { icon: string; url: string }[];

    const v = this.form.getRawValue();

    const est = v.estados ?? [];
    const mun = v.municipios ?? [];
    const ubicacion = (v.ubicacion || [mun[0], est[0]].filter(Boolean).join(', ')).trim();

    const payload = {
      // básicos
      slug: v.slug!,
      nombre: v.nombre!,
      cedula: v.cedula!,
      verificado: !!v.verificado,

      // imágenes (mapeadas al contrato de la solicitud pública)
      foto: v.avatar || undefined,
      fotosMini: v.mediaThumbs ?? [],
      fotoHero: v.mediaHero || v.mediaThumbs?.[0] || v.avatar || '',

      // ubicación / contacto
      estadosSel: v.estados ?? [],
      municipiosSel: v.municipios ?? [],
      whatsapp: v.whatsapp || undefined,

      // chips
      especialidades: v.especialidades ?? [],
      servicios: v.servicios ?? [],
      certificaciones: v.certificaciones ?? [],
      aseguradoras: (v.aseguradoras ?? []).map(carrierToLogo),

      // experiencia (una por línea)
      experiencia: (v.experienciaText || '').split('\n').map(s => s.trim()).filter(Boolean),

      // redes
      redes: redes.length ? redes : null,
    };

    this.api.create(payload).subscribe({
      next: _ => { this.ok.set(true); this.sending.set(false); },
      error: err => { this.sending.set(false); this.errorMsg.set(err?.error?.message ?? 'Error al enviar solicitud.'); }
    });
  }

  /* ===== Upload real (Nest /uploads/agents) ===== */
  private async upload(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('http://localhost:3000/api/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Fallo al subir imagen (${res.status}): ${txt}`);
    }
    const data = await res.json();
    return data.url as string;
  }

  /* Expuestos al template */
  readonly CERTS = CERTS;
  readonly CARRIERS = CARRIERS;
  readonly SOCIALS = SOCIALS;
}
