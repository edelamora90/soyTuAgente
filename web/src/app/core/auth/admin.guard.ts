import { inject } from '@angular/core';
import { Router, UrlTree, CanActivateFn, CanMatchFn, Route, UrlSegment } from '@angular/router';
import { AuthService } from './auth.service';

function hasAdminRole(roles?: string[] | null) {
  return !!roles?.some(r => r.toLowerCase() === 'admin');
}

async function ensureAdminOrRedirect(returnUrl: string): Promise<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);

  const ok = await auth.ensureValidSession();
  if (!ok) return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl } });

  if (hasAdminRole(auth.user()?.roles)) return true;
  return router.createUrlTree(['/']);
}

export const adminGuard: CanActivateFn = (_route, state) =>
  ensureAdminOrRedirect(state.url || '/');

export const adminMatchGuard: CanMatchFn = (_route: Route, segs: UrlSegment[]) => {
  const url = '/' + segs.map(s => s.path).join('/');
  return ensureAdminOrRedirect(url);
};
