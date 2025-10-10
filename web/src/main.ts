// web/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';

import { AppComponent } from './app/app';     
import { appConfig } from './app/app.config';

import { environment } from './environments/environment';


import { AGENTS_DATA } from './app/core/agents/agents.data';
import { AgentsApi } from './app/core/agents/agents.api';
import { AgentsMockService } from './app/core/agents/agents.mock';



// Extiende tu appConfig con los providers necesarios
const config: ApplicationConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
    provideHttpClient(withFetch()),
    {
      provide: AGENTS_DATA,
      useExisting: environment.useMock ? AgentsMockService : AgentsApi,
    },
  ],
};
bootstrapApplication(AppComponent, config)
  .catch((err) => console.error(err));
