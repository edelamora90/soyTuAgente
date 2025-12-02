// web/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/admin/login/login.component';
import { adminGuard, adminMatchGuard } from './core/auth/admin.guard';

// 🔥 Blog eliminado temporalmente
// import { blogPostResolver } from './pages/blog-post/blog-post.resolver';

export const appRoutes: Routes = [
  // ====== Público ======
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'solicitar-agente',
    loadComponent: () =>
      import('./pages/solicitar-agente/solicitar-agente.component')
        .then(m => m.SolicitarAgenteComponent),
  },
  { path: 'unirme', redirectTo: 'solicitar-agente', pathMatch: 'full' },

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
          .then(m => m.agentResolver)
    },
  },

  {
    path: '404',
    loadComponent: () =>
      import('./pages/not-found/not-found.component')
        .then(m => m.NotFoundComponent),
  },

  {
    path: 'nosotros',
    loadComponent: () =>
      import('./pages/nosotros/nosotros.page').then(m => m.NosotrosPage),
  },

  // ====== Login directo ======
  { path: 'admin/login', component: LoginComponent },

  // ====== Admin protegido ======
  {
    path: 'admin',
    canMatch: [adminMatchGuard],
    loadComponent: () =>
      import('./pages/admin/dashboard/admin-dashboard.component')
        .then(m => m.AdminDashboardComponent),
    children: [
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./pages/admin/solicitudes/solicitudes-list.component')
            .then(m => m.SolicitudesListComponent),
      },
      {
        path: 'cuenta',
        loadComponent: () =>
          import('./pages/cuenta/cuenta.component')
            .then(m => m.CuentaComponent),
      },
      {
        path: 'agentes',
        loadComponent: () =>
          import('./pages/admin/agents/agentes-list.component')
            .then(m => m.AdminAgentesListComponent),
      },
      {
        path: 'agregar',
        loadComponent: () =>
          import('./pages/admin/agents/agent-new.page')
            .then(m => m.AgentNewPage),
      },
      {
        path: 'agentes/:slug/edit',
        loadComponent: () =>
          import('./pages/admin/agents/agent-new.page')
            .then(m => m.AgentNewPage),
      },

      // 🔥 Rutas del blog ELIMINADAS
      // { path: 'blog', ... }
      // { path: 'blog/new', ... }
      // { path: 'blog/:id/edit', ... }
    ],
  },

  // Si entra a /admin sin login → login
  { path: 'admin', pathMatch: 'full', component: LoginComponent },

  // 🔥 Rutas públicas del blog ELIMINADAS
  // { path: 'blog', ... }
  // { path: 'blog/:slug', ... }

  // ====== Fallback ======
  { path: '**', redirectTo: '' },
];
