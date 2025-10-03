import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE = 'http://localhost:3000/api/uploads/agents';

export type UploadResp = { url: string; filename: string };

@Injectable({ providedIn: 'root' })
export class UploadsApi {
  private http = inject(HttpClient);

  upload(file: File, folder?: 'hero' | 'avatar' | 'gallery'): Observable<UploadResp> {
    const fd = new FormData();
    fd.append('file', file);

    let params = new HttpParams();
    if (folder) params = params.set('folder', folder);

    return this.http.post<UploadResp>(BASE, fd, { params });
  }
}
