//web/src/app/pages/admin/events/event-editor.component.ts
// ============================================================================
// EventEditorComponent — VERSIÓN LIMPIA (Opción A)
// ============================================================================

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  EventsApiService,
  EventDto,
  CreateUpdateEventPayload,
} from '../../../core/services/events-api.service';

import { UploadApiService } from '../../../core/services/upload-api.service';
import { ImageDropzoneComponent } from '../../../shared/image-dropzone/image-dropzone.component';
import { ToastService } from '../../../shared/toast/toast.service';

import { EventTypeDto } from '../../../core/dto/event-types.dto';

@Component({
  selector: 'app-event-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageDropzoneComponent],
  templateUrl: './event-editor.component.html',
  styleUrls: ['./event-editor.component.scss'],
})
export class EventEditorComponent implements OnInit {
  EventTypeDto = EventTypeDto;
  

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventsApi = inject(EventsApiService);
  private uploadApi = inject(UploadApiService);
  private toast = inject(ToastService);

  form!: FormGroup;
  eventId: string | null = null;

  /** Controla el botón presionado */
  submitMode: 'draft' | 'publish' = 'draft';

  speakerPreview: string | null = null;
  coverPreview: string | null = null;

  speakerFiles: File[] = [];
  coverFiles: File[] = [];

