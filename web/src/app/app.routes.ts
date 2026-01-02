import { Routes } from '@angular/router';
import { LoginComponent } from './pages/admin/login/login.component';
import { adminMatchGuard } from './core/auth/admin.guard';

export const appRoutes: Routes = [

  // ===========================================================================
  // PÚBLICO
  // ===========================================================================

  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },

  // --- Solicitud de agentes ---
  {
    path: 'solicitar-agente',
    loadComponent: () =>
      import('./pages/solicitar-agente/solicitar-agente.component')
        .then(m => m.SolicitarAgenteComponent),
  },
  { path: 'unirme', redirectTo: 'solicitar-agente', pathMatch: 'full' },

  // --- Directorio de agentes ---
  {
    path: 'agentes',
    loadComponent: () =>
      import('./pages/agentes/list/list.component').then(m => m.ListComponent),
  },
  {
    path: 'agente/:slug',
    loadComponent: () =>
      import('./pages/agentes/profile/agente-profile.component')
        .then(m => m.AgenteProfileComponent),
    resolve: {
      agent: () =>
        import('./pages/agentes/profile/agent.resolver')
          .then(m => m.agentResolver),
    },
  },

  // --- Páginas estáticas ---
  {
    path: 'nosotros',
    loadComponent: () =>
      import('./pages/nosotros/nosotros.page').then(m => m.NosotrosPage),
  },
  {
    path: 'contacto',
    loadComponent: () =>
      import('./pages/contact/contact.component')
        .then(m => m.ContactPageComponent),
  },
  {
    path: 'preguntas-frecuentes',
    loadComponent: () =>
      import('./pages/faq/faq.component').then(m => m.FaqPageComponent),
  },
  {
    path: 'terminos',
    loadComponent: () =>
      import('./pages/static/terms-and-conditions.component')
        .then(m => m.TermsAndConditionsPageComponent),
  },

  // --- Eventos (público) ---
  {
    path: 'eventos',
    loadComponent: () =>
      import('./pages/events/events-public-list.component')
        .then(m => m.EventsPublicListComponent),
  },
  {
    path: 'eventos/:slug',
    loadComponent: () =>
      import('./pages/events/event-detail.component')
        .then(m => m.EventDetailComponent),
  },

  // --- Blog (público) ---
  {
    path: 'blog',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/blog/blog-public-list.component')
            .then(m => m.BlogPublicListComponent),
      },
      {
        path: ':slug',
        loadComponent: () =>
          import('./pages/blog/blog-detail.component')
            .then(m => m.BlogDetailComponent),
      },
    ],
  },

  // --- 404 ---
  {
    path: '404',
    loadComponent: () =>
      import('./pages/not-found/not-found.component')
        .then(m => m.NotFoundComponent),
  },

  // ===========================================================================
  // ADMIN
  // ===========================================================================

  // Login (SIN guard)
  { path: 'admin/login', component: LoginComponent },

  // /admin → /admin/dashboard
  { path: 'admin', pathMatch: 'full', redirectTo: 'admin/dashboard' },

  // Dashboard protegido
  {
    path: 'admin/dashboard',
    canMatch: [adminMatchGuard],
    loadComponent: () =>
      import('./pages/admin/dashboard/admin-dashboard.component')
        .then(m => m.AdminDashboardComponent),
    children: [

      // --- Solicitudes ---
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./pages/admin/solicitudes/solicitudes-list.component')
            .then(m => m.SolicitudesListComponent),
      },

      // --- Cuenta ---
      {
        path: 'cuenta',
        loadComponent: () =>
          import('./pages/cuenta/cuenta.component')
            .then(m => m.CuentaComponent),
      },

      // --- Agentes ---
      {
        path: 'agentes',
        loadComponent: () =>
          import('./pages/admin/agents/agentes-list.component')
            .then(m => m.AdminAgentesListComponent),
      },
      {
        path: 'agentes/nuevo',
        loadComponent: () =>
          import('./pages/admin/agents/agent-new.page')
            .then(m => m.AgentNewPage),
      },
      {
        path: 'agentes/:slug/editar',
        loadComponent: () =>
          import('./pages/admin/agents/agent-new.page')
            .then(m => m.AgentNewPage),
      },

      // --- Eventos ---
      {
        path: 'eventos',
        loadComponent: () =>
          import('./pages/admin/events/events-admin-list.component')
            .then(m => m.EventsAdminListComponent),
      },
      {
        path: 'eventos/nuevo',
        loadComponent: () =>
          import('./pages/admin/events/event-editor.component')
            .then(m => m.EventEditorComponent),
      },
      {
        path: 'eventos/:id/editar',
        loadComponent: () =>
          import('./pages/admin/events/event-editor.component')
            .then(m => m.EventEditorComponent),
      },

      // --- Blog ---
      {
        path: 'blog',
        loadComponent: () =>
          import('./pages/admin/blog/blog-admin-list.component')
            .then(m => m.BlogAdminListComponent),
      },
      {
        path: 'blog/nuevo',
        loadComponent: () =>
          import('./pages/admin/blog/blog-editor.component')
            .then(m => m.BlogEditorComponent),
      },
      {
        path: 'blog/:id/editar',
        loadComponent: () =>
          import('./pages/admin/blog/blog-editor.component')
            .then(m => m.BlogEditorComponent),
      },

      // Default dashboard
      { path: '', pathMatch: 'full', redirectTo: 'admin' },
    ],
  },

  // ===========================================================================
  // FALLBACK
  // ===========================================================================

  { path: '**', redirectTo: '404' },
];
