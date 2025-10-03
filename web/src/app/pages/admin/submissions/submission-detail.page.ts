import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { AgentProfilePresenterComponent } from '../../../shared/agent-profile.presenter/agent-profile.presenter.component';
import { AgentProfileVM } from '../../agentes/profile/agent-profile.vm';
import { Submission } from '../../../core/submissions/submissions.model';
import { submissionToVM } from './submission.map';

@Component({
  selector: 'app-submission-detail',
  standalone: true,
  imports: [CommonModule, AgentProfilePresenterComponent],
  template: `
    <app-agent-profile-presenter [agent]="vm" [loading]="loading"></app-agent-profile-presenter>
  `,
})
export class SubmissionDetailPage {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  loading = true;
  vm: AgentProfileVM | null = null;

  async ngOnInit() {
    try {
      const id = this.route.snapshot.paramMap.get('id')!;
      const s = await this.http.get<Submission>(`/api/submissions/${id}`).toPromise();
      this.vm = submissionToVM(s!);
    } finally {
      this.loading = false;
    }
  }
}