  isSaving = false;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  ngOnInit(): void {
    this.buildForm();

    this.eventId = this.route.snapshot.paramMap.get('id');
    if (this.eventId) {
      this.loadEvent(this.eventId);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard/eventos']);
  }

  // ---------------------------------------------------------------------------
  // FORM
  // ---------------------------------------------------------------------------
  private buildForm(): void {
    this.form = this.fb.group({
      // Información principal
      title: ['', [Validators.required, Validators.maxLength(200)]],
      subtitle: [''],
      type: [EventTypeDto.EVENT, Validators.required],
      mode: ['ONLINE', Validators.required],
      description: ['', Validators.required],

      // Fechas
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endDate: [''],
      endTime: [''],

      // Ubicación
      city: [''],
      place: [''],
      locationUrl: [''],

      // Ponente
      ponente: [''],
      speakerRole: [''],
      speakerAvatar: [''],
      speakerBio: [''],

      // Responsable
      responsable: [''],

      // CTA
      ctaUrl: [''],

      // Costos y contacto
      price: [0, [Validators.min(0)]],
      isFree: [false],
      capacity: [null, [Validators.min(1)]],
      whatsapp: [''],

      // Publicación
      isFeatured: [false],
    });
  }

  // ---------------------------------------------------------------------------
  // Carga de evento
  // ---------------------------------------------------------------------------
  private loadEvent(id: string): void {
    this.eventsApi.getEventById(id).subscribe({
      next: (ev) => {
        this.patchForm(ev);
        this.loadPreviews(ev);
      },
      error: () => {
        this.toast.show('No se pudo cargar el evento', 'error');
      },
    });
  }

  private patchForm(ev: EventDto): void {
    let city = '';
    let place = '';

    if (ev.address) {
      const parts = ev.address.split('·').map((p) => p.trim());
      city = parts[0] ?? '';
      place = parts[1] ?? '';
    }

    const regUrl = ev.registrationUrl ?? '';

    this.form.patchValue({
      title: ev.title,
      subtitle: ev.subtitle ?? '',
      description: ev.description,
      type: ev.type,
      mode: ev.mode,

      startDate: ev.startDate?.substring(0, 10) ?? '',
      endDate: ev.endDate?.substring(0, 10) ?? '',
      startTime: ev.startTime ?? '',
      endTime: ev.endTime ?? '',

      city,
      place,
      locationUrl: regUrl,

      ponente: ev.speakerName ?? '',
      speakerRole: ev.speakerRole ?? '',
      speakerAvatar: ev.speakerAvatar ?? '',
      speakerBio: ev.speakerBio ?? '',

      responsable: ev.responsable ?? '',
      ctaUrl: regUrl,

      price: ev.price ?? 0,
      isFree: ev.isFree ?? false,
      capacity: ev.capacity ?? null,
      whatsapp: ev.whatsapp ?? '',

      isFeatured: ev.isFeatured ?? false,
    });
  }

  private loadPreviews(ev: EventDto): void {
    this.speakerPreview = ev.speakerAvatar ?? null;
    this.coverPreview = ev.coverImg ?? null;
  }

  // ---------------------------------------------------------------------------
// DROPZONES
// ---------------------------------------------------------------------------

onSpeakerFiles(files: File[]): void {
  if (!files?.length) return;

  this.uploadApi.uploadEventImage(files[0], 'speakers').subscribe({
    next: (res) => (this.speakerPreview = res.url),
    error: () => this.toast.show('Error subiendo foto del ponente', 'error'),
  });
}

onSpeakerPreviews(urls: string[]): void {
  // Si el dropzone emite previews y aún no hay preview asignado,
  // tomamos el primero para reflejarlo en UI.
  if (!this.speakerPreview && urls?.length) {
    this.speakerPreview = urls[0];
  }
}

onSpeakerRemoved(idx: number): void {
  // Si tu dropzone solo permite 1 imagen, el idx será 0 normalmente.
  if (idx === 0) this.speakerPreview = null;
}

onCoverFiles(files: File[]): void {
  if (!files?.length) return;

  this.uploadApi.uploadEventImage(files[0], 'covers').subscribe({
    next: (res) => (this.coverPreview = res.url),
    error: () => this.toast.show('Error subiendo portada', 'error'),
  });
}

onCoverPreviews(urls: string[]): void {
  if (!this.coverPreview && urls?.length) {
    this.coverPreview = urls[0];
  }
}

onCoverRemoved(idx: number): void {
  if (idx === 0) this.coverPreview = null;
}


  // ---------------------------------------------------------------------------
  // BOTONES
  // ---------------------------------------------------------------------------
  setModeDraft(): void {
    this.submitMode = 'draft';
    this.onSubmit();
  }

  setModePublish(): void {
    this.submitMode = 'publish';
    this.onSubmit();
  }

  // ---------------------------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------------------------
    onSubmit(): void {
    if (this.form.invalid) {
    this.form.markAllAsTouched();

    // ✅ Toast (sin "warning", usamos "info")
    this.toast.show(
      'Faltan campos obligatorios. Revisa los campos marcados en rojo antes de publicar.',
      'info',
    );

    // ✅ (Opcional pero recomendado) enfocar el primer campo inválido
    this.focusFirstInvalidControl();

    return;
  }

    const raw = this.form.value;

    const virtualUrl = this.showVirtualLinkField
      ? raw.locationUrl || null
      : null;

    const registrationUrl = virtualUrl || raw.ctaUrl || null;

    const payload: CreateUpdateEventPayload = {
      title: raw.title,
      subtitle: raw.subtitle || null,
      description: raw.description,
      type: raw.type,
      mode: raw.mode,

      startDate: raw.startDate,
      endDate: raw.endDate || null,
      startTime: raw.startTime,
      endTime: raw.endTime || null,

      address: this.buildAddress(raw.city, raw.place),

      speakerName: this.isSpeakerRequired ? raw.ponente || null : null,
      speakerBio: this.isSpeakerRequired ? raw.speakerBio || null : null,
      speakerRole: this.isSpeakerRequired ? raw.speakerRole || null : null,
      speakerAvatar: this.speakerPreview || null,

      responsable: this.isEventType ? raw.responsable || null : null,

      coverImg: this.coverPreview || null,
      registrationUrl,

      price: Number(raw.price) || 0,
      isFree: raw.isFree,
      capacity: raw.capacity ? Number(raw.capacity) : null,
      whatsapp: raw.whatsapp || null,

      isFeatured: this.submitMode === 'publish' ? raw.isFeatured : false,
      isPublished: this.submitMode === 'publish',
    };

    this.isSaving = true;

    const req$ = this.eventId
      ? this.eventsApi.updateEvent(this.eventId, payload)
      : this.eventsApi.createEvent(payload);

    req$.subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.show(
          this.submitMode === 'publish'
            ? 'Evento publicado correctamente'
            : 'Borrador guardado',
          'success',
        );
        this.router.navigate(['/admin/dashboard/eventos']);
      },
      error: () => {
        this.isSaving = false;
        this.toast.show('Error al guardar el evento', 'error');
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private buildAddress(city?: string, place?: string): string | null {
    const parts = [city?.trim(), place?.trim()].filter(Boolean);
    return parts.length ? parts.join(' · ') : null;
  }


  get isSpeakerRequired(): boolean {
    const type = this.form.get('type')?.value;
    return [
      EventTypeDto.WEBINAR,
      EventTypeDto.CAPACITACION,
      EventTypeDto.CURSO,
    ].includes(type);
  }

  get isEventType(): boolean {
    return this.form.get('type')?.value === EventTypeDto.EVENT;
  }

  get showVirtualLinkField(): boolean {
    const type = this.form.get('type')?.value;
    const mode = this.form.get('mode')?.value;
    return type === EventTypeDto.WEBINAR || mode === 'ONLINE';
  }

  private focusFirstInvalidControl(): void {
    // Busca el primer control inválido según el orden del FormGroup
    const firstInvalidKey = Object.keys(this.form.controls).find((key) => {
      const ctrl = this.form.get(key);
      return ctrl && ctrl.invalid;
    });

    if (!firstInvalidKey) return;

    // Intenta enfocar por formControlName (inputs/select/textarea)
    const el = document.querySelector(
      `[formcontrolname="${firstInvalidKey}"]`,
    ) as HTMLElement | null;

    if (el?.focus) {
      el.focus();
      // si está abajo, lo subimos al viewport
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstInvalidControl: HTMLElement | null =
        document.querySelector(
          'form .ng-invalid:not(form)'
        );

      if (firstInvalidControl) {
        firstInvalidControl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        // Opcional: foco directo
        if (
          typeof (firstInvalidControl as any).focus === 'function'
        ) {
          (firstInvalidControl as any).focus();
        }
      }
    }, 0);
  }

  public hasError(controlName: string, error: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.hasError(error) && control.touched;
  }

}