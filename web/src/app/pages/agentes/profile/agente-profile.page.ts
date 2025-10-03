// web/src/app/pages/agentes/profile/agente-profile.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AgentProfilePresenterComponent } from '../../../shared/agent-profile.presenter/agent-profile.presenter.component';
import { AgentProfileVM } from './agent-profile.vm';

// Tipos/repos existentes
import { AGENTS_DATA, AgentsData, Agent } from '../../../core/agents/agents.data';

@Component({
  selector: 'app-agent-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule, AgentProfilePresenterComponent],
  template: `
    <app-agent-profile-presenter
      [agent]="vm"
      [loading]="loading">
    </app-agent-profile-presenter>
  `,
})
export class AgentProfilePage {
  private route = inject(ActivatedRoute);
  private repo = inject<AgentsData>(AGENTS_DATA);

  loading = true;
  vm: AgentProfileVM | null = null;

  async ngOnInit() {
    try {
      const slug = this.route.snapshot.paramMap.get('slug')!;
      const a = await this.repo.get(slug);
      if (!a) {
        this.vm = null;
        return;
      }
      this.vm = this.agentToVM(a);
    } finally {
      this.loading = false;
    }
  }

  private agentToVM(a: Agent): AgentProfileVM {
    return {
      nombre: a.nombre ?? '',
      cedula: a.cedula ?? '',
      verificado: !!a.verificado,
      ubicacion: a.ubicacion ?? '',
      avatar: (a.avatar && a.avatar.trim())
        ? a.avatar
        : 'assets/perfilAgente/fallback.jpg',

      //  Garantizamos arrays de string
      mediaThumbs: Array.isArray(a.mediaThumbs) ? (a.mediaThumbs.filter(Boolean) as string[]) : [],
      especialidades: Array.isArray(a.especialidades) ? (a.especialidades.filter(Boolean) as string[]) : [],
      experiencia: Array.isArray(a.experiencia) ? (a.experiencia.filter(Boolean) as string[]) : [],
      servicios: Array.isArray(a.servicios) ? (a.servicios.filter(Boolean) as string[]) : [],
      certificaciones: Array.isArray(a.certificaciones) ? (a.certificaciones.filter(Boolean) as string[]) : [],
      aseguradoras: Array.isArray(a.aseguradoras) ? (a.aseguradoras.filter(Boolean) as string[]) : [],
      redes: Array.isArray(a.redes) ? a.redes : [],
    };
  }
}


