import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AgentsAdminService, AgentDTO, Page } from '../../../core/agents-admin';

@Component({
  selector: 'app-admin-agents',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-agents.page.html',
  styleUrls: ['./admin-agents.page.scss'],
})
export class AdminAgentsPage {
  private api = inject(AgentsAdminService);
  private router = inject(Router);

  loading = signal(true);
  data    = signal<AgentDTO[]>([]);
  total   = signal(0);

  ngOnInit() {
    this.fetch();
  }

  fetch() {
    this.loading.set(true);
    this.api.list({ pageSize: 50 }).subscribe((p: Page<AgentDTO>) => {
      this.data.set(p.items);
      this.total.set(p.total);
      this.loading.set(false);
    });
  }

  newAgent() {
    this.router.navigate(['/admin/agents/new']);
  }

  edit(a: AgentDTO) {
    this.router.navigate(['/admin/agents', a.id ?? a.slug]);
  }

  delete(a: AgentDTO) {
    if (!a.id) return;
    if (confirm(`Eliminar a ${a.nombre}?`)) {
      this.api.remove(a.id).subscribe(() => this.fetch());
    }
  }

  trackBy = (_: number, a: AgentDTO) => a.id ?? a.slug;
}
