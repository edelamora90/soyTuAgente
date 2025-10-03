// web/src/app/pages/cuenta/cuenta.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { finalize } from 'rxjs/operators';

/* === Validator: los campos "old" y "next" no pueden ser iguales === */
function notEqualValidator(a: string, b: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const va = group.get(a)?.value ?? '';
    const vb = group.get(b)?.value ?? '';
    return va && vb && va === vb ? { samePassword: true } : null;
  };
}

@Component({
  standalone: true,
  selector: 'app-cuenta',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="wrap">
      <h1>Mi cuenta</h1>

      <!-- === PERFIL === -->
      <form [formGroup]="profile" (ngSubmit)="saveProfile()" class="card">
        <h2>Perfil</h2>

        <label>
          Nombre
          <input type="text" formControlName="name" />
          <small class="err" *ngIf="profile.controls.name.touched && profile.controls.name.hasError('required')">
            El nombre es obligatorio.
          </small>
        </label>

        <label>
          Email
          <input type="email" formControlName="email" />
          <small class="err" *ngIf="profile.controls.email.touched && profile.controls.email.hasError('required')">
            El email es obligatorio.
          </small>
          <small class="err" *ngIf="profile.controls.email.touched && profile.controls.email.hasError('email')">
            Ingresa un email válido.
          </small>
        </label>

        <button class="btn btn-primary" type="submit" [disabled]="profile.invalid || busy">Guardar</button>
      </form>

      <!-- === CONTRASEÑA === -->
      <form [formGroup]="password" (ngSubmit)="savePassword()" class="card">
        <h2>Contraseña</h2>

        <label>
          Actual
          <input type="password" formControlName="old" autocomplete="current-password" />
          <small class="err" *ngIf="password.controls.old.touched && password.controls.old.hasError('required')">
            La contraseña actual es obligatoria.
          </small>
          <small class="err" *ngIf="password.controls.old.touched && password.controls.old.hasError('invalidCurrent')">
            Contraseña actual incorrecta.
          </small>
        </label>

        <label>
          Nueva
          <input type="password" formControlName="next" autocomplete="new-password" />
          <small class="err" *ngIf="password.controls.next.touched && password.controls.next.hasError('required')">
            La nueva contraseña es obligatoria.
          </small>
          <small class="err" *ngIf="password.controls.next.touched && password.controls.next.hasError('minlength')">
            Debe tener al menos {{ password.controls.next.getError('minlength')?.requiredLength }} caracteres.
          </small>
        </label>

        <small class="err" *ngIf="password.touched && password.hasError('samePassword')">
          La nueva contraseña no puede ser igual a la actual.
        </small>

        <button class="btn btn-primary" type="submit" [disabled]="password.invalid || busy">
          {{ busy ? 'Actualizando…' : 'Actualizar' }}
        </button>

        <p class="form-error" *ngIf="errPass">{{ errPass }}</p>
        <p class="form-ok" *ngIf="okPass">{{ okPass }}</p>
      </form>
    </section>
  `,
  styles:[`
    .wrap{ max-width:720px; margin:20px auto; padding:0 16px;}
    .card{ border:1px solid #e9efec; border-radius:14px; padding:14px; margin:16px 0; display:grid; gap:10px; }
    label{ display:grid; gap:6px; }
    input{ height:40px; border:1px solid #d0d5dd; border-radius:10px; padding:0 12px; }
    .btn{ height:40px; border-radius:999px; padding:0 16px; border:0; background:#0fb366; color:#fff; font-weight:800; }
    .btn[disabled]{ opacity:.6; cursor:not-allowed; }
    .err{ color:#b42318; font-size:12px; }
    .form-error{ color:#b42318; background:#fee4e2; border:1px solid #fda29b; padding:8px 10px; border-radius:8px; }
    .form-ok{ color:#027a48; background:#ecfdf3; border:1px solid #abefc6; padding:8px 10px; border-radius:8px; }
  `]
})
export class CuentaComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  busy = false;
  errPass = '';
  okPass = '';

  // PERFIL (non-nullable)
  profile = this.fb.nonNullable.group({
    name:  ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  // CONTRASEÑA (non-nullable + validadores)
  password = this.fb.nonNullable.group({
    old:  ['', [Validators.required]],
    next: ['', [Validators.required, Validators.minLength(8)]],
  }, { validators: [notEqualValidator('old','next')] });

  // ===== Prefill desde AuthService + localStorage (respaldo)
  private getUserBasics() {
    const u = this.auth.user?.() as { username?: string; name?: string } | null | undefined;
    const email = u?.username ?? localStorage.getItem('auth_email') ?? '';
    const name  = u?.name     ?? localStorage.getItem('auth_name')  ?? (email.split('@')[0] || '');
    return { name, email };
  }

  ngOnInit() {
    const { name, email } = this.getUserBasics();
    this.profile.patchValue({ name, email });
    window.addEventListener('storage', this._onStorage);
  }
  ngOnDestroy() { window.removeEventListener('storage', this._onStorage); }

  private _onStorage = (e: StorageEvent) => {
    if (e.key === 'auth_name' || e.key === 'auth_email') {
      const { name, email } = this.getUserBasics();
      this.profile.patchValue({ name, email }, { emitEvent: false });
    }
  };

  // ===== Acciones
  saveProfile(){
    if (this.profile.invalid) { this.profile.markAllAsTouched(); return; }
    this.busy = true;
    const { name, email } = this.profile.getRawValue();

    // TODO: API real
    // this.api.updateProfile({ name, email }).pipe(finalize(() => this.busy = false)).subscribe({ ... });

    // Respaldo local
    localStorage.setItem('auth_name',  name);
    localStorage.setItem('auth_email', email);
    this.busy = false;
    this.okPass = 'Perfil actualizado.';
    setTimeout(() => this.okPass = '', 2500);
  }

  savePassword(){
    if (this.password.invalid) { this.password.markAllAsTouched(); return; }

    this.errPass = '';
    this.okPass = '';
    this.busy = true;

    const { old, next } = this.password.getRawValue();

    // === Llamada real al servicio ===
    this.auth.changePassword(old, next).pipe(
      finalize(() => this.busy = false)
    ).subscribe({
      next: () => {
        this.okPass = 'Contraseña actualizada.';
        this.password.reset();  // limpia el form
        setTimeout(() => this.okPass = '', 2500);
      },
      error: (e) => {
        // Si el backend dice "contraseña actual incorrecta"
        if (e?.status === 400 || e?.status === 401) {
          this.password.controls.old.setErrors({ invalidCurrent: true });
          this.password.controls.old.markAsTouched();
          return;
        }
        this.errPass = e?.error?.message ?? 'No se pudo actualizar la contraseña.';
      }
    });

    /* === Si aún no tienes endpoint, usa esta simulación temporal (borra al tener API) ===
    setTimeout(() => {
      this.busy = false;
      // Simular incorrecta:
      if (old !== 'demo123') {
        this.password.controls.old.setErrors({ invalidCurrent: true });
        this.password.controls.old.markAsTouched();
        return;
      }
      this.okPass = 'Contraseña actualizada.';
      this.password.reset();
      setTimeout(() => this.okPass = '', 2500);
    }, 700);
    */
  }
}
