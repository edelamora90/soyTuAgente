// web/src/app/pages/admin/blog/post-editor.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BlogApiService,
  CreatePostDto,
  PostDto,
} from '../../../core/services/blog-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-post-editor',
  templateUrl: './post-editor.component.html',
  styleUrls: ['./post-editor.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(BlogApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  saving = signal(false);

  // ====== Estado edición ======
  postId?: string; // viene de /admin/blog/:id/edit
  existing?: PostDto | null;

  // ====== Drag & drop / previews ======
  dragOverCover = signal(false);
  dragOverAssets = signal(false);
  coverPreview = signal<string | null>(null);
  assetsPreview = signal<string[]>([]);

  // Archivos pendientes de subir (después de crear/actualizar)
  private pendingCover: File | null = null;
  private pendingAssets: File[] = [];

  // ====== Form ======
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4)]],
    slug: [''],
    content: ['', [Validators.required, Validators.minLength(20)]],
    tag: [''],
    topic: [''],
    readMinutes: [4],
    externalUrl: [''],
    published: [true],
  });

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id') ?? undefined;
    if (this.postId) {
      this.precargar(this.postId);
    }
  }

  // ===================== Precarga para edición =====================
  private async precargar(id: string) {
    this.loading.set(true);
    try {
      const post = await firstValueFrom(this.api.getById(id));
      this.existing = post ?? null;

      if (!post) throw new Error('Post no encontrado');

      this.form.patchValue({
        title: post.title ?? '',
        slug: post.slug ?? '',
        // Usamos content (adaptado en BlogApiService) con fallback a contentMd
        content: post.content ?? post.contentMd ?? '',
        tag: post.tag ?? '',
        topic: post.topic ?? '',
        readMinutes: post.readMinutes ?? 4,
        externalUrl: post.externalUrl ?? '',
        published: post.published ?? true,
      });

      if (post.img) {
        this.coverPreview.set(post.img);
      }
    } catch (e) {
      console.error('Error precargando post', e);
      alert('No se pudo cargar el post.');
      this.router.navigate(['../'], { relativeTo: this.route });
    } finally {
      this.loading.set(false);
    }
  }

  // ===================== Drag & Drop (PORTADA) =====================
  onDragOver(which: 'cover' | 'assets', e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (which === 'cover') this.dragOverCover.set(true);
    else this.dragOverAssets.set(true);
  }

  onDragLeave(which: 'cover' | 'assets') {
    if (which === 'cover') this.dragOverCover.set(false);
    else this.dragOverAssets.set(false);
  }

  async onCoverDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.dragOverCover.set(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) await this.handleCoverFile(f);
  }

  async onCoverSelect(e: Event) {
    const i = e.target as HTMLInputElement;
    const f = i.files?.[0] ?? null;
    if (f) await this.handleCoverFile(f);
    i.value = '';
  }

  private async handleCoverFile(file: File) {
    if (!this.isValidImage(file)) return;
    this.coverPreview.set(URL.createObjectURL(file));
    this.pendingCover = file; // se sube en submit()
  }

  // ===================== Drag & Drop (ASSETS) =====================
  async onAssetsDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.dragOverAssets.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    await this.handleAssetsFiles(files);
  }

  async onAssetsSelect(e: Event) {
    const i = e.target as HTMLInputElement;
    const files = Array.from(i.files ?? []);
    await this.handleAssetsFiles(files);
    i.value = '';
  }

  private async handleAssetsFiles(files: File[]) {
    if (!files.length) return;
    const valid: File[] = [];
    for (const f of files) {
      if (!this.isValidImage(f)) continue;
      valid.push(f);
      this.assetsPreview.update((prev) => [
        ...prev,
        URL.createObjectURL(f),
      ]);
    }
    this.pendingAssets.push(...valid); // se suben en submit()
  }

  removeAssetPreview(index: number) {
    this.assetsPreview.update((prev) =>
      prev.filter((_, i) => i !== index),
    );
    this.pendingAssets = this.pendingAssets.filter((_, i) => i !== index);
  }

  // ===================== Validaciones de archivos =====================
  private isValidImage(f: File): boolean {
    const okType =
      /^image\/(png|jpe?g|webp|gif|avif)$/i.test(f.type);
    if (!okType) {
      alert('Formato no permitido');
      return false;
    }
    const okSize = f.size <= 10 * 1024 * 1024; // 10 MB
    if (!okSize) {
      alert('El archivo excede 10MB');
      return false;
    }
    return true;
  }

  // ===================== Submit =====================
  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);

    try {
      const dto: CreatePostDto = {
        title: this.form.value.title!,
        slug: this.form.value.slug || undefined,
        // El DTO usa contentMd. El form tiene "content".
        contentMd: this.form.value.content!,
        tag: this.form.value.tag || undefined,
        topic: this.form.value.topic || undefined,
        readMinutes: this.form.value.readMinutes ?? undefined,
        externalUrl: this.form.value.externalUrl || undefined,
        published: !!this.form.value.published,
      };

      let post: PostDto;
      if (this.postId) {
        post = await firstValueFrom(this.api.update(this.postId, dto));
      } else {
        post = await firstValueFrom(this.api.create(dto));
        this.postId = post.id;
      }

      // Portada
      if (this.pendingCover && this.postId) {
        await firstValueFrom(
          this.api.uploadCover(this.postId, this.pendingCover),
        );
      }

      // Assets
      if (this.pendingAssets.length && this.postId) {
        await firstValueFrom(
          this.api.uploadAssets(this.postId, this.pendingAssets),
        );
      }

      this.router.navigate(['../'], {
        relativeTo: this.route,
      });
    } catch (err) {
      console.error(err);
      alert('Error al guardar el post');
    } finally {
      this.saving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['../'], {
      relativeTo: this.route,
    });
  }
}
