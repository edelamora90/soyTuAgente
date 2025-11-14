//web/src/app/pages/admin/dashboard/admin-dashboard.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SubmissionsApi } from '../../../core/submissions/submissions.api';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
  <section class="dash">
    <!-- Lateral -->
    <aside class="side">
      <h3 class="logo">Admin</h3>

      <nav class="menu">
        <a routerLink="agregar" routerLinkActive="active">➕ Agregar agente</a>

        <a routerLink="solicitudes" routerLinkActive="active" class="with-badge">
          📨 Solicitudes
          <span class="badge" *ngIf="pending() > 0">{{ pending() }}</span>
        </a>

        <a routerLink="agentes" routerLinkActive="active">🛠️ Editar agentes</a>
      
      <a [routerLink]="['/admin','blog']" routerLinkActive="active">📰 Artículos</a>
<a [routerLink]="['/admin','blog','new']" routerLinkActive="active">✍️ Nuevo artículo</a>
</nav>
    </aside>

    <!-- Contenido -->
    <main class="content">
      <!-- Vista “vacía” (cuando no hay child en el outlet) -->
      <section class="blank" *ngIf="!hasChild()">
        <header class="brand">
          <img src="assets/logo.svg" alt="" class="brand-logo" />
          
        </header>

        <h2 class="welcome-title">Bienvenido {{ userName }} al Panel de administración.</h2>
        <p class="welcome-desc">
          Consulta y gestiona la información de los perfiles de agentes inscritos en la plataforma.
        </p>

        <p class="helper">
          <span class="ico" aria-hidden="true">ℹ️</span>
          ¿Preguntas? Revisa la documentación
          <a href="#" aria-label="Abrir documentación">aquí</a>.
        </p>
      </section>

      <!-- Aquí renderizan las pantallas hijas -->
      <router-outlet (activate)="onActivate()" (deactivate)="onDeactivate()"></router-outlet>
    </main>
  </section>
  `,
  styles: [`
  /* Layout general */
  .dash{
    display:grid;
    grid-template-columns:260px 1fr;
    min-height:calc(100vh - 64px);
  }

  /* Lateral izquierdo */
  .side{
    border-right:1px solid #e6ece9;
    padding:16px 14px;
    background:#fbfdfc;
    position:sticky;
    top:64px;
    height:calc(100vh - 64px);
  }
  .logo{ margin:0 0 12px; font-weight:900; letter-spacing:.3px; color:#0b2f34; }
  .menu{ display:grid; gap:6px; }
  .menu a{
    text-decoration:none; color:#0b2f34;
    padding:10px 12px; border-radius:10px;
    display:flex; gap:8px; align-items:center;
  }
  .menu a.active, .menu a:hover{ background:#eaf6f2; }
  .with-badge{ justify-content:space-between; }
  .badge{
    min-width:22px; height:22px; border-radius:999px; display:inline-grid; place-items:center;
    font-size:12px; font-weight:800; color:#fff; background:#00b871; padding:0 6px;
  }

  /* Área de contenido */
  .content{
    position:relative;
    padding:24px 28px;
    overflow:auto;
  }

  /* Vista “vacía” (derecha como en el diseño) */
  .blank{
    display:flex;
    flex-direction:column;
    height:100%;
    padding-bottom:48px; /* deja aire para la ayuda fijada abajo */
  }

  .brand{
    display:flex; align-items:center; gap:10px;
    margin-bottom:16px;
    opacity:.85;
  }
  .brand-logo{
    height:28px; width:auto; display:block;
    filter:grayscale(100%) contrast(.95) opacity(.75);
  }
  .brand-name{
    font-weight:800; letter-spacing:.2px; color:#6b7a75;
  }

  .welcome-title{
    margin:4px 0 10px;
    font-weight:900;
    letter-spacing:-.02em;
    color:#0b2f34;
    font-size:clamp(18px, 2.4vw, 22px);
  }
  .welcome-desc{
    margin:0 0 8px;
    color:#6a7f79;
    font-size:14px;
  }

  /* Ayuda (parte inferior izquierda del panel) */
  .helper{
    position:fixed;
    left:calc(260px + 28px); /* respeta el ancho del lateral + padding */
    bottom:16px;
    margin:0;
    color:#7b8a85;
    font-size:12.5px;
  }
  .helper .ico{ margin-right:6px; }
  .helper a{
    color:#00b871; font-weight:700; text-decoration:none;
  }
  .helper a:hover{ text-decoration:underline; }

  @media (max-width: 960px){
    .dash{ grid-template-columns:1fr; }
    .side{
      position:static; height:auto; border-right:0; border-bottom:1px solid #e6ece9;
    }
    .helper{
      left:28px; /* ya no hay sidebar fijo */
    }
  }
  `]
})
export class AdminDashboardComponent {
  private api = inject(SubmissionsApi);
  pending = signal(0);

  // Lee el nombre guardado por el login
  userName = localStorage.getItem('auth_name') || 'Administrador';

  // Control de visibilidad de la sección “vacía”
  private _hasChild = signal(false);
  hasChild = this._hasChild.asReadonly();

  onActivate()   { this._hasChild.set(true); }
  onDeactivate() { this._hasChild.set(false); }

  ngOnInit() {
    this.refreshPending();
    window.addEventListener('focus', this.refreshPending);
  }
  ngOnDestroy() {
    window.removeEventListener('focus', this.refreshPending);
  }

  refreshPending = () => {
    this.api.list('PENDING').subscribe({
      next: rows => this.pending.set(rows?.length ?? 0),
      error: _ => this.pending.set(0),
    });
  };
}
