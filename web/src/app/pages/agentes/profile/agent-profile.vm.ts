// web/src/app/pages/agentes/profile/agent-profile.vm.ts
export interface AgentProfileVM {
  nombre: string;
  cedula?: string;
  verificado?: boolean;

  avatar: string;
  ubicacion: string;

  mediaThumbs: string[];
  especialidades: string[];
  experiencia: string[];
  servicios: string[];
  certificaciones: string[];
  aseguradoras: string[];

  redes: { icon: string; url: string }[];

  /** ← NUEVO: número para llamada / WhatsApp */
  telefono?: string;
  whatsapp?: string | null;
}

export const AVATAR_FALLBACK = 'assets/perfil-de-usuario.webp';
