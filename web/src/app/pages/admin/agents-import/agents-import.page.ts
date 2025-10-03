import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import Papa from 'papaparse';

import { AGENTS_DATA, AgentsData, Agent } from '../../../core/agents/agents.data';

/** ================= Aseguradoras (nombres → logos) ================= */
export const CARRIER_LOGOS: Record<string, string> = {
  'Alianz': 'assets/aseguradoras/Alianz.png',
  'AXA': 'assets/aseguradoras/Axa.png',
  'GNP': 'assets/aseguradoras/Gnp.png',
  'HDI': 'assets/aseguradoras/Hdi.png',
  'INBURSA': 'assets/aseguradoras/Inbursa.png',
  'MAPFRE': 'assets/aseguradoras/Mapfre.png',
  'MetLife': 'assets/aseguradoras/Metlife.png',
  'Primero': 'assets/aseguradoras/Primeroseguros.png',
  'Qualitas': 'assets/aseguradoras/Qualitas.png',
  'Seguros Atlas': 'assets/aseguradoras/Segurosatlas.png',
  'Seguros Monterrey': 'assets/aseguradoras/Segurosmonterrey.png',
  'Sura': 'assets/aseguradoras/Sura.png',
  'Zurich': 'assets/aseguradoras/Zurich.png',
};
function norm(s: string) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}
const CARRIER_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(CARRIER_LOGOS).map(([name, url]) => [norm(name), url])
);
export function carrierToLogo(v: string): string {
  if (!v) return v;
  if (/^https?:\/\//i.test(v) || v.startsWith('assets/')) return v;
  return CARRIER_LOOKUP[norm(v)] ?? v;
}

type Row = Record<string, string>;

@Component({
  standalone: true,
  selector: 'app-agents-import',
  imports: [CommonModule, RouterModule],
  templateUrl: './agents-import.page.html',
  styleUrls: ['./agents-import.page.scss'],
})
export class AgentsImportPage {
  private repo = inject<AgentsData>(AGENTS_DATA);

  fileName = signal<string | null>(null);
  rows = signal<Row[]>([]);
  parsed = signal<Partial<Agent>[]>([]);
  errors = signal<string[]>([]);
  uploading = signal(false);

  expectedHeaders = [
    'slug','nombre','cedula','verificado','avatar','ubicacion','whatsapp',
    'especialidades','experiencia','servicios','certificaciones',
    'aseguradoras','mediaThumbs','mediaHero','redes'
  ];

  help = {
    arrays: 'Usa coma o “|” para separar (ej: vehiculos|hogar-negocio).',
    redes:  'Usa pares icon:url separados por “|” o JSON por línea.',
  };

  onPickFile(input: HTMLInputElement) {
    input.click();
  }

  onFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileName.set(file.name);

    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = (res.data || []).filter(Boolean);
        this.rows.set(rows);
        this.parseRows(rows);
      },
      error: (err) => this.errors.set([`Error leyendo CSV: ${err.message}`]),
    });
  }

  private parseRows(rows: Row[]) {
    const out: Partial<Agent>[] = [];
    const errs: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];

      const get = (k: string) => r[k] ?? r[k.toLowerCase()] ?? r[k.replace(/\s+/g,'')] ?? '';

      const nombre = (get('nombre') || '').trim();
      let slug = (get('slug') || '').trim();
      if (!slug && nombre) slug = this.slugify(nombre);

      const verificado = this.toBool(get('verificado'));
      const avatar = (get('avatar') || '').trim();
      const ubicacion = (get('ubicacion') || '').trim();
      const whatsapp = (get('whatsapp') || '').trim();
      const mediaHero = (get('mediaHero') || '').trim();

      const especialidades = this.toArray(get('especialidades'));
      const experiencia    = this.toLines(get('experiencia'));
      const servicios      = this.toLines(get('servicios'));
      const certificaciones= this.toLines(get('certificaciones'));
      const aseguradoras   = this.toArray(get('aseguradoras')).map(carrierToLogo); // ← mapeo
      const mediaThumbs    = this.toArray(get('mediaThumbs'));
      const redes          = this.toRedes(get('redes'));

      const rowErr: string[] = [];
      if (!nombre) rowErr.push('nombre vacío');
      if (!slug)   rowErr.push('slug vacío');
      if (!ubicacion) rowErr.push('ubicacion vacía');

      if (rowErr.length) {
        errs.push(`Fila ${i + 2}: ${rowErr.join(', ')}`);
        continue;
      }

      out.push({
        slug, nombre,
        cedula: get('cedula') || '',
        verificado,
        avatar, ubicacion, whatsapp,
        mediaHero,
        especialidades,
        experiencia,
        servicios,
        certificaciones,
        aseguradoras, // ← ya son URLs de logo
        mediaThumbs,
        redes,
      });
    }

    this.parsed.set(out);
    this.errors.set(errs);
  }

  private slugify(s: string) {
    return s
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  private toBool(v: string) {
    return /^(1|true|sí|si|x|ok|verificado)$/i.test(v || '');
  }
  private split(v: string) {
    return (v || '').split(/[|,]/).map(s => s.trim()).filter(Boolean);
  }
  private toArray(v: string) { return this.split(v); }
  private toLines(v: string) { return (v || '').split(/\r?\n|\|/).map(s => s.trim()).filter(Boolean); }

  private toRedes(v: string) {
    const raw = (v || '').trim();
    if (!raw) return [];
    if (raw.includes(':') && !raw.startsWith('[') && !raw.startsWith('{')) {
      return this.split(raw).map(p => {
        const [icon, url] = p.split(':');
        return icon && url ? { icon: icon.trim(), url: url.trim() } : null;
      }).filter(Boolean) as {icon:string; url:string}[];
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(x => x && typeof x.icon === 'string' && typeof x.url === 'string');
      }
    } catch { /* fallthrough */ }
    return this.toLines(raw).map(line => {
      try {
        const o = JSON.parse(line);
        return (o && typeof o.icon === 'string' && typeof o.url === 'string') ? o : null;
      } catch { return null; }
    }).filter(Boolean) as {icon:string; url:string}[];
  }

  async send() {
    this.errors.set([]);
    if (!this.parsed().length) {
      this.errors.set(['No hay filas válidas para enviar.']);
      return;
    }
    this.uploading.set(true);
    try {
      // Llama al método bulk del API client (si tu AgentsApiService lo implementa)
      await (this.repo as any).bulkCreate(this.parsed());
      this.parsed.set([]);
      alert('Importación completada ✅');
    } catch (e: any) {
      this.errors.set([e?.message ?? 'Error en importación']);
    } finally {
      this.uploading.set(false);
    }
  }
}
