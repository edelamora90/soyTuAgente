// web/src/app/pages/admin/post-form/post-form.component.ts
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  BlogApiService,
  CreatePostDto,
  PostDto,
} from '../../../core/services/blog-api.service';

@Component({
  standalone: true, // 👈 ahora es standalone
  selector: 'app-post-form',
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule, // 👈 aquí vive formGroup, formControlName, etc.
  ],
})
export class PostFormComponent implements OnInit {
  // UI state
  loading = false;
  saving = false;
  coverPreview: string | null = null;
  assetsPreview: string[] = [];

  // Edición
  postId?: string;

  // Formulario
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: BlogApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  // ==========================================
  //            CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(4)]],
      slug: [''],
      content: ['', [Validators.required, Validators.minLength(20)]],
      tag: [''],
      topic: [''],
      readMinutes: [4],
      externalUrl: [''],
      published: [true],
      isFeatured: [false],
      cover: [null as File | null],
      assets: [[] as File[]],
    });

    this.postId = this.route.snapshot.paramMap.get('id') ?? undefined;
    if (this.postId) {
      this.loadPost(this.postId);
    }
  }

  // ==========================================
  //         CARGAR POST EN MODO EDICIÓN
  // ==========================================
  private loadPost(id: string) {
    this.loading = true;
    this.api.getById(id).subscribe({
      next: (post: PostDto) => {
        this.form.patchValue({
          title: post.title,
          slug: post.slug ?? '',
          content: post.content ?? post.contentMd ?? '',
          tag: post.tag ?? '',
          topic: post.topic ?? '',
          readMinutes: post.readMinutes ?? 4,
          externalUrl: post.externalUrl ?? post.external_url ?? '',
          published: post.published ?? false,
          isFeatured: (post as any).isFeatured ?? false,
        });

        if (post.img) {
          this.coverPreview = post.img;
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando post', err);
        this.loading = false;
        this.router.navigate(['../'], { relativeTo: this.route });
      },
    });
  }

  // ==========================================
  //                FILE INPUTS
  // ==========================================
  onCoverChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;

    if (!file) {
      this.coverPreview = null;
      this.form.patchValue({ cover: null });
      return;
    }

    if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type)) {
      alert('Formato de imagen no permitido.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen supera los 10MB.');
      return;
    }

    this.form.patchValue({ cover: file });

    const reader = new FileReader();
    reader.onload = () => {
      this.coverPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onAssetsChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    if (!files.length) {
      this.form.patchValue({ assets: [] });
      this.assetsPreview = [];
      return;
    }

    const valid = files.filter(
      (f) =>
        /^image\/(png|jpe?g|webp|gif|avif)$/.test(f.type) &&
        f.size <= 10 * 1024 * 1024
    );

    if (valid.length !== files.length) {
      alert('Algunos archivos fueron descartados por formato o tamaño.');
    }

    this.form.patchValue({ assets: valid });

    this.assetsPreview = [];
    valid.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.assetsPreview = [
          ...this.assetsPreview,
          reader.result as string,
        ];
      };
      reader.readAsDataURL(file);
    });
  }

  // ==========================================
  //                 SUBMIT
  // ==========================================
  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const value = this.form.value;

    const dto: CreatePostDto = {
      title: value.title!,
      slug: value.slug || null,
      contentMd: value.content!,         // content -> contentMd
      tag: value.tag || null,
      topic: value.topic || null,
      readMinutes: value.readMinutes ?? null,
      externalUrl: value.externalUrl || null,
      published: !!value.published,
    };

    try {
      let created: PostDto;

      if (this.postId) {
        created = await firstValueFrom(
          this.api.update(this.postId, dto)
        );
      } else {
        created = await firstValueFrom(this.api.create(dto));
        this.postId = created.id;
      }

      const cover = this.form.value.cover as File | null;
      if (cover && this.postId) {
        await firstValueFrom(this.api.uploadCover(this.postId, cover));
      }

      const assets = (this.form.value.assets as File[]) ?? [];
      if (assets.length && this.postId) {
        await firstValueFrom(this.api.uploadAssets(this.postId, assets));
      }

      this.saving = false;
      this.router.navigate(['../'], { relativeTo: this.route });
    } catch (err) {
      console.error('Error guardando post', err);
      this.saving = false;
      alert('Error al guardar el post.');
    }
  }

  cancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
