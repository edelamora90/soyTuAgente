//web/src/app/pages/admin/agents/agent-new.page.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AgentsApi, AdminAgent } from '../../../core/agents/agents.api';
import { MultiCheckComponent } from '../../../shared/multi-check/multi-check.component';
import { ESPECIALIDADES } from '../../../shared/constants/especialidades';


/** ===== util ===== */
function slugify(s: string): string {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

/** ===== Catálogos ===== */
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

const CERTS = ['VENTAS EXPONENCIALES, PREDECIBLES Y CONTINUAS.', 'Factor Soy Tu Agente 2025', 'GNP Agente Elite', 'MetLife Senior'];

const CARRIER_LOGOS: Record<string, string> = {
  Qualitas: 'assets/aseguradoras/Qualitas.png',
    'Qualitas Salud': 'assets/aseguradoras/Qualitassalud.png',
    AFIRME: 'assets/aseguradoras/Afirme.png',
    Allianz: 'assets/aseguradoras/Alianz.png',
    AXA: 'assets/aseguradoras/Axa.png',
    GNP: 'assets/aseguradoras/Gnp.png',
    HDI: 'assets/aseguradoras/Hdi.png',
    INBURSA: 'assets/aseguradoras/Inbursa.png',
    MAPFRE: 'assets/aseguradoras/Mapfre.png',
    MetLife: 'assets/aseguradoras/Metlife.png',
    'Seguros Atlas': 'assets/aseguradoras/Segurosatlas.png',
Otros: 'assets/aseguradoras/Otros.png',
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
const LOGO_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(CARRIER_LOGOS).map(([name, url]) => [url.toLowerCase(), name])
);
function logoToCarrierName(v: string): string {
  const key = (v || '').toLowerCase();
  if (LOGO_TO_NAME[key]) return LOGO_TO_NAME[key];
  const file = key.split('/').pop() || '';
  const hit = Object.entries(CARRIER_LOGOS).find(([, u]) => u.toLowerCase().endsWith(file));
  return hit?.[0] ?? v;
}


type SocialKey = 'facebook' | 'instagram' | 'linkedin' | 'tiktok';
const SOCIALS: Array<{ key: SocialKey; label: string; icon: string; base: string }> = [
  { key: 'facebook', label: 'Facebook', icon: 'assets/icons/facebook.svg', base: 'https://facebook.com' },
  { key: 'instagram', label: 'Instagram', icon: 'assets/icons/instagram.svg', base: 'https://instagram.com' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'assets/icons/linkedin.svg', base: 'https://linkedin.com/in' },
  { key: 'tiktok', label: 'TikTok', icon: 'assets/icons/tiktok.svg', base: 'https://tiktok.com/@' },
];

@Component({
  standalone: true,
  selector: 'app-agent-new',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MultiCheckComponent],
  templateUrl: './agent-new.page.html',
  styleUrls: ['./agent-new.page.scss'],
})
export class AgentNewPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(AgentsApi);
  private http = inject(HttpClient);

  loading = signal(false);
  serverError = signal<string | null>(null);
  isEdit = signal(false);

  readonly ESPECIALIDADES = ESPECIALIDADES;


  // ======= Estados / Municipios (multi) =======
  estadosCat = ESTADOS_CAT;                                // usado por template
  private _municipios = signal<string[]>([]);
  private _loadingMun = signal(false);
  loadingMun() { return this._loadingMun(); }              // usado por template
  get allMunicipios() { return this._municipios(); }       // usado por template

  // ======= Drag & drop =======
  dragOverAvatar = signal(false);
  dragOverGallery = signal(false);
  avatarPreview = signal<string | null>(null);
  galleryPreviews = signal<string[]>([]);

  // Redes
  private socialEnabled = new Set<SocialKey>();
  private socialUser = new Map<SocialKey, string>();
  isSocialEnabled(k: SocialKey) { return this.socialEnabled.has(k); }
  setSocialEnabled(k: SocialKey, on: boolean) {
    if (on) this.socialEnabled.add(k); else this.socialEnabled.delete(k);
  }
  getSocialUsername(k: SocialKey) { return this.socialUser.get(k) ?? ''; }
  setSocialUsername(k: SocialKey, v: string) { this.socialUser.set(k, v?.trim()); }

  // ======= FORM =======
  form = this.fb.group({
    slug: [''],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    cedula: ['', [Validators.required]],
    estados: this.fb.control<string[]>([]),     // multi
    municipios: this.fb.control<string[]>([]),  // multi dependiente
    ubicacion: [''],                            // primer municipio + primer estado
    mediaHero: [''],
    verificado: [false],
    avatar: [''],
    whatsapp: [''],
    especialidades: this.fb.control<string[]>([]),
    certificaciones: this.fb.control<string[]>([]),
    aseguradoras: this.fb.control<string[]>([]),
    mediaThumbs: this.fb.control<string[]>([]),
    experienciaText: [''],
  });

  /** chips helpers */
