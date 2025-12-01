// web/src/app/pages/agentes/profile/agent-profile.vm.ts

export interface AgentProfileVM {
  // ===== básicos =====
  nombre: string;
  cedula?: string;
  verificado?: boolean;

  // Imagen principal y variantes
  avatar?: string | null;       // puede ser /public/... o http(s)
  mediaHero?: string | null;    // opcional (hero)
  mediaThumbs: string[];        // galería (miniaturas o adicionales)

  // Ubicación (legacy y nuevo)
  ubicacion: string;            // legacy "Municipio, Estado"
  ubicaciones?: string[];       // nuevo: varias "Municipio, Estado"
  estados?: string[];           // catálogo de estados seleccionados
  municipios?: string[];        // municipios seleccionados

  // Perfiles/servicios
  especialidades: string[];
  experiencia: string[];
  servicios: string[];
  certificaciones: string[];
  aseguradoras: string[];       // puede contener assets/* o /public/*

  // Redes sociales
  redes: { icon: string; url: string }[];

  /** Número para llamada / WhatsApp */
  telefono?: string;
  whatsapp?: string | null;
}

// Placeholder local para fallbacks en <img>
export const AVATAR_FALLBACK = 'assets/perfil-de-usuario.webp';
