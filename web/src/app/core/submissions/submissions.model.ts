export interface Submission {
  id: string;
  slug: string;
  nombre: string;
  cedula: string;
  verificado?: boolean;
  foto?: string;           // avatar
  fotoHero?: string;       // (si existe)
  ubicacion?: string;
  whatsapp?: string;

  especialidades?: string[];
  experiencia?: string[];  // ya normalizado
  servicios?: string[];

  aseguradoras?: string[]; // nombres (no URLs)
  fotosMini?: string[];    // galería

  // redes:
  facebook?: string; instagram?: string; linkedin?: string; tiktok?: string;
}
