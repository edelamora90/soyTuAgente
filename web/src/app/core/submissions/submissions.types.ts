export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreateSubmissionDto {
  slug: string;
  nombre: string;
  cedula?: string;
  verificado?: boolean;
  foto?: string;          // o avatar
  avatar?: string;        // opcional, por compat
  ubicacion?: string;
  whatsapp?: string;

  especialidades?: string[];
  experiencia?: string[] | string; // admitimos ambas
  servicios?: string[];
  aseguradoras?: string[] | string;

  logroDestacado?: string;
  logosAseg?: string[];
  fotosMini?: string[];
  fotoHero?: string;
  mediaHero?: string;

  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
}

export interface AgentSubmission {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: SubmissionStatus;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  reviewNotes?: string | null;

  slug: string;
  nombre: string;
  cedula?: string | null;
  verificado?: boolean | null;
  foto?: string | null;
  ubicacion?: string | null;
  whatsapp?: string | null;

  especialidades: string[];
  experiencia?: string | null;
  servicios: string[];

  aseguradoras?: string | null;
  logroDestacado?: string | null;

  logosAseg: string[];
  fotosMini: string[];
  fotoHero?: string | null;

  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  tiktok?: string | null;
}
