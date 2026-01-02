import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AgentsAdminService, AgentDTO } from '../../../core/agents-admin';

type RedesItem = { icon: string; url: string };

@Component({
  selector: 'app-agent-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './agent-form.page.html',
  styleUrls: ['./agent-form.page.scss'],
})
export class AgentFormPage {
  private fb     = inject(FormBuilder);
  private api    = inject(AgentsAdminService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  isEdit  = signal(false);

  form = this.fb.group({
    // básicos
    slug: ['', Validators.required],
    nombre: ['', Validators.required],
    cedula: [''],
    verificado: [false],
    avatar: [''],
    ubicacion: [''],

    // arrays / colecciones
    especialidades: this.fb.control<string[] | null>([]),
    experiencia:    this.fb.control<string[] | null>([]),
    servicios:      this.fb.control<string[] | null>([]),
    certificaciones:this.fb.control<string[] | null>([]),
    aseguradoras:   this.fb.control<string[] | null>([]),
    mediaThumbs:    this.fb.control<string[] | null>([]),

    // otros
    mediaHero: [''],
    whatsapp: [''],

    // objetos
    redes: this.fb.control<RedesItem[] | null>([]),
  });

  // ======= Helpers solo para inputs tipo texto =======
  get especialidadesText() { return (this.form.value.especialidades ?? []).join(', '); }
  get aseguradorasText()   { return (this.form.value.aseguradoras   ?? []).join(', '); }
  get mediaThumbsText()    { return (this.form.value.mediaThumbs    ?? []).join(', '); }

  get experienciaText()     { return (this.form.value.experiencia     ?? []).join('\n'); }
  get serviciosText()       { return (this.form.value.servicios       ?? []).join('\n'); }
  get certificacionesText() { return (this.form.value.certificaciones ?? []).join('\n'); }

  get redesText() {
    const arr = this.form.value.redes ?? [];
    return arr.map(r => JSON.stringify(r)).join('\n');
  }

  private parseCommaList(v: string): string[] {
    return (v ?? '').split(',').map(s => s.trim()).filter(Boolean);
  }
  private parseLines(v: string): string[] {
    return (v ?? '').split('\n').map(s => s.trim()).filter(Boolean);
  }

  onEspecialidadesChange(v: string)  { this.form.patchValue({ especialidades: this.parseCommaList(v) }); }
  onAseguradorasChange(v: string)    { this.form.patchValue({ aseguradoras:   this.parseCommaList(v) }); }
  onMediaThumbsChange(v: string)     { this.form.patchValue({ mediaThumbs:    this.parseCommaList(v) }); }

  onExperienciaChange(v: string)     { this.form.patchValue({ experiencia:     this.parseLines(v) }); }
  onServiciosChange(v: string)       { this.form.patchValue({ servicios:       this.parseLines(v) }); }
  onCertificacionesChange(v: string) { this.form.patchValue({ certificaciones: this.parseLines(v) }); }

  onRedesChange(v: string) {
    const redes = (v ?? '')
      .split('\n')
      .map((s) => {
        try {
          const obj = JSON.parse(s);
          if (obj && typeof obj.icon === 'string' && typeof obj.url === 'string') return obj as RedesItem;
        } catch {/**/ }
        return null;
      })
      .filter((x): x is RedesItem => !!x);
    this.form.patchValue({ redes });
  }

  // ================= Ciclo de vida =================
  ngOnInit() {
    // si hay slug => edición; si no hay => alta o /new
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.api.get(slug).subscribe(a => {
        if (!a) {
          this.router.navigate(['/admin/agents']);
          return;
        }
        // asegura que el slug del form quede con el del backend
        this.form.patchValue({ ...a, slug: a.slug } as Partial<AgentDTO>);
        this.loading.set(false);
      });
    }
  }

  // ================= Acciones =================
  save() {
    if (this.form.invalid) return;

    this.loading.set(true);

    // normaliza slug
    const trimmedSlug = (this.form.value.slug ?? '').trim().toLowerCase();
    this.form.patchValue({ slug: trimmedSlug });

    const payload = this.form.getRawValue() as AgentDTO;
    const slugParam = this.route.snapshot.paramMap.get('slug');

    const req = slugParam
      ? this.api.update(slugParam, payload) // edición por slug de la URL
      : this.api.create(payload);           // alta

    req.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/admin/agents']);
      },
      error: () => this.loading.set(false),
    });
  }

  cancel() {
    this.router.navigate(['/admin/agents']);
  }
}
