import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { InstitutionBrand, InstitutionService } from '../core/institution.service';

@Component({
  selector: 'app-institution-selector',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="institution-shell attendance-institution-shell">
      <div class="institution-bg institution-bg-a"></div>
      <div class="institution-bg institution-bg-b"></div>

      <section class="institution-page">
        <header class="program-header">
          <div class="program-mark" aria-hidden="true">
            <span class="mark-ring"></span>
            <span class="mark-dot"></span>
          </div>
          <div>
            <span class="eyebrow">Marcación del personal</span>
            <h1>Registro de asistencia</h1>
            <p>Seleccione la institución donde realizará su marcación.</p>
          </div>
          <a routerLink="/login" class="btn ghost attendance-login-link">Acceso administrativo</a>
        </header>

        <div class="institution-divider"></div>

        <div class="institution-grid">
          <article
            *ngFor="let inst of institutions"
            class="institution-card attendance-institution-card"
            [ngClass]="inst.className"
          >
            <div class="institution-card__glow"></div>
            <div class="institution-logo-wrap">
              <img [src]="inst.logo" [alt]="'Logo de ' + inst.name" class="institution-logo" />
            </div>

            <div class="institution-card__body">
              <span class="institution-type">{{ inst.type }}</span>
              <h2>{{ inst.name }}</h2>
              <p>{{ inst.subtitle }}</p>
            </div>

            <div class="institution-actions">
              <button type="button" class="institution-login" (click)="goAttendance(inst)">
                <span>REGISTRAR ASISTENCIA</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        </div>

        <footer class="institution-footer">
          <span>La institución solo se selecciona para la marcación pública</span>
          <span class="footer-dot">•</span>
          <a routerLink="/login">Volver al login</a>
        </footer>
      </section>
    </main>
  `
})
export class InstitutionSelectorComponent {
  get institutions() { return this.institution.institutions; }

  constructor(
    private institution: InstitutionService,
    private router: Router
  ) {}

  goAttendance(inst: InstitutionBrand): void {
    this.institution.select(inst.slug);
    this.router.navigate(['/registrar-asistencia', inst.slug]);
  }
}
