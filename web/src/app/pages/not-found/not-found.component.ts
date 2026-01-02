import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="nf">
      <h1>Agente no encontrado</h1>
      <p>El perfil que buscas no existe o fue movido.</p>
      <a routerLink="/agentes" class="btn">Volver a la lista</a>
    </section>
  `,
  styles:[`
    .nf{ max-width:720px;margin:48px auto;padding:0 16px;text-align:center}
    .btn{display:inline-block;margin-top:12px;background:#0fb366;color:#fff;
         border-radius:999px;padding:10px 16px;text-decoration:none;font-weight:800}
  `]
})
export class NotFoundComponent {}
