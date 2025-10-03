// web/src/app/pages/agentes/profile/agente-profile.component.ts
import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription, from, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap, catchError } from 'rxjs/operators';

import { AGENTS_DATA, AgentsData, Agent } from '../../../core/agents/agents.data';
import { AgentProfilePresenterComponent } from '../../../shared/agent-profile.presenter/agent-profile.presenter.component';
import { AgentProfileVM } from './agent-profile.vm';
import { mapAgentToVM } from '../../../shared/profile/agent-profile.mapper';

@Component({
  selector: 'app-agent-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, AgentProfilePresenterComponent],
  templateUrl: './agente-profile.component.html',
  styleUrls: ['./agente-profile.component.scss'],
})
export class AgenteProfileComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private repo  = inject<AgentsData>(AGENTS_DATA);

  loading = true;
  notFound = false;
  vm!: AgentProfileVM;

  private sub: Subscription;

  constructor() {
    this.sub = this.route.paramMap.pipe(
      map(pm => pm.get('slug')!),
      distinctUntilChanged(),
      switchMap(slug =>
        from(this.repo.get(slug)).pipe(
          catchError(() => of(null))
        )
      )
    ).subscribe((agent: Agent | null) => {
      this.loading = false;
      if (!agent) { this.notFound = true; return; }
      this.notFound = false;
      this.vm = mapAgentToVM(agent);
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
