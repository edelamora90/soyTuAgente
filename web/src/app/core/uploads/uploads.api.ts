// web/src/app/core/uploads/uploads-blog.api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UploadResult = {
  url: string;
  filename: string;
};

@Injectable({ providedIn: 'root' })
export class UploadsBlogApi {
  private http = inject(HttpClient);

  private BASE = 'http://localhost:3000/api/uploads/blog';

  // ▬▬▬▬▬▬▬ COVER (1 archivo) ▬▬▬▬▬▬▬
  uploadCover(file: File): Observable<string> {
    const fd = new FormData();
    fd.append('file', file);

    return new Observable((observer) => {
      this.http.post<UploadResult>(`${this.BASE}/cover`, fd).subscribe({
        next: (r) => {
          observer.next(r.url);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  // ▬▬▬▬▬▬▬ ASSETS (múltiples archivos) ▬▬▬▬▬▬▬
  uploadAssets(files: FileList | File[]): Observable<string[]> {
    const fd = new FormData();

    Array.from(files).forEach((file) => fd.append('files', file));

    return new Observable((observer) => {
      this.http.post<UploadResult[]>(`${this.BASE}/assets`, fd).subscribe({
        next: (list) => {
          const urls = list.map((x) => x.url);
          observer.next(urls);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }
}
