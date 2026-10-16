import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { InstitutionService } from '../core/institution.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="login-v3 theme-admin login-universal">
      <aside class="login-v3__brand" aria-label="Sistema institucional">
        <div class="login-v3__orb login-v3__orb--a"></div>
        <div class="login-v3__orb login-v3__orb--b"></div>
        <div class="login-v3__pattern"></div>

        <div class="login-v3__brand-content">
          <div class="login-system-mark" aria-hidden="true">
            <span class="mark-ring"></span>
            <span class="mark-dot"></span>
          </div>

          <div class="login-v3__badge">SISTEMA MULTIINSTITUCIONAL</div>
          <h1>Registro de Asistencia</h1>
          <p>Un solo acceso para CCITP, Divertimundo y Pitágoras School.</p>

          <div class="login-v3__line"></div>

          <div class="login-universal__institutions">
            <div *ngFor="let item of institutionService.institutions">
              <span class="login-universal__logo"><img [src]="item.logo" [alt]="item.name" /></span>
              <span><strong>{{ item.name }}</strong><small>{{ item.type }}</small></span>
            </div>
          </div>
        </div>

        <div class="login-v3__brand-footer">
          <span>Sistema de Gestión Institucional</span>
          <span>2026</span>
        </div>
      </aside>

      <section class="login-v3__access">
        <div class="login-v3__card">
          <header class="login-v3__header">
            <span class="login-v3__eyebrow">ACCESO AL SISTEMA</span>
            <h2>Bienvenido</h2>
            <p>Ingresa tu usuario y contraseña. El sistema abrirá automáticamente la institución donde trabajas.</p>
          </header>

          <form class="login-v3__form" (ngSubmit)="submit()" #loginForm="ngForm">
            <div class="login-v3__group">
              <label for="login">Usuario o correo electrónico</label>
              <div class="login-v3__input" [class.is-filled]="login">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/></svg>
                <input
                  id="login"
                  [(ngModel)]="login"
                  name="login"
                  required
                  autocomplete="username"
                  placeholder="Usuario o correo"
                  [disabled]="loading"
                />
              </div>
            </div>

            <div class="login-v3__group">
              <label for="password">Contraseña</label>
              <div class="login-v3__input" [class.is-filled]="password">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"/></svg>
                <input
                  id="password"
                  [(ngModel)]="password"
                  name="password"
                  [type]="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  placeholder="Contraseña"
                  [disabled]="loading"
                />
                <button
                  type="button"
                  class="login-v3__eye"
                  (click)="showPassword = !showPassword"
                  [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  <svg *ngIf="!showPassword" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>
                  </svg>
                  <svg *ngIf="showPassword" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3 3.7M6.2 6.2C3.4 8.1 2 12 2 12s3.5 6 10 6c1.1 0 2.1-.2 3-.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="login-v3__error" *ngIf="error">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>
              <span>{{ error }}</span>
            </div>

            <button class="login-v3__submit" [disabled]="loading || loginForm.invalid">
              <span *ngIf="!loading">Ingresar al sistema</span>
              <span *ngIf="loading" class="login-v3__loading"><i></i>Verificando...</span>
              <svg *ngIf="!loading" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>

          <div class="login-auto-institution-note">
            <span class="login-auto-institution-note__icon">✓</span>
            <div>
              <strong>Acceso automático por institución</strong>
              <small>El personal entra directamente a su institución. Los administradores acceden al panel general.</small>
            </div>
          </div>

          <div class="login-v3__separator"><span></span><small>ASISTENCIA</small><span></span></div>

          <a routerLink="/asistencia" class="login-v3__attendance">
            <span class="login-v3__attendance-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 2v4M16 2v4M8 11h8M8 15h5"/></svg>
            </span>
            <span>
              <strong>Registrar asistencia</strong>
              <small>Acceso público para la marcación del personal</small>
            </span>
            <svg class="login-v3__attendance-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
          </a>

          <div class="login-v3__support">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3.9 1.7c-1.2 1-1.7 1.3-1.7 2.8M12 17h.01"/></svg>
            <span>¿Problemas para ingresar? Contacta al administrador.</span>
          </div>

          <p class="login-v3__copyright">© 2026 · Sistema de asistencia institucional</p>
        </div>
      </section>
    </main>
  `
})
export class LoginComponent implements OnInit {
  login = '';
  password = '';
  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private auth: AuthService,
    public institutionService: InstitutionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  submit(): void {
    if (this.loading || !this.login.trim() || !this.password) return;

    this.loading = true;
    this.error = '';

    this.auth.login(this.login.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: e => {
        this.error = e.error?.message || e.error?.errors?.login?.[0] || 'No se pudo iniciar sesión. Verifica tus credenciales.';
        this.loading = false;
      }
    });
  }
}
