import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);

  private needsAuth(req: HttpRequest<any>): boolean {
    // Autenticamos TODO lo de /api/submissions excepto el POST público (crear solicitud)
    const isSubmissions = req.url.includes('/api/submissions');
    const isPublicPost = isSubmissions && req.method === 'POST';
    return isSubmissions && !isPublicPost;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const mustAuth = this.needsAuth(req);
    const token = this.auth.accessToken;

    const authedReq = mustAuth && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authedReq).pipe(
      catchError((err: HttpErrorResponse) => {
        // Si requiere auth y venció el access -> intenta refresh UNA vez
        if (mustAuth && err.status === 401 && this.auth.refreshToken) {
          return this.auth.refresh().pipe(
            switchMap(({ accessToken }) => {
              const retry = req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
              return next.handle(retry);
            })
          );
        }
        // 403 u otros -> limpia y propaga
        if (mustAuth && (err.status === 403 || err.status === 401)) {
          this.auth.clear();
        }
        return throwError(() => err);
      })
    );
  }
}
