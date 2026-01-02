//web/src/app/shared/image-dropzone/image-dropzone.component.ts

import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-dropzone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-dropzone.component.html',
  styleUrls: ['./image-dropzone.component.scss'],
})
export class ImageDropzoneComponent implements OnInit, OnChanges {
  // ==========================================================
  // INPUTS
  // ==========================================================
  @Input('cantImage') maxImages: number = 1;
  @Input() previewUrls: string[] = [];
  @Input() initialUrls: string[] = [];

  @Input() context: 'events' | 'blog' | 'agents' | 'generic' = 'events';
  @Input() folder: string = 'assets';

  // ==========================================================
  // OUTPUTS
  // ==========================================================
  @Output() fileUploaded = new EventEmitter<File>();     // single
  @Output() filesUploaded = new EventEmitter<File[]>();  // multiple
  @Output() fileRemoved = new EventEmitter<number>();
  @Output() previewsChanged = new EventEmitter<string[]>();

  // ==========================================================
  // LOCAL STATE
  // ==========================================================
  localPreviews: string[] = [];
  isDragging = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  get isMultiple(): boolean {
    return this.maxImages > 1;
  }

  // ==========================================================
  ngOnInit() {
    const source = this.initialUrls.length ? this.initialUrls : this.previewUrls;
    if (source?.length > 0) {
      this.localPreviews = [...source];
      this.limitPreviews();
      this.emitPreviews();
    }
  }

  // ==========================================================
  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialUrls'] && this.initialUrls.length > 0) {
      this.localPreviews = [...this.initialUrls];
      this.limitPreviews();
      this.emitPreviews();
    }

    if (changes['previewUrls'] && this.previewUrls.length > 0) {
      this.localPreviews = [...this.previewUrls];
      this.limitPreviews();
      this.emitPreviews();
    }
  }

  // ==========================================================
  // CLICK → ABRIR EXPLORADOR
  // ==========================================================
  triggerInput() {
    if (!this.isDragging && this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  // ==========================================================
  // DRAG & DROP
  // ==========================================================
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    const files = Array.from(event.dataTransfer?.files || []);
    this.processFiles(files);
  }

  // ==========================================================
  // INPUT MANUAL
  // ==========================================================
  onSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.processFiles(files);

    input.value = '';
  }

  // ==========================================================
  // PROCESAR ARCHIVOS
  // ==========================================================
  private processFiles(files: File[]) {
    const images = files.filter(f => f.type.startsWith('image/'));
    if (!images.length) return;

    const remaining = this.maxImages - this.localPreviews.length;
    if (remaining <= 0) return;

    const accepted = images.slice(0, remaining);
    const previewURLs = accepted.map(f => URL.createObjectURL(f));

    // MODO SINGLE
    if (!this.isMultiple) {
      this.localPreviews = [previewURLs[0]];
      this.fileUploaded.emit(accepted[0]);
      this.emitPreviews();
      return;
    }

    // MULTIPLE
    this.localPreviews = [...this.localPreviews, ...previewURLs];
    this.filesUploaded.emit(accepted);
    this.emitPreviews();
  }

  // ==========================================================
  // REMOVER
  // ==========================================================
  remove(index: number) {
    this.localPreviews.splice(index, 1);
    this.localPreviews = [...this.localPreviews];

    this.fileRemoved.emit(index);
    this.emitPreviews();
  }

  // ==========================================================
  // HELPERS
  // ==========================================================
  private limitPreviews() {
    if (this.localPreviews.length > this.maxImages) {
      this.localPreviews = this.localPreviews.slice(0, this.maxImages);
    }
  }

  private emitPreviews() {
    this.previewsChanged.emit([...this.localPreviews]);
  }

  get titleText(): string {
    return this.isMultiple
      ? 'Selecciona una o varias imágenes para subir'
      : 'Selecciona una imagen para subir';
  }
  get uploadPath(): string {
      return `${this.context}/${this.folder}`;
    }

}
