// web/src/app/pages/admin/post-form/post-form.component.ts
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogApiService, CreatePostDto, PostDto } from '@core/services/blog-api.service';

@Component({
  selector: 'app-post-form',
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostFormComponent implements OnInit {
  // UI state
  loading = false;
  saving = false;
  coverPreview: string | null = null;
  assetsPreview: string[] = [];

  // Edición
  postId?: string; // si editas un post existente

  // Formulario
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4)]],
    slug: [''],
    content: ['', [Validators.required, Validators.minLength(20)]],
    tag: [''],
    topic: [''],
    readMinutes: [4],
    externalUrl: [''],
    published: [true],
    // archivos (no viajan en JSON, solo para UI)
    cover: [null as File | null],
    assets: [null as File[] | null],
  });

  constructor(
    private fb: FormBuilder,
    private api: BlogApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si usas modo edición por id en la URL: /admin/posts/edit/:id
    this.postId = this.route.snapshot.paramMap.get('id') ?? undefined;
    // Si vas a precargar datos en edición, podrías llamarlos por slug o id si tienes endpoint.
  }

  // === Previews ===
  onCoverChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type)) {
      alert('Formato no permitido');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Imagen > 10MB');
      return;
    }

    this.form.patchValue({ cover: file });
    const r = new FileReader();
    r.onload = () => (this.coverPreview = r.result as string);
    r.readAsDataURL(file);
  }

  onAssetsChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;

    const valid = files.filter(f => /^image\/(png|jpe?g|webp|gif|avif)$/.test(f.type) && f.size <= 10 * 1024 * 1024);
    if (valid.length !== files.length) alert('Algunos archivos fueron descartados por formato o tamaño.');

    this.form.patchValue({ assets: valid });

    // Previews
    this.assetsPreview = [];
    valid.forEach(f => {
      const r = new FileReader();
      r.onload = () => this.assetsPreview.push(r.result as string);
      r.readAsDataURL(f);
    });
  }

  // === Guardar ===
  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    try {
      // 1) Crea/actualiza el post (solo datos JSON)
      const dto: CreatePostDto = {
        title: this.form.value.title!,
        slug: this.form.value.slug || undefined,
        content: this.form.value.content!,
        tag: this.form.value.tag || undefined,
        topic: this.form.value.topic || undefined,
        readMinutes: this.form.value.readMinutes ?? undefined,
        externalUrl: this.form.value.externalUrl || undefined,
        published: !!this.form.value.published,
      };

      let created: PostDto;
      if (this.postId) {
        created = await this.api.update(this.postId, dto).toPromise();
      } else {
        created = await this.api.create(dto).toPromise();
        this.postId = created.id; // necesario para subir imágenes
      }

      // 2) Portada (opcional)
      const cover = this.form.value.cover as File | null;
      if (cover && this.postId) {
        await this.api.uploadCover(this.postId, cover).toPromise();
      }

      // 3) Assets del contenido (opcional)
      const assets = (this.form.value.assets as File[] | null) ?? [];
      if (assets.length && this.postId) {
        await this.api.uploadAssets(this.postId, assets).toPromise();
      }

      // 4) Navegar o resetear
      this.saving = false;
      this.router.navigate(['../'], { relativeTo: this.route }); // vuelve al listado
    } catch (err) {
      this.saving = false;
      console.error(err);
      alert('Error al guardar el post.');
    }
  }

  cancel() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
