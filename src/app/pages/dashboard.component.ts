import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { InstitutionBrand, InstitutionService } from '../core/institution.service';

@Component({selector:'app-dashboard',standalone:true,imports:[CommonModule,RouterLink],template:`
<section *ngIf="auth.isAdmin() && !institution.selected(); else institutionDashboard" class="admin-dashboard-general final-dashboard">
  <div class="dashboard-hero admin-global-hero final-hero"><div><span class="eyebrow">Administración general</span><h1>Panel multiinstitucional</h1><p>Supervisa asistencia y operación de las instituciones desde una sola sesión.</p></div><div class="admin-global-badge">{{institution.institutions.length}} instituciones</div></div>
  <div class="page-head admin-dashboard-head"><div><h2>Instituciones</h2><p>Selecciona una institución para trabajar en su contexto.</p></div><a routerLink="/instituciones-panel" class="btn secondary">Gestionar instituciones</a></div>
  <div class="admin-dashboard-institutions">
    <article *ngFor="let item of institution.institutions" class="admin-dashboard-institution" [ngClass]="item.className">
      <div class="admin-dashboard-institution__logo"><img [src]="item.logo" [alt]="item.name" /></div>
      <div class="admin-dashboard-institution__info"><span>{{item.type}}</span><h2>{{item.name}}</h2><p>{{item.subtitle}}</p></div>
      <div class="admin-dashboard-mini-stats" *ngIf="globalStats[item.slug] as s"><span><b>{{s.presentes}}</b> presentes</span><span><b>{{s.tardanzas}}</b> tardanzas</span><span><b>{{s.faltas}}</b> faltas</span><span><b>{{s.salidas_anticipadas||0}}</b> salidas ant.</span></div>
      <button class="btn primary" (click)="abrirInstitucion(item)">Administrar</button>
    </article>
  </div>
</section>
<ng-template #institutionDashboard><section class="final-dashboard">
  <div class="dashboard-hero final-hero"><div><span class="eyebrow">Resumen del día</span><h1>{{institution.selected()?.name}}</h1><p>Control operativo · {{today|date:'dd/MM/yyyy'}}</p></div><img [src]="institution.selected()?.logo" [alt]="institution.selected()?.name" /></div>
  <div class="dashboard-skeleton" *ngIf="loading">Actualizando información de {{institution.selected()?.shortName}}…</div>
  <div class="stats" *ngIf="!loading && stats"><article><span>Marcaciones</span><strong>{{stats.marcaciones}}</strong><small>Entradas registradas</small></article><article><span>Presentes</span><strong>{{stats.presentes}}</strong><small>A tiempo</small></article><article><span>Tardanzas</span><strong>{{stats.tardanzas}}</strong><small>Incidencias</small></article><article><span>Faltas</span><strong>{{stats.faltas}}</strong><small>Sin entrada</small></article><article><span>Salidas anticipadas</span><strong>{{stats.salidas_anticipadas}}</strong><small>Antes del horario</small></article><article><span>Sin salida</span><strong>{{stats.sin_salida}}</strong><small>Marcación pendiente</small></article></div>
  <div class="stats compact-stats finance-stats" *ngIf="auth.isAdmin() && !loading && operational"><article><span>Personal activo</span><strong>{{operational.personal_activo||0}}</strong><small>Institución</small></article><article><span>Morosos</span><strong>{{operational.cuentas_morosas||0}}</strong><small>Cuentas vencidas</small></article><article><span>Por cobrar</span><strong>S/ {{operational.saldo_cobranza||0|number:'1.2-2'}}</strong><small>Saldo alumnos</small></article><article><span>Planilla neta</span><strong>S/ {{operational.neto_planillas||0|number:'1.2-2'}}</strong><small>Mes actual</small></article><article><span>Planilla pagada</span><strong>S/ {{operational.pagado_planillas||0|number:'1.2-2'}}</strong><small>Mes actual</small></article><article><span>Saldo planilla</span><strong>S/ {{operational.saldo_planillas||0|number:'1.2-2'}}</strong><small>Pendiente</small></article></div>
  <div class="dashboard-grid"><div class="card"><span class="eyebrow">Accesos rápidos</span><h2>Operación de {{institution.selected()?.shortName}}</h2><div class="dashboard-quick-actions"><a routerLink="/personal" class="btn secondary" *ngIf="auth.isAdmin()">Personal</a><a routerLink="/horarios" class="btn secondary" *ngIf="auth.isAdmin()">Horarios</a><a routerLink="/asistencias" class="btn secondary">Asistencias</a><a routerLink="/justificaciones" class="btn secondary">Justificaciones</a><a routerLink="/reportes" class="btn secondary" *ngIf="auth.isAdmin()">Reportes</a></div></div><div class="card theme-note"><span class="eyebrow">Contexto activo</span><h2>{{institution.selected()?.subtitle}}</h2><p>Al cambiar la institución, los módulos se limpian y vuelven a consultar únicamente el nuevo contexto.</p><button class="btn ghost" *ngIf="auth.isAdmin()" (click)="volverGeneral()">Panel general</button></div></div>
</section></ng-template>`})
export class DashboardComponent{
  stats:any=this.zero();operational:any=null;globalStats:Record<string,any>={};today=new Date();loading=false;private sequence=0;private initialized=false;private lastSlug='__init__';
  constructor(private api:ApiService,public institution:InstitutionService,public auth:AuthService,private router:Router){
    effect(()=>{const slug=this.institution.selected()?.slug||'';if(!this.initialized)return;if(slug===this.lastSlug)return;this.lastSlug=slug;this.refresh();});
    queueMicrotask(()=>{this.initialized=true;this.lastSlug=this.institution.selected()?.slug||'';this.refresh();});
  }
  refresh(){this.sequence++;const token=this.sequence;if(this.auth.isAdmin()&&!this.institution.selected()){this.loading=false;this.stats=this.zero();this.operational=null;this.cargarResumenGeneral(token);}else this.cargarStatsInstitucion(token)}
  cargarStatsInstitucion(token=this.sequence){const slug=this.institution.selected()?.slug;if(!slug)return;this.loading=true;this.stats=this.zero();if(!this.auth.isAdmin()){this.obtenerStats(slug,token);return;}this.api.post('/asistencias/procesar',{institucion:slug}).subscribe({next:()=>this.obtenerStats(slug,token),error:()=>this.obtenerStats(slug,token)})}
  private obtenerStats(slug:string,token:number){
    if(this.auth.isAdmin()){
      forkJoin({attendance:this.api.get('/asistencias/stats',{institucion:slug}),operational:this.api.get('/reportes/resumen',{institucion:slug,fecha:new Date().toISOString().slice(0,10)})}).subscribe({
        next:r=>{if(token!==this.sequence||slug!==this.institution.selected()?.slug)return;this.stats=r.attendance;this.operational=r.operational;this.loading=false},
        error:()=>{if(token!==this.sequence)return;this.stats=this.zero();this.operational=null;this.loading=false}
      });
      return;
    }
    this.operational=null;
    this.api.get('/asistencias/stats',{institucion:slug}).subscribe({next:r=>{if(token!==this.sequence||slug!==this.institution.selected()?.slug)return;this.stats=r;this.loading=false},error:()=>{if(token!==this.sequence)return;this.stats=this.zero();this.loading=false}})
  }
  cargarResumenGeneral(token=this.sequence){const calls:Record<string,any>={};for(const i of this.institution.institutions)calls[i.slug]=this.api.get('/asistencias/stats',{institucion:i.slug});forkJoin(calls).subscribe({next:r=>{if(token===this.sequence&&!this.institution.selected())this.globalStats=r},error:()=>{if(token===this.sequence)this.globalStats={}}})}
  abrirInstitucion(item:InstitutionBrand){this.institution.select(item.slug)}
  volverGeneral(){this.institution.clear();this.router.navigate(['/dashboard'])}
  private zero(){return{marcaciones:0,presentes:0,tardanzas:0,faltas:0,salidas_anticipadas:0,sin_salida:0}}
}
