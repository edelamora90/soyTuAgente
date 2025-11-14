// web/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/admin/login/login.component';
import { adminGuard, adminMatchGuard } from './core/auth/admin.guard';
import { blogPostResolver } from './pages/blog-post/blog-post.resolver';

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
  resolve: { agent: () => import('./pages/agentes/profile/agent.resolver')
                         .then(m => m.agentResolver) }
},
{ path: '404', loadComponent: () =>
    import('./pages/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
    },
  {
    path: 'nosotros',
    loadComponent: () =>
      import('./pages/nosotros/nosotros.page').then(m => m.NosotrosPage),
  },

  // ====== Auth admin (URL directa al login) ======
  { path: 'admin/login', component: LoginComponent },

  // ====== Admin protegido con canMatch (si está logeado entra aquí) ======
  {
  path: 'admin',
  canMatch: [adminMatchGuard],  // si está logeado, entra al dashboard
  loadComponent: () =>
    import('./pages/admin/dashboard/admin-dashboard.component')
      .then(m => m.AdminDashboardComponent),
  children: [
    // 👇 sin redirect en el hijo vacío (deja que se vea la marca de agua)
    // { path: '', pathMatch: 'full', redirectTo: 'solicitudes' },  // <-- QUITAR

    // Solicitudes
    {
      path: 'solicitudes',
      loadComponent: () =>
        import('./pages/admin/solicitudes/solicitudes-list.component')
          .then(m => m.SolicitudesListComponent),
    },

    // Cuenta
    {
      path: 'cuenta',
      loadComponent: () =>
        import('../app/pages/cuenta/cuenta.component')
          .then(m => m.CuentaComponent),
    },

    // Agentes (lista)
    {
      path: 'agentes',
      loadComponent: () =>
        import('./pages/admin/agents/agentes-list.component')
          .then(m => m.AdminAgentesListComponent),
    },

    // Alta/edición
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
    {
      path: 'blog',
      loadComponent: () =>
        import('./pages/admin/blog/posts-admin-list.component')
          .then(m => m.PostsAdminListComponent),
    },
    {
      path: 'blog/new',
      loadComponent: () =>
        import('./pages/admin/blog/post-editor.component')
          .then(m => m.PostEditorComponent),
    },
    {
      path: 'blog/:id/edit',
      loadComponent: () =>
        import('./pages/admin/blog/post-editor.component')
          .then(m => m.PostEditorComponent),
    },

  

    // ... tus otras rutas admin (agents, submissions, cuenta, etc.)
  ],
},



// Si NO está logeado y entra a /admin, mostrar login:
{ path: 'admin', pathMatch: 'full', component: LoginComponent },

{
  path: 'blog',
  loadComponent: () =>
    import('./pages/blog-list/blog-list.component')
      .then(m => m.BlogListComponent),
},
{
  path: 'blog/:slug',
  loadComponent: () =>
    import('./pages/blog-post/blog-post.component')
      .then(m => m.BlogPostComponent),
  resolve: { post: blogPostResolver },
},
  // ====== Fallback ======
  { path: '**', redirectTo: '' },
];
