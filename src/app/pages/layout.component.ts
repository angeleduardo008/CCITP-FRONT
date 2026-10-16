import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { InstitutionService } from '../core/institution.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell final-admin-shell" [ngClass]="institution.selected()?.className || 'theme-admin'">
      <aside class="sidebar final-sidebar">
        <div class="brand">
          <div class="brand-logo-wrap admin-brand-mark" *ngIf="auth.isAdmin() && !institution.selected();">A</div>
          <div class="brand-logo-wrap" *ngIf="institution.selected();"><img [src]="institution.selected()?.logo" [alt]="institution.selected()?.name || 'Institución'" /></div>
          <div class="brand-copy"><b>{{ institution.selected()?.shortName || (auth.isAdmin() ? 'ADMIN GENERAL' : 'ASISTENCIA') }}</b><small>{{ institution.selected()?.type || 'Gestión multiinstitucional' }}</small></div>
        </div>

        <div class="sidebar-section-title">Principal</div>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active"><span>▦</span> Dashboard</a>
          <a routerLink="/instituciones-panel" routerLinkActive="active" *ngIf="auth.isAdmin()"><span>◆</span> Instituciones</a>
        </nav>

        <ng-container *ngIf="institution.selected()">
          <div class="sidebar-section-title">Personal y asistencia</div>
          <nav>
            <a routerLink="/personal" routerLinkActive="active" *ngIf="auth.isAdmin()"><span>●</span> Personal</a>
            <a routerLink="/cargos" routerLinkActive="active" *ngIf="auth.isAdmin()"><span>◈</span> Cargos</a>
            <a routerLink="/horarios" routerLinkActive="active" *ngIf="auth.isAdmin()"><span>◷</span> Horarios</a>
            <a routerLink="/asistencias" routerLinkActive="active"><span>✓</span> Asistencias</a>
            <a routerLink="/justificaciones" routerLinkActive="active"><span>◉</span> Justificaciones</a>
            <a routerLink="/planillas" routerLinkActive="active" *ngIf="!auth.isAdmin()"><span>▤</span> Mi planilla</a>
          </nav>

          <div class="sidebar-section-title" *ngIf="auth.isAdmin()">Gestión</div>
          <nav *ngIf="auth.isAdmin()">
            <a routerLink="/remuneraciones" routerLinkActive="active"><span>S/</span> Remuneraciones</a>
            <a routerLink="/planillas" routerLinkActive="active"><span>▤</span> Planillas</a>
            <a routerLink="/alumnos" routerLinkActive="active"><span>◌</span> Alumnos</a>
            <a routerLink="/morosidad" routerLinkActive="active"><span>!</span> Cobranza</a>
            <a routerLink="/reportes" routerLinkActive="active"><span>▥</span> Reportes</a>
          </nav>
        </ng-container>

        <div class="sidebar-section-title" *ngIf="auth.isAdmin()">Sistema</div>
        <nav *ngIf="auth.isAdmin()">
          <a routerLink="/instituciones" routerLinkActive="active" *ngIf="institution.selected()"><span>◇</span> Datos institución</a>
          <a routerLink="/usuarios" routerLinkActive="active"><span>◎</span> Usuarios</a>
          <a routerLink="/auditoria" routerLinkActive="active"><span>⌁</span> Auditoría</a>
        </nav>

        <div class="sidebar-bottom">
          <a *ngIf="institution.selected()" [routerLink]="['/registrar-asistencia', institution.selected()?.slug]" class="btn secondary">Abrir marcación pública</a>
          <button *ngIf="auth.isAdmin() && institution.selected()" class="switch-institution switch-institution-btn" (click)="panelGeneral()">← Panel general</button>
        </div>
      </aside>

      <main class="content final-content">
        <header class="final-topbar">
          <div class="header-context">
            <span class="header-institution">{{ institution.selected()?.name || 'Panel administrativo general' }}</span>
            <span class="header-separator" *ngIf="institution.selected()">/</span>
            <span *ngIf="institution.selected()">{{ institution.selected()?.type }}</span>
          </div>

          <div class="admin-institution-switch" *ngIf="auth.isAdmin()">
            <label>Contexto</label>
            <select [value]="institution.selected()?.slug || ''" (change)="cambiarInstitucion($any($event.target).value)">
              <option value="">Panel general</option>
              <option *ngFor="let item of institution.institutions" [value]="item.slug">{{ item.name }}</option>
            </select>
          </div>

          <div class="header-user">
            <div class="user-avatar">{{ (auth.user()?.nombre_usuario || 'U').charAt(0).toUpperCase() }}</div>
            <div><b>{{ auth.user()?.nombre_usuario }}</b><span class="badge">{{ auth.user()?.rol }}</span></div>
            <button class="btn ghost" (click)="auth.logout()">Salir</button>
          </div>
        </header>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class LayoutComponent {
  constructor(public auth: AuthService, public institution: InstitutionService, private router: Router) {}

  cambiarInstitucion(slug: string): void {
    if (!slug) { this.institution.clear(); this.router.navigate(['/dashboard']); return; }
    this.institution.select(slug);
    const url=this.router.url.split('?')[0];
    if(url==='/instituciones-panel' || url==='/instituciones') this.router.navigate(['/dashboard']);
    // En el resto de módulos no navegamos: cada vista reacciona al cambio de institución.
  }

  panelGeneral(): void { this.institution.clear(); this.router.navigate(['/dashboard']); }
}
