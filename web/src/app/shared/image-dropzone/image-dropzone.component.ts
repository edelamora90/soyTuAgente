import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';

type AcceptRule = { mime: RegExp; ext?: RegExp };

@Component({
  selector: 'app-image-dropzone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-dropzone.component.html',
  styleUrls: ['./image-dropzone.component.scss'],
})
export class ImageDropzoneComponent {
  // ====== Config ======
  /** OJO: apunta al endpoint que tengas activo en Nest: /agent o /agents */
  @Input() uploadUrl = 'http://localhost:3000/api/uploads/agent';
  @Input() accept = 'image/*';
  @Input() multiple = false;

  /** Valor controlado: string | string[] */
  @Input() value: string | string[] | null = null;
  @Output() valueChange = new EventEmitter<string | string[]>();

  /** Progreso simple 0..100 */
  progress = 0;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private http = inject(HttpClient);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  // ====== Accesibilidad / estilo ======
  over = false;

  // ====== Helpers ======
  get singleUrl(): string | null {
    return !this.multiple ? (this.value as string | null) ?? null : null;
  }
  get multiUrls(): string[] {
    return this.multiple ? (Array.isArray(this.value) ? this.value : []) : [];
  }

  triggerFileDialog() {
    this.fileInput?.nativeElement.click();
  }
  onKeyOpen(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.triggerFileDialog();
    }
  }

  // ====== Global handlers para evitar que el navegador “tome” el drop ======
  @HostListener('document:dragover', ['$event'])
  onDocDragOver(ev: DragEvent) {
    // Evita comportamiento por defecto del navegador
    ev.preventDefault();
  }
  @HostListener('document:drop', ['$event'])
  onDocDrop(ev: DragEvent) {
    // Evita que soltar fuera del componente abra el archivo
    ev.preventDefault();
  }

  // ====== Drag & Drop (zona) ======
  onDragOver(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    // Para Safari/Firefox mejora el cursor
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
    this.over = true;
    this.host.nativeElement.classList.add('dz--over');
  }

  onDragLeave(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.over = false;
    this.host.nativeElement.classList.remove('dz--over');
  }

  onDrop(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.over = false;
    this.host.nativeElement.classList.remove('dz--over');
    const files = ev.dataTransfer?.files;
    if (files && files.length) {
      this.handleFiles(files);
    }
  }

  onFileInput(ev: Event) {
    const files = (ev.target as HTMLInputElement).files;
    if (files && files.length) {
      this.handleFiles(files);
      (ev.target as HTMLInputElement).value = '';
    }
  }

  // ====== Accept filter ======
  private parseAccept(a: string): AcceptRule[] {
    // Soporta "image/*", ".png,.jpg", "image/png,image/jpeg"
    const parts = a.split(',').map(s => s.trim()).filter(Boolean);
    const rules: AcceptRule[] = [];
    for (const p of parts) {
      if (p.startsWith('.')) {
        const ext = p.replace('.', '').toLowerCase();
        rules.push({ mime: /.*/, ext: new RegExp(`\\.${ext}$`, 'i') });
      } else if (p.endsWith('/*')) {
        const base = p.replace('/*', '').toLowerCase();
        rules.push({ mime: new RegExp(`^${base}/`, 'i') });
      } else if (p.includes('/')) {
        rules.push({ mime: new RegExp(`^${p.replace('+', '\\+')}$`, 'i') });
      }
    }
    if (!rules.length) rules.push({ mime: /^image\//i }); // fallback
    return rules;
  }
  private isAccepted(file: File): boolean {
    const rules = this.parseAccept(this.accept || 'image/*');
    const name = file.name.toLowerCase();
    const type = file.type || '';
    return rules.some(r => {
      const okMime = r.mime.test(type);
      const okExt = r.ext ? r.ext.test(name) : true;
      return okMime && okExt;
    });
  }

  // ====== Upload ======
  private handleFiles(fileList: FileList) {
    let files = Array.from(fileList).filter(f => this.isAccepted(f));
    if (!files.length) return;
    if (!this.multiple && files.length > 1) files = files.slice(0, 1);

    this.uploadSequential(files).then((urls) => {
      if (this.multiple) {
        const next = [...this.multiUrls, ...urls].slice(0, 3); // máx 3 si quieres limitar
        this.value = next;
        this.valueChange.emit(next);
      } else {
        const first = urls[0] ?? null;
        this.value = first;
        this.valueChange.emit(first as string);
      }
    });
  }

  private async uploadSequential(files: File[]): Promise<string[]> {
    this.progress = 0;
    const out: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await this.uploadOne(files[i], i, files.length);
      if (url) out.push(url);
    }
    this.progress = 0;
    return out;
  }

  private uploadOne(file: File, idx: number, total: number): Promise<string | null> {
    const fd = new FormData();
    fd.append('file', file);

    return new Promise((resolve) => {
      this.http.post<{ url: string }>(this.uploadUrl, fd, {
        reportProgress: true,
        observe: 'events',
      }).subscribe({
        next: (ev: HttpEvent<any>) => {
          if (ev.type === HttpEventType.UploadProgress && ev.total) {
            const base = Math.floor((ev.loaded / ev.total) * 100);
            this.progress = Math.floor(((idx + base / 100) / total) * 100);
          }
          if (ev.type === HttpEventType.Response) {
            resolve(ev.body?.url ?? null);
          }
        },
        error: () => resolve(null),
      });
    });
  }

  // ====== borrar ======
  removeSingle(_ev: Event) {
    this.value = null;
    this.valueChange.emit(this.multiple ? [] : (null as any));
  }

  removeAt(i: number, _ev: Event) {
    if (!this.multiple) return;
    const next = [...this.multiUrls];
    next.splice(i, 1);
    this.value = next;
    this.valueChange.emit(next);
  }
}