has(
  ctrl: 'especialidades' | 'certificaciones' | 'aseguradoras',
  value: string
) {
  return (this.form.value[ctrl] ?? []).includes(value);
}

toggleFromEvent(
  ctrl: 'especialidades' | 'certificaciones' | 'aseguradoras',
  value: string,
  ev: Event,
) {
  const checked = (ev.target as HTMLInputElement | null)?.checked ?? false;
  this.toggle(ctrl, value, checked);
}

toggle(
  ctrl: 'especialidades' | 'certificaciones' | 'aseguradoras',
  value: string,
  on: boolean,
) {
  const cur = new Set<string>(this.form.value[ctrl] ?? []);
  if (on) cur.add(value);
  else cur.delete(value);

  this.form.patchValue({ [ctrl]: Array.from(cur) } as any);
}


  /** ===== Estados→Municipios (multi) ===== */
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
        } catch {
          // sin archivo para un estado → ignora
        }
      })
    );

    const list = Array.from(result).sort((a, b) => a.localeCompare(b, 'es'));
    this._municipios.set(list);

    // limpiar municipios no válidos
    const cur = new Set(this.form.value.municipios ?? []);
    let changed = false;
    for (const m of Array.from(cur)) {
      if (!result.has(m)) { cur.delete(m); changed = true; }
    }
    if (changed) this.form.patchValue({ municipios: Array.from(cur) });

    this._loadingMun.set(false);
  }

  /** deriva 'ubicacion' tomando el primer municipio/estado seleccionados */
  private updateUbicacionFromSelections() {
    const est = this.form.value.estados ?? [];
    const mun = this.form.value.municipios ?? [];
    const primary = [mun[0], est[0]].filter(Boolean).join(', ');
    this.form.patchValue({ ubicacion: primary });
  }

  // ======== Drag & drop (avatar/galería) ========
  onDragOver(which: 'avatar' | 'gallery', e: DragEvent) {
    e.preventDefault(); e.stopPropagation();
    if (which === 'avatar') this.dragOverAvatar.set(true);
    else this.dragOverGallery.set(true);
  }
  onDragLeave(which: 'avatar' | 'gallery') {
    if (which === 'avatar') this.dragOverAvatar.set(false);
    else this.dragOverGallery.set(false);
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

  // ======== ciclo de vida ========
  private getSlug(pm: import('@angular/router').ParamMap): string | null {
    return pm.get('slug');
  }

  async ngOnInit() {
    // estados → cargar municipios y actualizar ubicación
    this.form.get('estados')!.valueChanges.subscribe((vals: string[] | null) => {
      const v = vals ?? [];
      this.loadMunicipiosForMany(v);
      this.updateUbicacionFromSelections();
    });
    // municipios → actualizar ubicación
    this.form.get('municipios')!.valueChanges.subscribe(() => {
      this.updateUbicacionFromSelections();
    });

    // crear/editar por ruta
    this.route.paramMap.subscribe(async (pm) => {
      const slug = this.getSlug(pm);
      this.serverError.set(null);

      if (!slug) {
        // crear
        this.isEdit.set(false);
        this.form.reset({
          slug: '',
          nombre: '',
          cedula: '',
          estados: [],
          municipios: [],
          ubicacion: '',
          mediaHero: '',
          verificado: false,
          avatar: '',
          whatsapp: '',
          especialidades: [],
          certificaciones: [],
          aseguradoras: [],
          mediaThumbs: [],
          experienciaText: '',
        });
        this.avatarPreview.set(null);
        this.galleryPreviews.set([]);
        this._municipios.set([]);
        this._loadingMun.set(false);
        return;
      }

      // editar
      this.isEdit.set(true);
      this.loading.set(true);
      try {
        const a = await firstValueFrom(this.api.get(slug));
        this.fillFromAgent(a);
      } catch {
        this.serverError.set('No se pudo cargar el agente.');
      } finally {
        this.loading.set(false);
      }
    });
  }

  private fillFromAgent(a: AdminAgent) {
    // ubicacion → llena estados/municipios con uno si existe
    const [muni, edo] = String(a.ubicacion || '').split(',').map(s => s.trim());
    const estados = edo ? [edo] : [];
    const municipios = muni ? [muni] : [];

    // Aseguradoras: URL → nombre para chips
    const aseguradorasNames = (a.aseguradoras ?? []).map(logoToCarrierName);

    this.avatarPreview.set(a.avatar || null);
    this.galleryPreviews.set([...(a.mediaThumbs ?? [])].slice(0, 3));

    // redes
    this.socialEnabled.clear();
    this.socialUser.clear();
    for (const r of (a.redes ?? [])) {
      const hit = SOCIALS.find(s => s.icon === r.icon);
      if (!hit) continue;
      const base = hit.base.replace(/\/+$/, '');
      let username = r.url || '';
      if (username.toLowerCase().startsWith(base.toLowerCase())) {
        username = username.substring(base.length).replace(/^\/+/, '');
      }
      this.setSocialEnabled(hit.key, true);
      this.setSocialUsername(hit.key, username);
    }

    this.form.reset();
    this.form.patchValue({
      slug: a.slug || '',
      nombre: a.nombre || '',
      cedula: a.cedula || '',
      estados,
      municipios,
      ubicacion: a.ubicacion || '',
      mediaHero: (a as any).mediaHero || (a.mediaThumbs?.[0] ?? ''),
      verificado: !!a.verificado,
      avatar: a.avatar || '',
      whatsapp: a.whatsapp || '',
      especialidades: a.especialidades ?? [],
      certificaciones: a.certificaciones ?? [],
      aseguradoras: aseguradorasNames,
      mediaThumbs: a.mediaThumbs ?? [],
      experienciaText: (a.experiencia ?? []).join('\n'),
    } as any);

    // si hay estado cargado, carga municipios correspondientes
    const estSel = this.form.value.estados ?? [];
    if (estSel.length) this.loadMunicipiosForMany(estSel);
  }

  /** ====== Guardar ====== */
async save() {
  this.serverError.set(null);

  // redes
  const redes = Array.from(this.socialEnabled)
    .map((k) => {
      const s = SOCIALS.find((x) => x.key === k)!;
      const username = this.socialUser.get(k) ?? '';
      if (!username) return null;
      const isUrl = /^https?:\/\//i.test(username);
      const url = isUrl
        ? username
        : `${s.base.replace(/\/+$/, '')}/${username.replace(/^\/+/, '')}`;
      return { icon: s.icon, url };
    })
    .filter(Boolean) as { icon: string; url: string }[];

  // ✅ usar getRawValue
  const v = this.form.getRawValue();

  if (!v.nombre?.trim()) {
    this.serverError.set('El nombre es obligatorio.');
    return;
  }
  if (!v.cedula?.trim()) {
    this.serverError.set('La cédula es obligatoria.');
    return;
  }

  const slug = (v.slug || slugify(v.nombre || '')).trim();
  const mediaHero = (v.mediaHero || (v.mediaThumbs?.[0] ?? '')).trim();

  // ubicación primaria (primer municipio/estado)
  const est = v.estados ?? [];
  const mun = v.municipios ?? [];
  const ubicacion = String(
    v.ubicacion || [mun[0], est[0]].filter(Boolean).join(', ')
  ).trim();

  const dto: Partial<AdminAgent> = {
    slug,
    nombre: (v.nombre || '').trim(),
    cedula: (v.cedula || '').trim(),
    ubicacion,
    mediaHero,

    // ✅ null en lugar de ''
    avatar: v.avatar || undefined,


    whatsapp: (v.whatsapp || '').trim() || null,
    verificado: !!v.verificado,

    especialidades: v.especialidades ?? [],
    certificaciones: v.certificaciones ?? [],
    aseguradoras: (v.aseguradoras ?? []).map(carrierToLogo),

    mediaThumbs: v.mediaThumbs ?? [],

    experiencia: (v.experienciaText || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean),

    redes: redes.length ? redes : null,
  };

  this.loading.set(true);
  try {
    if (this.isEdit()) {
      const urlSlug = this.route.snapshot.paramMap.get('slug') || slug;
      await firstValueFrom(this.api.update(urlSlug, dto));
    } else {
      await firstValueFrom(this.api.create(dto));
    }

    // ✅ ahora esta ruta sí existe
    this.router.navigate(['/admin/dashboard/agentes']);

  } catch (e: any) {
    this.serverError.set(e?.message ?? 'Error al guardar');
  } finally {
    this.loading.set(false);
  }
}


  /** ====== Upload real ====== */
  private async upload(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    // ← ruta relativa: el proxy de Angular la enviará a http://localhost:3000
    const res = await fetch('/api/agents/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Fallo al subir imagen (${res.status}): ${txt}`);
    }
    const data = await res.json();
    return data.url as string;
  }

  readonly CERTS = CERTS;
  readonly CARRIERS = CARRIERS;
  readonly SOCIALS = SOCIALS;
}
