//web/src/app/core/auth/auth.interceptor.ts
import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, from, switchMap, throwError, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../enviroments/enviroment';

function shouldAttach(url: string): boolean {
  // Adjunta a rutas relativas /api/... o a environment.apiUrl
  return url.startsWith('/api') || url.startsWith(environment.apiUrl);
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // no tocar login/refresh al salir
    const isAuthCall = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

    if (!shouldAttach(req.url) || isAuthCall) {
      return next.handle(req);
    }

    // 1) asegúrate de tener access válido (refresh si hace falta)
    return from(this.auth.getValidAccessToken()).pipe(
      switchMap(token => {
        const withAuth = token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req;

        // 2) ejecuta request; si 401 intenta un refresh único y reintenta
        return next.handle(withAuth).pipe(
          catchError((err: any) => {
            if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthCall) {
              // intenta refrescar y reintenta una vez
              return from(this.auth.refresh()).pipe(
                switchMap(() => {
                  const retryToken = this.auth.accessToken;
                  const retried = retryToken
                    ? req.clone({ setHeaders: { Authorization: `Bearer ${retryToken}` } })
                    : req;
                  return next.handle(retried);
                }),
                catchError(e2 => {
                  this.auth.forceLogout();
                  return throwError(() => e2);
               })
              );
            }
            return throwError(() => err);
          })
        );
      })
    );
  }
}
