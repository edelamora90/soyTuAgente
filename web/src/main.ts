// web/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

// Tokens/servicios BLOG
import { BLOG_DATA } from './app/core/services/blog.token';
import { BlogApiService } from './app/core/services/blog-api.service';
import { BlogService } from './app/core/services/blog.service';

// Tokens/servicios AGENTES
import { AGENTS_DATA } from './app/core/agents/agents.data';
import { AgentsApi } from './app/core/agents/agents.api';
import { AgentsMockService } from './app/core/agents/agents.mock';

// Extiende tu appConfig con los providers necesarios
const config: ApplicationConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),

    // HttpClient una sola vez
    provideHttpClient(withFetch()),

    // Agentes: token -> servicio (mock o api)
    {
      provide: AGENTS_DATA,
      useExisting: environment.useMock ? AgentsMockService : AgentsApi,
    },

    // Blog: token -> servicio (mock o api)
    {
      provide: BLOG_DATA,
      useExisting: environment.useMock ? BlogService : BlogApiService,
    },
  ],
};

bootstrapApplication(AppComponent, config).catch(err => console.error(err));
