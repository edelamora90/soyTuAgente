// web/src/app/pages/admin/blog/post-editor.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';

import {
  BlogApiService,
  CreatePostDto,
  PostDto,
} from '../../../core/services/blog-api.service';

@Component({
  standalone: true,
  selector: 'app-post-editor',
  templateUrl: './post-editor.component.html',
  styleUrls: ['./post-editor.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class PostEditorComponent implements OnInit {
  // Inyecciones
  private fb = inject(FormBuilder);
  private api = inject(BlogApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Formulario reactivo
  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    slug: [''],
    tag: [''],
    topic: [''],
    readMinutes: [4],
    externalUrl: [''],
    content: ['', Validators.required], // se mapea a contentMd al enviar
  });

  // Id del post (modo edición) o null (modo nuevo)
  postId: string | null = null;

  // Estado de guardado
  saving = false;

  // Drag & drop estados visuales
  private _dragOverCover = false;
  private _dragOverAssets = false;

  // Archivos y previews
  private coverFile: File | null = null;
  private coverPreviewUrl: string | null = null;

  private assetFiles: File[] = [];
  private assetPreviewUrls: string[] = [];

  // Getters usados por la plantilla
  dragOverCover(): boolean {
    return this._dragOverCover;
  }

  dragOverAssets(): boolean {
    return this._dragOverAssets;
  }

  coverPreview(): string | null {
    return this.coverPreviewUrl;
  }

  assetsPreview(): string[] {
    return this.assetPreviewUrls;
  }

  // ---------------------------------------------------------------------------
  // CICLO DE VIDA
  // ---------------------------------------------------------------------------
  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id');

    if (this.postId) {
      this.loadPost(this.postId);
    }
  }

  private loadPost(id: string) {
    this.api.getById(id).subscribe({
      next: (post: PostDto) => {
        this.form.patchValue({
          title: post.title,
          slug: post.slug,
          tag: post.tag ?? '',
          topic: post.topic ?? '',
          readMinutes: post.readMinutes ?? null,
          externalUrl: post.externalUrl ?? post.external_url ?? '',
          content: post.contentMd ?? post.content ?? '',
        });

        // Mostrar la portada existente, si hay
        this.coverPreviewUrl = post.img ?? null;
      },
      error: (err) => {
        console.error('Error cargando post', err);
      },
    });
  }

  // ---------------------------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------------------------
  submit(): void {
    if (this.saving) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    const v = this.form.value;

    const dto: CreatePostDto = {
      title: v.title ?? '',
      slug: v.slug || null,
      tag: v.tag || null,
      topic: v.topic || null,
      readMinutes: v.readMinutes ?? null,
      externalUrl: v.externalUrl || null,
      contentMd: v.content ?? '',
      published: true,
    };

    const req$ = this.postId
      ? this.api.update(this.postId, dto)
      : this.api.create(dto);

    req$.subscribe({
      next: (post) => this.afterSavePost(post),
      error: (err) => {
        console.error('Error guardando post', err);
        this.saving = false;
      },
    });
  }

  /**
   * Una vez guardado el post (create/update), subimos portada y assets si aplica.
   */
  private afterSavePost(post: PostDto): void {
    const tasks: Observable<any>[] = [];

    if (this.coverFile) {
      tasks.push(this.api.uploadCover(post.id, this.coverFile));
    }

    if (this.assetFiles.length > 0) {
      tasks.push(this.api.uploadAssets(post.id, this.assetFiles));
    }

    if (tasks.length === 0) {
      this.finishSave();
      return;
    }

    forkJoin(tasks).subscribe({
      next: () => this.finishSave(),
      error: (err) => {
        console.error('Error subiendo imágenes', err);
        this.finishSave();
      },
    });
  }

  private finishSave(): void {
    this.saving = false;
    // Redirige a la lista de posts admin (ajusta ruta si quieres otro destino)
    this.router.navigate(['/admin/blog']);
  }

  cancel(): void {
    this.router.navigate(['/admin/blog']);
  }

  // ---------------------------------------------------------------------------
  // PORTADA (cover) - drag & drop + selección
  // ---------------------------------------------------------------------------
  onDragOver(kind: 'cover' | 'assets', event: DragEvent): void {
    event.preventDefault();
    if (kind === 'cover') {
      this._dragOverCover = true;
    } else {
      this._dragOverAssets = true;
    }
  }

  onDragLeave(kind: 'cover' | 'assets'): void {
    if (kind === 'cover') {
      this._dragOverCover = false;
    } else {
      this._dragOverAssets = false;
    }
  }

  onCoverDrop(event: DragEvent): void {
    event.preventDefault();
    this._dragOverCover = false;

    const files = event.dataTransfer?.files;
    if (!files?.length) return;

    const img = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (img) {
      this.setCoverFile(img);
    }
  }

  onCoverSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.setCoverFile(file);
    // reset para permitir seleccionar la misma imagen otra vez si quiere
    input.value = '';
  }

  private setCoverFile(file: File): void {
    this.coverFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.coverPreviewUrl = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  // ---------------------------------------------------------------------------
  // ASSETS (galería) - drag & drop + selección múltiple
  // ---------------------------------------------------------------------------
  onAssetsDrop(event: DragEvent): void {
    event.preventDefault();
    this._dragOverAssets = false;

    const files = event.dataTransfer?.files;
    if (!files?.length) return;

    this.addAssetFiles(Array.from(files));
  }

  onAssetsSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.addAssetFiles(Array.from(input.files));
    input.value = '';
  }

  private addAssetFiles(files: File[]): void {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;

    images.forEach((file) => {
      this.assetFiles.push(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.assetPreviewUrls.push(String(reader.result));
      };
      reader.readAsDataURL(file);
    });
  }

  removeAssetPreview(index: number): void {
    this.assetPreviewUrls.splice(index, 1);
    this.assetFiles.splice(index, 1);
  }
}
