// web/src/app/layout/header/header.component.ts
import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  // === UI state ===
  open = false;      // hamburguesa
  userOpen = false;  // dropdown usuario

  // === servicios ===
  auth = inject(AuthService);
  private router = inject(Router);

  // ---- Helpers de sesión (robustos) ----
  // ---- Helpers de sesión ----
isLoggedIn(): boolean {
  const u = this.auth.user?.() as { username?: string } | null | undefined;
  return !!(u?.username || localStorage.getItem('auth_name'));
}

displayName(): string {
  const u = this.auth.user?.() as { username?: string } | null | undefined;
  // usa username del servicio o el nombre guardado en login
  return u?.username || localStorage.getItem('auth_name') || 'Usuario';
}

initials(): string {
  const n = this.displayName().trim();
  if (!n) return 'US';
  const parts = n.split(/\s+/);
  const a = (parts[0]?.[0] || '').toUpperCase();
  const b = (parts[1]?.[0] || '').toUpperCase();
  return (a + (b || '') || 'US');
}

shortName(): string {
  const n = this.displayName().trim();
  const [first, second] = n.split(/\s+/);
  return [first, second].filter(Boolean).join(' ');
}


  // ---- Acciones ----
  closeMenu() {
    this.open = false;     // cierra hamburguesa
    this.userOpen = false; // cierra dropdown usuario
  }

  async logout() {
    this.auth.logout?.();
    localStorage.removeItem('auth_name');
    this.closeMenu();
    this.router.navigateByUrl('/'); // o '/admin/login'
  }

  goAccount() {
    this.closeMenu();
    this.router.navigateByUrl('/cuenta');
  }

  // ---- Listeners UI ----
  @HostListener('window:resize')
  onResize() {
    // si pasas a desktop, cierra el menú móvil
    if (window.innerWidth >= 1024 && this.open) this.open = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const el = ev.target as HTMLElement;
    // si el click no fue dentro del dropdown de usuario, ciérralo:
    if (!el.closest('.user-menu')) this.userOpen = false;
  }
}
