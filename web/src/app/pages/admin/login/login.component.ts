// web/src/app/pages/admin/login/login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="auth-wrap">
      <header class="login-brand">
        <a routerLink="/" aria-label="Ir al inicio">
          <img
            src="assets/icono.svg"
            alt="Soy tu Agente"
            width="200"
            height="64"
            loading="eager"
            decoding="async"
            fetchpriority="high"
          />
        </a>
      </header>

      <div class="auth-card">
        <h1>Acceso admin</h1>

        <form [formGroup]="f" (ngSubmit)="submit()">
          <div class="field">
            <label for="user">Usuario</label>
            <input
              id="user"
              type="text"
              formControlName="username"
              placeholder="tu@correo.com"
              autocomplete="username"
              [class.invalid]="f.controls.username.touched && f.controls.username.invalid"
            />
          </div>

          <div class="field">
            <label for="pass">Contraseña</label>
            <div class="password">
              <input
                id="pass"
                [type]="hide ? 'password' : 'text'"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
                [class.invalid]="f.controls.password.touched && f.controls.password.invalid"
              />
              <button
                id="toggle-pass"
                type="button"
                class="icon-btn"
                (click)="hide = !hide"
                [attr.aria-pressed]="!hide"
                [attr.aria-label]="hide ? 'Mostrar contraseña' : 'Ocultar contraseña'"
                [title]="hide ? 'Mostrar contraseña' : 'Ocultar contraseña'"
                [style.background-image]="'url(assets/icons/contrasena-de-ojo.png)'"
              ></button>
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-ghost" type="button" (click)="f.reset()" [disabled]="busy">Limpiar</button>
            <button class="btn btn-primary" type="submit" [disabled]="f.invalid || busy">
              {{ busy ? 'Entrando…' : 'Entrar' }}
            </button>
          </div>

          <p class="form-error" *ngIf="err">{{ err }}</p>
        </form>
      </div>
    </section>
  `,
  styles: [`
    :host { display:block; }
    :root {
      --brand:#0fb366; --ink:#0b2f34; --muted:#6a7f79; --border:#d0d5dd;
      --panel:#fff; --surface:#f5f8f7; --shadow:0 10px 30px rgba(16,24,40,.08);
    }

    /* Layout general */
    :host .auth-wrap{
      min-height: 100svh;
      display: grid;
      grid-auto-rows: max-content;
      align-content: start;
      justify-items: center;
      row-gap: 8px;
      padding: 24px;
      background: var(--surface);
    }

    /* Logo */
    :host .login-brand{
      display: flex; justify-content: center;
      margin: 0; padding: 0; line-height: 0;
    }
    :host .login-brand img{ display:block; width:clamp(140px, 18vw, 220px); height:auto; }

    /* Tarjeta */
    .auth-card{
      width:100%; max-width:420px; background:var(--panel);
      border:1px solid #e9efec; border-radius:18px; box-shadow:var(--shadow);
      padding:clamp(18px,4vw,28px); margin:0;
    }
    .auth-card h1{ margin:0 0 14px; font-weight:900; color:var(--ink); font-size:clamp(20px,2.2vw,24px); }

    /* Form */
    .field{ display:grid; gap:6px; margin-bottom:14px; }
    .field label{ font-weight:700; color:var(--ink); font-size:14px; }

    .field input{
      box-sizing:border-box; display:block; width:100%; height:44px;
      border-radius:12px; border:1px solid var(--border); background:#fff;
      padding:0 14px; outline:none; font-size:14px;
      transition:border-color .15s, box-shadow .15s, background .15s;
    }

    /* Contraseña con icono interno */
    .password{ position:relative; }
    .password input{ height:44px; padding-right:44px; }
    .password .icon-btn{
      position:absolute; right:8px; top:50%; transform:translateY(-50%);
      z-index:2; width:28px; height:28px; padding:0; border:0; border-radius:6px;
      background-color:transparent; background-repeat:no-repeat; background-position:center; background-size:18px 18px;
      cursor:pointer; opacity:.9; transition: background-color .15s, opacity .15s;
    }
    .password .icon-btn:hover{ background-color:#f3f6f5; opacity:1; }

    .field input::placeholder{ color:#9aa7a1; }
    .field input:focus{ border-color:var(--brand); box-shadow:0 0 0 4px color-mix(in srgb, var(--brand) 16%, transparent); }
    .field input.invalid{ border-color:#ef4444; box-shadow:0 0 0 4px rgba(239,68,68,.10); }

    .actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:6px; }
    .btn{ height:40px; padding:0 16px; border-radius:999px; display:inline-flex; align-items:center; gap:8px; font-weight:700; font-size:14px; border:1px solid transparent; cursor:pointer; transition:background .15s, border-color .15s, transform .12s; }
    .btn-primary{ background:var(--brand); color:#fff; box-shadow:0 8px 18px rgba(15,179,102,.25); }
    .btn-primary:hover{ background:color-mix(in srgb, var(--brand) 85%, black); transform:translateY(-1px); }
    .btn-primary:disabled{ opacity:.6; cursor:not-allowed; transform:none; }
    .btn-ghost{ background:#fff; color:var(--ink); border-color:var(--border); box-shadow:0 1px 2px rgba(16,24,40,.06); }
    .btn-ghost:hover{ background:#f7faf9; border-color:#c5cdd6; transform:translateY(-1px); }

    .form-error{ margin-top:10px; color:#c0362c; background:#fdebea; border:1px solid #f7c5c0; border-radius:10px; padding:10px 12px; font-size:13px; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  hide = true;
  busy = false;
  err?: string;

  f = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit() {
    this.err = undefined;
    if (this.f.invalid) { this.f.markAllAsTouched(); return; }
    this.busy = true;

    const { username, password } = this.f.getRawValue();
    this.auth.login(username!, password!).subscribe({
      next: (resp: any) => {
        this.busy = false;

        // === Guarda el nombre del usuario para el dashboard ===
        const nameFromApi =
          resp?.user?.name ??
          resp?.name ??
          resp?.profile?.fullName ??
          username; // fallback al usuario

        localStorage.setItem('auth_name', (nameFromApi || 'Administrador').toString());

        this.router.navigateByUrl('/admin');
      },
      error: (e) => {
        this.busy = false;
        this.err = e?.error?.message ?? 'Error de login';
      }
    });
  }
}
