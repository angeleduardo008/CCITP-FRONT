import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { InstitutionService } from '../core/institution.service';
import { AuthService } from '../core/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector:'app-planillas',standalone:true,
  imports:[CommonModule,FormsModule,MatButtonModule,MatCardModule,MatFormFieldModule,MatInputModule,MatSelectModule,MatTableModule,MatSnackBarModule,MatProgressSpinnerModule],
  template:`
  <section class="material-page phase-final-page">
    <div class="page-head material-page-head">
      <div><span class="eyebrow">Remuneraciones</span><h1>Planillas</h1><p>Calcula el periodo mensual usando horarios, marcaciones e incidencias justificadas.</p></div>
      <button *ngIf="auth.isAdmin()" mat-flat-button color="primary" (click)="generar()" [disabled]="generando || !institution.selected()">{{generando?'Calculando...':'Calcular periodo'}}</button>
    </div>

    <mat-card class="filter-card">
      <div class="final-filter-grid">
        <mat-form-field appearance="outline"><mat-label>Año</mat-label><input matInput type="number" [(ngModel)]="anio"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Mes</mat-label><mat-select [(ngModel)]="mes" (selectionChange)="load()"><mat-option *ngFor="let m of meses;let i=index" [value]="i+1">{{m}}</mat-option></mat-select></mat-form-field>
        <button mat-stroked-button (click)="load()">Actualizar</button>
      </div>
      <div class="phase-note">Para personal mensual se calculan descuentos automáticos por falta, tardanza y salida anticipada no justificada. Para pago por hora, el bruto usa horas reales trabajadas y la tarifa de Curso/Actividad cuando está configurada.</div>
    </mat-card>

    <div class="stats compact-stats">
      <article><span>Trabajadores</span><strong>{{rows.length}}</strong><small>En la planilla visible</small></article>
      <article><span>Bruto</span><strong>S/ {{sum('monto_bruto')|number:'1.2-2'}}</strong><small>Periodo</small></article>
      <article><span>Descuentos</span><strong>S/ {{sum('total_descuentos')|number:'1.2-2'}}</strong><small>Aplicados</small></article>
      <article><span>Neto</span><strong>S/ {{sum('monto_neto')|number:'1.2-2'}}</strong><small>A pagar</small></article>
      <article><span>Pagado</span><strong>S/ {{sum('monto_pagado')|number:'1.2-2'}}</strong><small>Cancelado</small></article>
      <article><span>Saldo</span><strong>S/ {{sum('saldo_pago')|number:'1.2-2'}}</strong><small>Pendiente</small></article>
    </div>

    <mat-card class="crud-table-card">
      <div class="material-loading" *ngIf="loading"><mat-spinner diameter="36"></mat-spinner></div>
      <div class="material-table-wrap" *ngIf="!loading">
        <table mat-table [dataSource]="rows" class="material-table">
          <ng-container matColumnDef="personal"><th mat-header-cell *matHeaderCellDef>Personal</th><td mat-cell *matCellDef="let r"><b>{{r.personal?.apellidos}}, {{r.personal?.nombres}}</b><small class="cell-sub">{{r.remuneracion?.tipo_pago?.nombre}}</small></td></ng-container>
          <ng-container matColumnDef="horas"><th mat-header-cell *matHeaderCellDef>Horas</th><td mat-cell *matCellDef="let r">{{r.horas_trabajadas}}</td></ng-container>
          <ng-container matColumnDef="bruto"><th mat-header-cell *matHeaderCellDef>Bruto</th><td mat-cell *matCellDef="let r">S/ {{r.monto_bruto}}</td></ng-container>
          <ng-container matColumnDef="descuentos"><th mat-header-cell *matHeaderCellDef>Descuentos</th><td mat-cell *matCellDef="let r">S/ {{r.total_descuentos}}</td></ng-container>
          <ng-container matColumnDef="neto"><th mat-header-cell *matHeaderCellDef>Neto</th><td mat-cell *matCellDef="let r"><b>S/ {{r.monto_neto}}</b></td></ng-container>
          <ng-container matColumnDef="pagado"><th mat-header-cell *matHeaderCellDef>Pagado</th><td mat-cell *matCellDef="let r">S/ {{r.monto_pagado||0}}</td></ng-container>
          <ng-container matColumnDef="saldo"><th mat-header-cell *matHeaderCellDef>Saldo</th><td mat-cell *matCellDef="let r"><b>S/ {{r.saldo_pago ?? r.monto_neto}}</b></td></ng-container>
          <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let r"><span class="status-pill" [class.ok]="r.estado==='APROBADA'||r.estado==='CERRADA'">{{r.estado}}</span></td></ng-container>
          <ng-container matColumnDef="acciones"><th mat-header-cell *matHeaderCellDef>Acciones</th><td mat-cell *matCellDef="let r" class="action-cell"><ng-container *ngIf="auth.isAdmin(); else consultaPlanilla"><button mat-stroked-button (click)="estado(r,'APROBADA')" *ngIf="r.estado==='CALCULADA'">Aprobar</button><button mat-stroked-button (click)="descuento(r)" *ngIf="r.estado!=='CERRADA' && r.estado!=='ANULADA'">+ Descuento / adelanto</button><button mat-stroked-button color="primary" (click)="pago(r)" *ngIf="r.estado==='APROBADA' && Number(r.saldo_pago ?? r.monto_neto)>0">Registrar pago</button><button mat-stroked-button (click)="estado(r,'CERRADA')" *ngIf="r.estado==='APROBADA' && Number(r.saldo_pago ?? r.monto_neto)<=0">Cerrar</button></ng-container><ng-template #consultaPlanilla><span class="status-pill">Solo lectura</span></ng-template></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr><tr mat-row *matRowDef="let row;columns:cols"></tr>
        </table>
        <div class="empty material-empty" *ngIf="!rows.length">No hay planillas calculadas para este periodo.</div>
      </div>
    </mat-card>
  </section>`
})
export class PlanillasComponent {
  rows:any[]=[]; loading=false; generando=false; anio=new Date().getFullYear(); mes=new Date().getMonth()+1; Number=Number;
  meses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  cols=['personal','horas','bruto','descuentos','neto','pagado','saldo','estado','acciones']; private lastSlug=''; private ready=false; private loadSeq=0;
  constructor(private api:ApiService,public institution:InstitutionService,public auth:AuthService,private snack:MatSnackBar){
    effect(()=>{const slug=this.institution.selected()?.slug||''; if(this.ready && slug!==this.lastSlug){this.lastSlug=slug;this.rows=[];this.load();}});
    queueMicrotask(()=>{this.ready=true;this.lastSlug=this.institution.selected()?.slug||'';this.load();});
  }
  load(){const slug=this.institution.selected()?.slug;if(!slug){this.rows=[];return;}const token=++this.loadSeq;this.loading=true;this.api.get('/planillas',{anio:this.anio,mes:this.mes,institucion:slug,per_page:200}).subscribe({next:r=>{if(token!==this.loadSeq||slug!==this.institution.selected()?.slug)return;this.rows=r.data||[];this.loading=false},error:e=>{if(token!==this.loadSeq)return;this.rows=[];this.loading=false;this.msg(e)}})}
  generar(){const slug=this.institution.selected()?.slug;if(!slug)return;this.generando=true;this.api.post('/planillas/generar',{anio:this.anio,mes:this.mes,institucion:slug}).subscribe({next:(r:any)=>{this.generando=false;this.snack.open(`Planillas calculadas: ${r.creadas+r.actualizadas}`,'Cerrar',{duration:3000});this.load()},error:e=>{this.generando=false;this.msg(e)}})}
  estado(r:any,estado:string){this.api.patch(`/planillas/${r.planilla_id}/estado`,{estado}).subscribe({next:()=>{this.snack.open('Estado actualizado','Cerrar',{duration:2200});this.load()},error:e=>this.msg(e)})}
  descuento(r:any){const monto=Number(prompt('Monto del descuento adicional:','0')||0);if(!monto)return;const motivo=prompt('Motivo del descuento:','Adelanto / otro')||'';if(!motivo)return;this.api.post(`/planillas/${r.planilla_id}/descuentos`,{monto_descuento:monto,motivo}).subscribe({next:()=>{this.snack.open('Descuento agregado','Cerrar',{duration:2200});this.load()},error:e=>this.msg(e)})}
  pago(r:any){const saldo=Number(r.saldo_pago ?? r.monto_neto);const monto=Number(prompt(`Monto a cancelar (saldo S/ ${saldo.toFixed(2)}):`,saldo.toFixed(2))||0);if(!monto)return;const metodo=prompt('Método de pago (efectivo, transferencia, etc.):','EFECTIVO')||'';const referencia=prompt('Referencia / operación (opcional):','')||'';this.api.post(`/planillas/${r.planilla_id}/pagos`,{monto,metodo,referencia}).subscribe({next:()=>{this.snack.open('Pago de planilla registrado','Cerrar',{duration:2500});this.load()},error:e=>this.msg(e)})}
  sum(k:string){return this.rows.reduce((s,r)=>s+Number(r[k]||0),0)}
  msg(e:any){this.snack.open(e?.error?.message||'No se pudo completar la operación','Cerrar',{duration:3500})}
}
