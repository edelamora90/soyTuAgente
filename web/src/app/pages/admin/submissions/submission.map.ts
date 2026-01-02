import { Submission } from '../../../core/submissions/submissions.model';
import { AgentProfileVM } from '../../agentes/profile/agent-profile.vm';
import { ASEG_LOGOS } from '../../../core/brands/aseguradoras-logos';

export function submissionToVM(s: Submission): AgentProfileVM {
  const redes: AgentProfileVM['redes'] = [];
  const add = (url: string | undefined, icon: string) => url && redes!.push({ icon, url });
  add(s.facebook, 'assets/icons/facebook.svg');
  add(s.instagram, 'assets/icons/instagram.svg');
  add(s.linkedin, 'assets/icons/linkedin.svg');
  add(s.tiktok, 'assets/icons/tiktok.svg');

  const aseguradoras = (s.aseguradoras ?? [])
    .map(n => ASEG_LOGOS[n] || null)
    .filter((x): x is string => !!x);

  return {
    nombre: s.nombre,
    cedula: s.cedula,
    verificado: !!s.verificado,
    ubicacion: s.ubicacion || '',
    avatar: s.foto || s.fotoHero || 'assets/placeholders/avatar.png',
    mediaThumbs: s.fotosMini ?? [],
    especialidades: s.especialidades ?? [],
    experiencia: s.experiencia ?? [],
    servicios: s.servicios ?? [],
    certificaciones: [],           // no vienen en la solicitud
    aseguradoras,
    redes,
  };
}
