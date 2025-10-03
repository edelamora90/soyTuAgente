// web/src/app/pages/admin/agents/agentes-list.component.ts
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AgentsApi, AdminAgent } from '../../../core/agents/agents.api';

// Presenter del perfil (reutiliza UI del perfil público)
import { AgentProfilePresenterComponent } from '../../../shared/agent-profile.presenter/agent-profile.presenter.component';
// Mapper común → VM
import { mapAgentToVM } from '../../../shared/profile/agent-profile.mapper';
import type { AgentProfileVM } from '../../../pages/agentes/profile/agent-profile.vm';

@Component({
  selector: 'app-admin-agentes-list',
  standalone: true,
  imports: [CommonModule, AgentProfilePresenterComponent, RouterLink],
  templateUrl: './agentes-list.component.html',
  styleUrls: ['./agentes-list.component.scss'],
})
export class AdminAgentesListComponent {
  private api = inject(AgentsApi);
  private router = inject(Router);

  // ===== Estado UI =====
  loading   = signal(true);
  errorMsg  = signal<string | null>(null);
  // slug de la fila que está procesando una acción (ej. eliminar)
  busySlug  = signal<string | null>(null);

  // ===== Datos =====
  rows       = signal<AdminAgent[]>([]);
  selected   = signal<AdminAgent | null>(null);
  selectedVm = signal<AgentProfileVM | null>(null);

  // ===== Filtros =====
  q = signal('');

  filtered = computed(() => {
    const term = this.q().trim().toLowerCase();
    const base = this.rows();
    if (!term) return base;
    return base.filter(r =>
      (r.nombre || '').toLowerCase().includes(term) ||
      (r.slug   || '').toLowerCase().includes(term)
    );
  });

  ngOnInit() { this.load(); }

  // ===== Carga de datos =====
  load() {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.api.list().subscribe({
      next: (data) => {
        this.rows.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'Error al cargar agentes.');
        this.loading.set(false);
      }
    });
  }

  // ===== Modal de vista previa (reutiliza presenter) =====
  open(row: AdminAgent, dlg: HTMLDialogElement) {
    this.selected.set(row);
    this.selectedVm.set(mapAgentToVM(row));
    dlg.showModal();
  }

  close(dlg: HTMLDialogElement) {
    dlg.close();
    this.selected.set(null);
    this.selectedVm.set(null);
  }

  // ===== Ir a edición =====
  goEdit(row: AdminAgent, dlg?: HTMLDialogElement) {
    if (dlg?.open) dlg.close(); // opcional
    // ajusta la ruta si tu app usa otra
    this.router.navigate(['/admin', 'dashboard', 'agentes', row.slug, 'edit']);
    // Alternativa:
    // this.router.navigate(['/admin', 'agents', row.slug]);
  }

  // ===== Eliminar agente =====
  remove(row: AdminAgent, dlg?: HTMLDialogElement) {
    const ok = window.confirm(`¿Eliminar al agente “${row.nombre}”? Esta acción no se puede deshacer.`);
    if (!ok) return;

    this.errorMsg.set(null);
    this.busySlug.set(row.slug);

    // Cierra el modal si estás viendo el preview del mismo agente
    if (dlg?.open && this.selected()?.slug === row.slug) {
      dlg.close();
      this.selected.set(null);
      this.selectedVm.set(null);
    }

    this.api.delete(row.slug).subscribe({
      next: () => {
        // Optimista: quita la fila eliminada
        this.rows.update(list => list.filter(x => x.slug !== row.slug));
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'No se pudo eliminar el agente.');
      },
      complete: () => {
        this.busySlug.set(null);
      }
    });
  }

  // utilidad para *ngFor
  trackBySlug = (_: number, r: AdminAgent) => r.slug;
}
