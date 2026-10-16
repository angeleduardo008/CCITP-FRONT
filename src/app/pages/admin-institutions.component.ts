import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { InstitutionBrand, InstitutionService } from '../core/institution.service';

@Component({
  selector: 'app-admin-institutions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="admin-institutions-page">
      <div class="page-head admin-institutions-head">
        <div>
          <span class="eyebrow">Administración general</span>
          <h1>Instituciones</h1>
          <p>Selecciona una institución para administrar su personal, horarios, asistencia, remuneraciones y demás módulos.</p>
        </div>
        <a routerLink="/dashboard" class="btn ghost">Volver al dashboard</a>
      </div>

      <div class="admin-institution-grid">
        <article class="admin-institution-card" *ngFor="let item of institution.institutions" [ngClass]="item.className">
          <div class="admin-institution-card__top">
            <div class="admin-institution-card__logo"><img [src]="item.logo" [alt]="item.name" /></div>
            <span>{{ item.type }}</span>
          </div>
          <div class="admin-institution-card__body">
            <h2>{{ item.name }}</h2>
            <p>{{ item.subtitle }}</p>
          </div>
          <div class="admin-institution-card__actions">
            <button class="btn primary" (click)="administrar(item)">Administrar institución</button>
            <a [routerLink]="['/registrar-asistencia', item.slug]" class="btn secondary">Registro de asistencia</a>
          </div>
        </article>
      </div>
    </section>
  `
})
export class AdminInstitutionsComponent {
  constructor(public institution: InstitutionService, private router: Router) {}

  administrar(item: InstitutionBrand): void {
    this.institution.select(item.slug);
    this.router.navigate(['/dashboard']);
  }
}
