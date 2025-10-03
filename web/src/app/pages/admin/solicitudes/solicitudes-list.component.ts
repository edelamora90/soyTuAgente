// web/src/app/pages/admin/solicitudes/solicitudes-list.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SubmissionsApi } from '../../../core/submissions/submissions.api';
import { AgentSubmission, SubmissionStatus } from '../../../core/submissions/submissions.types';

// Presenter + mapper + VM
import { AgentProfilePresenterComponent } from '../../../shared/agent-profile.presenter/agent-profile.presenter.component';
import { mapToAgentProfileVM } from '../../../shared/profile/agent-profile.mapper';
import { AgentProfileVM } from '../../agentes/profile/agent-profile.vm';

@Component({
  selector: 'app-solicitudes-list',
  standalone: true,
  // IMPORTANTE: agrega el presenter aquí
  imports: [CommonModule, AgentProfilePresenterComponent],
  templateUrl: './solicitudes-list.component.html',
  styleUrls: ['./solicitudes-list.component.scss'],
})
export class SolicitudesListComponent {
  private api = inject(SubmissionsApi);

  // Estado UI
  loading = signal(true);
  actionBusy = signal(false);
  errorMsg = signal<string | null>(null);

  // Datos
  rows = signal<AgentSubmission[]>([]);
  selected = signal<AgentSubmission | null>(null);

  // VM para el presenter (modal)
  vm = signal<AgentProfileVM | null>(null);

  // Filtros
  status = signal<SubmissionStatus>('PENDING');
  q = signal<string>('');

  // Filtrado en cliente
  filtered = computed(() => {
    const term = this.q().trim().toLowerCase();
    const base = this.rows();
    if (!term) return base;
    return base.filter(r =>
      (r.nombre || '').toLowerCase().includes(term) ||
      (r.slug || '').toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.load(); // arranca con PENDING
  }

  load() {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.api.list(this.status()).subscribe({
      next: (data) => {
        this.rows.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'Error al cargar solicitudes.');
        this.loading.set(false);
      }
    });
  }

  setStatus(st: SubmissionStatus) {
    if (this.status() === st) return;
    this.status.set(st);
    this.q.set('');
    this.load();
  }

  // ===== Modal =====
  open(row: AgentSubmission, dlg: HTMLDialogElement) {
    this.selected.set(row);
    // Mapea la solicitud a la VM que consume el presenter
    this.vm.set(mapToAgentProfileVM(row));
    dlg.showModal();
  }

  close(dlg: HTMLDialogElement) {
    dlg.close();
    this.selected.set(null);
    this.vm.set(null);
  }

  approve(dlg: HTMLDialogElement) {
    const row = this.selected();
    if (!row) return;
    this.actionBusy.set(true);
    this.api.approve(row.id).subscribe({
      next: _ => {
        this.actionBusy.set(false);
        this.close(dlg);
        this.load();
      },
      error: err => {
        this.actionBusy.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Error al aprobar.');
      }
    });
  }

  reject(dlg: HTMLDialogElement) {
    const row = this.selected();
    if (!row) return;
    const notes = prompt('Motivo del rechazo (opcional):') ?? undefined;
    this.actionBusy.set(true);
    this.api.reject(row.id, notes).subscribe({
      next: _ => {
        this.actionBusy.set(false);
        this.close(dlg);
        this.load();
      },
      error: err => {
        this.actionBusy.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Error al rechazar.');
      }
    });
  }

  trackById = (_: number, r: AgentSubmission) => r.id;
}
