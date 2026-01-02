import {
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BlogApiService } from '../../../core/services/blog-api.service';
import { UploadApiService } from '../../../core/services/upload-api.service';

// 🔁 Reutilizados (MISMO patrón que Eventos)
import { ImageDropzoneComponent } from '../../../shared/image-dropzone/image-dropzone.component';
import { TipTapEditorComponent } from '../../../shared/tiptap-editor/tiptap-editor.component';

@Component({
  selector: 'sta-blog-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ImageDropzoneComponent,
    TipTapEditorComponent,
  ],
  templateUrl: './blog-editor.component.html',
  styleUrls: ['./blog-editor.component.scss'],
})
export class BlogEditorComponent implements OnInit {

  // ===========================================================================
  // INJECTIONS
  // ===========================================================================
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private blogApi = inject(BlogApiService);
  private uploadApi = inject(UploadApiService);

  // ===========================================================================
  // STATE
  // ===========================================================================
  form!: FormGroup;
  loading = false;
  error: string | null = null;

  postId: string | null = null;
  isEdit = false;

  // ===========================================================================
  // PREVIEWS
  // ===========================================================================
  coverPreview: string | null = null;
  galleryPreviews: string[] = [];

  // ===========================================================================
  // INIT
  // ===========================================================================
  ngOnInit(): void {
    this.buildForm();
    this.resolveMode();
  }

  // ===========================================================================
  // FORM
  // ===========================================================================
  private buildForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      excerpt: [''],
      contentHtml: ['', Validators.required],

      coverImg: [null],
      galleryImgs: [[] as string[]],

      author: ['', Validators.required],
      isDraft: [true],
      isFeatured: [false],
      publishedAt: [null],
    });
  }

  // ===========================================================================
  // MODE (NEW / EDIT)
  // ===========================================================================
  private resolveMode(): void {
    this.postId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.postId;

    if (this.isEdit && this.postId) {
      this.loadPost(this.postId);
    }
  }

  private loadPost(id: string): void {
    this.loading = true;

    this.blogApi.getPostById(id).subscribe({
      next: (post: any) => {
        this.form.patchValue({
          title: post.title,
          excerpt: post.excerpt,
          contentHtml: post.contentHtml,
          coverImg: post.coverImg ?? null,
          galleryImgs: Array.isArray(post.galleryImgs) ? post.galleryImgs : [],
          author: post.author,
          isDraft: post.isDraft,
          isFeatured: post.isFeatured,
          publishedAt: this.toDatetimeLocal(post.publishedAt),
        });

        this.coverPreview = post.coverImg ?? null;
        this.galleryPreviews = Array.isArray(post.galleryImgs)
          ? post.galleryImgs
          : [];

        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el artículo.';
        this.loading = false;
      },
    });
  }

  // ===========================================================================
  // TIPTAP
  // ===========================================================================
  onEditorChange(html: string): void {
    this.form.get('contentHtml')?.setValue(html);
    this.form.get('contentHtml')?.markAsDirty();
  }

  // ===========================================================================
  // COVER (SINGLE IMAGE)
  // ===========================================================================
  onCoverFile(file: File): void {
    if (!file) return;

    this.uploadApi.uploadBlogImage(file, 'cover').subscribe({
      next: (res: any) => {
        this.coverPreview = res.url;
        this.form.get('coverImg')?.setValue(res.url);
      },
      error: () => {
        this.error = 'Error subiendo portada';
      },
    });
  }

  onCoverRemoved(_index: number): void {
    this.coverPreview = null;
    this.form.get('coverImg')?.setValue(null);
  }

  // ===========================================================================
  // GALERÍA (MULTIPLE IMAGES)
  // ===========================================================================
  onGalleryFiles(files: File[]): void {
    if (!files?.length) return;

    files.forEach((file) => {
      this.uploadApi.uploadBlogImage(file, 'body').subscribe({
        next: (res: any) => {
          this.galleryPreviews = [...this.galleryPreviews, res.url];
          this.form.get('galleryImgs')?.setValue(this.galleryPreviews);
        },
        error: () => {
          this.error = 'Error subiendo imagen de galería';
        },
      });
    });
  }

  onGalleryRemoved(index: number): void {
    this.galleryPreviews = this.galleryPreviews.filter((_, i) => i !== index);
    this.form.get('galleryImgs')?.setValue(this.galleryPreviews);
  }

  // ===========================================================================
  // ACTIONS
  // ===========================================================================
  saveDraft(): void {
    if (this.form.invalid) return;

    this.form.patchValue({
      isDraft: true,
      publishedAt: null,
    });

    this.submit();
  }

  publish(): void {
    if (this.form.invalid) return;

    const publishedAt = this.form.value.publishedAt
      ? new Date(this.form.value.publishedAt).toISOString()
      : new Date().toISOString();

    this.form.patchValue({
      isDraft: false,
      publishedAt,
    });

    this.submit();
  }

  private submit(): void {
    this.loading = true;
    this.error = null;

    const payload = this.form.value;

    const request$ = this.isEdit && this.postId
      ? this.blogApi.updatePost(this.postId, payload)
      : this.blogApi.createPost(payload);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/dashboard/blog']);
      },
      error: () => {
        this.error = 'No se pudo guardar el artículo.';
        this.loading = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/dashboard/blog']);
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================
  private toDatetimeLocal(value?: string | null): string | null {
    if (!value) return null;

    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
         + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
