//web/src/app/app.config.ts
// ============================================================================
// APP.CONFIG — CONFIGURACIÓN GLOBAL DE LA APLICACIÓN
// Standalone Components + Angular Material + Markdown + HttpClient + Router
// ============================================================================

import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';

import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';

import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Angular Material (opcional pero recomendado para UX consistente)
import {
  MAT_RIPPLE_GLOBAL_OPTIONS,
  RippleGlobalOptions,
} from '@angular/material/core';

import { appRoutes } from './app.routes';
import { AuthInterceptor } from './core/http/auth.interceptor';

// Markdown
import { MarkdownModule } from 'ngx-markdown';

// Agentes (tu implementación actual)
import { AGENTS_DATA } from './core/agents/agents.data';
import { AgentsApiDataService } from './core/agents/agents.api-data';

// Configuración de ripple (Material Design)
const globalRippleConfig: RippleGlobalOptions = {
  disabled: false,
  animation: {
    enterDuration: 200,
    exitDuration: 150,
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular Material animations
    importProvidersFrom(BrowserAnimationsModule),

    // Markdown global
    importProvidersFrom(MarkdownModule.forRoot()),

    // HTTP + Interceptores
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },

    // Agentes (API)
    { provide: AGENTS_DATA, useClass: AgentsApiDataService },

    // Error tracking y zone optimization
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),

    // Material ripple
    { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: globalRippleConfig },
  ],
};
