import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { InstitutionService } from '../core/institution.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

@Component({selector:'app-reportes',standalone:true,imports:[CommonModule,FormsModule,MatButtonModule,MatCardModule,MatFormFieldModule,MatInputModule,MatSelectModule,MatTableModule],template:`
<section class="material-page phase-final-page report-page">
  <div class="page-head material-page-head"><div><span class="eyebrow">Gestión</span><h1>Reportes</h1><p>Asistencia, planillas y cobranza de la institución activa.</p></div><button mat-flat-button color="primary" (click)="windowPrint()">Imprimir / Guardar PDF</button></div>
  <mat-card class="filter-card no-print"><div class="final-filter-grid report-filter"><mat-form-field appearance="outline"><mat-label>Reporte</mat-label><mat-select [(ngModel)]="tipo" (selectionChange)="loadData()"><mat-option value="asistencias">Asistencias</mat-option><mat-option value="planillas">Planillas</mat-option><mat-option value="cobranza">Cobranza</mat-option></mat-select></mat-form-field><mat-form-field appearance="outline"><mat-label>Desde</mat-label><input matInput type="date" [(ngModel)]="desde"></mat-form-field><mat-form-field appearance="outline"><mat-label>Hasta</mat-label><input matInput type="date" [(ngModel)]="hasta"></mat-form-field><button mat-stroked-button (click)="loadData()">Consultar</button><button mat-stroked-button (click)="exportCsv()">Exportar Excel (CSV)</button></div></mat-card>
  <div class="stats compact-stats report-kpis" *ngIf="summary"><article><span>Personal activo</span><strong>{{summary.personal_activo}}</strong></article><article><span>Presentes</span><strong>{{summary.presentes}}</strong></article><article><span>Tardanzas</span><strong>{{summary.tardanzas}}</strong></article><article><span>Faltas</span><strong>{{summary.faltas}}</strong></article><article><span>Permisos</span><strong>{{summary.permisos}}</strong></article><article><span>Salidas anticipadas</span><strong>{{summary.salidas_anticipadas}}</strong></article><article><span>Morosos</span><strong>{{summary.cuentas_morosas}}</strong></article><article><span>Por cobrar</span><strong>S/ {{summary.saldo_cobranza|number:'1.2-2'}}</strong></article><article><span>Planilla neta</span><strong>S/ {{summary.neto_planillas|number:'1.2-2'}}</strong></article><article><span>Saldo planilla</span><strong>S/ {{summary.saldo_planillas|number:'1.2-2'}}</strong></article></div>
  <mat-card class="crud-table-card print-card"><div class="report-print-head"><div><b>{{institution.selected()?.name}}</b><span>Reporte de {{tipo}} · {{desde}} a {{hasta}}</span></div></div><div class="material-table-wrap"><table class="plain-report-table" *ngIf="rows.length"><thead><tr><th *ngFor="let c of columns">{{c}}</th></tr></thead><tbody><tr *ngFor="let r of rows"><td *ngFor="let c of columns">{{r[c] ?? '-'}}</td></tr></tbody></table><div class="empty material-empty" *ngIf="!rows.length">No hay información para los filtros seleccionados.</div></div></mat-card>
</section>`})
export class ReportesComponent{
  tipo='asistencias'; desde=this.firstDay(); hasta=this.today(); rows:any[]=[]; columns:string[]=[];summary:any=null;private ready=false;private lastSlug='';private summarySeq=0;private dataSeq=0;
  constructor(private api:ApiService,public institution:InstitutionService){effect(()=>{const s=this.institution.selected()?.slug||'';if(this.ready&&s!==this.lastSlug){this.lastSlug=s;this.rows=[];this.loadAll();}});queueMicrotask(()=>{this.ready=true;this.lastSlug=this.institution.selected()?.slug||'';this.loadAll();})}
  loadAll(){this.loadSummary();this.loadData()}
  loadSummary(){const s=this.institution.selected()?.slug;if(!s){this.summary=null;return;}const token=++this.summarySeq;this.api.get('/reportes/resumen',{institucion:s,fecha:this.hasta}).subscribe({next:r=>{if(token===this.summarySeq&&s===this.institution.selected()?.slug)this.summary=r},error:()=>{if(token===this.summarySeq)this.summary=null}})}
  loadData(){const s=this.institution.selected()?.slug;if(!s){this.rows=[];return;}const token=++this.dataSeq;const p:any={institucion:s,desde:this.desde,hasta:this.hasta};if(this.tipo==='planillas'){const d=new Date(this.hasta+'T00:00:00');p.anio=d.getFullYear();p.mes=d.getMonth()+1;}this.api.get(`/reportes/${this.tipo}`,p).subscribe({next:r=>{if(token!==this.dataSeq||s!==this.institution.selected()?.slug)return;this.rows=Array.isArray(r)?r:[];this.columns=this.rows.length?Object.keys(this.rows[0]):[]},error:()=>{if(token!==this.dataSeq)return;this.rows=[];this.columns=[]}})}
  exportCsv(){const s=this.institution.selected()?.slug;if(!s)return;const p:any={institucion:s,desde:this.desde,hasta:this.hasta};if(this.tipo==='planillas'){const d=new Date(this.hasta+'T00:00:00');p.anio=d.getFullYear();p.mes=d.getMonth()+1;}this.api.download(`/reportes/${this.tipo}/csv`,p).subscribe(blob=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${this.tipo}-${this.desde}-${this.hasta}.csv`;a.click();URL.revokeObjectURL(url);})}
  windowPrint(){window.print()}
  today(){return new Date().toISOString().slice(0,10)} firstDay(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`}
}
