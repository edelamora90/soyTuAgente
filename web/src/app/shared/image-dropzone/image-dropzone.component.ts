import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-dropzone',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dropzone"
         (dragover)="onDragOver($event)"
         (drop)="onDrop($event)">

      <button type="button" class="btn-upload" (click)="fileInput.click()">
        {{ multiple ? 'Subir imágenes' : 'Subir imagen' }}
      </button>

      <p class="hint">
        Arrastra {{ multiple ? 'imágenes' : 'una imagen' }} o haz click
      </p>

      <input
        #fileInput
        type="file"
        [multiple]="multiple"
        accept="image/*"
        (change)="onSelect($event)"
        hidden
      />
    </div>
  `,
  styleUrls: ['./image-dropzone.component.scss']
})
export class ImageDropzoneComponent {
  @Input() multiple = false;
  @Output() files = new EventEmitter<File[]>();

  onDragOver(ev: DragEvent) {
    ev.preventDefault();
  }

  onDrop(ev: DragEvent) {
    ev.preventDefault();
    if (!ev.dataTransfer?.files?.length) return;
    this.files.emit(Array.from(ev.dataTransfer.files));
  }

  onSelect(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.files.emit(Array.from(input.files));
  }
}
