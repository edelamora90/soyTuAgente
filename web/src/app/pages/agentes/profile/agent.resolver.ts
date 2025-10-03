// web/src/app/pages/agentes/profile/agent.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { AGENTS_DATA, AgentsData, Agent } from '../../../core/agents/agents.data';

export const agentResolver: ResolveFn<Agent> = async (route) => {
  const repo = inject<AgentsData>(AGENTS_DATA);
  const router = inject(Router);
  const slug = route.paramMap.get('slug')!;

  try {
    return await repo.get(slug);
  } catch {
    // si no existe, envía a 404
    router.navigateByUrl('/404', { replaceUrl: true });
    // devolver algo para satisfacer la firma (no se usará)
    return Promise.reject();
  }
};
