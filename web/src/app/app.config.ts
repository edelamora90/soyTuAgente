// web/src/app/app.config.ts
import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';

import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { appRoutes } from './app.routes';
import { AuthInterceptor } from './core/http/auth.interceptor';

import { AGENTS_DATA } from './core/agents/agents.data';
import { AgentsApiDataService } from './core/agents/agents.api-data';

import { MarkdownModule } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(MarkdownModule.forRoot()),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },

    // Proveedor del directorio de agentes (tu implementación de API)
    { provide: AGENTS_DATA, useClass: AgentsApiDataService },

    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
  ],
};
