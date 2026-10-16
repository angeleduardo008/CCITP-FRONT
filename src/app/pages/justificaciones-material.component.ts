import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { InstitutionService } from '../core/institution.service';
import { environment } from '../../environments/environment';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({selector:'app-justificaciones-material',standalone:true,imports:[CommonModule,FormsModule,MatButtonModule,MatCardModule,MatFormFieldModule,MatInputModule,MatSelectModule,MatTableModule,MatSnackBarModule],template:`
<section class="material-page phase-final-page">
  <div class="page-head material-page-head"><div><span class="eyebrow">Incidencias</span><h1>Justificaciones y permisos</h1><p>Solicita, revisa y conserva evidencia de faltas, tardanzas y salidas anticipadas.</p></div><button *ngIf="auth.user()?.rol!=='CONSULTA'" mat-flat-button color="primary" (click)="toggleForm()">{{showForm?'Cerrar':'+ Nueva justificación'}}</button></div>

  <mat-card *ngIf="showForm" class="crud-form-card"><mat-card-content><div class="material-form-grid">
    <mat-form-field appearance="outline" class="span-2"><mat-label>Incidencia</mat-label><mat-select [(ngModel)]="form.asistencia_personal_id"><mat-option *ngFor="let a of candidatas" [value]="a.asistencia_personal_id">{{a.fecha|date:'dd/MM/yyyy'}} · {{a.personal?.apellidos}}, {{a.personal?.nombres}} · {{a.incidencias_resumen}}</mat-option></mat-select></mat-form-field>
    <mat-form-field appearance="outline"><mat-label>Tipo</mat-label><mat-select [(ngModel)]="form.tipo_justificacion"><mat-option value="SALUD">Salud</mat-option><mat-option value="PERMISO">Permiso</mat-option><mat-option value="COMISIÓN">Comisión</mat-option><mat-option value="EMERGENCIA">Emergencia</mat-option><mat-option value="OTRO">Otro</mat-option></mat-select></mat-form-field>
    <mat-form-field appearance="outline"><mat-label>Motivo</mat-label><input matInput [(ngModel)]="form.motivo"></mat-form-field>
    <mat-form-field appearance="outline" class="span-2"><mat-label>Descripción</mat-label><textarea matInput rows="3" [(ngModel)]="form.descripcion"></textarea></mat-form-field>
    <div class="file-field span-2"><label>Evidencia (PDF/JPG/PNG, opcional)</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="fileChanged($event)"><small>{{archivo?.name||'Sin archivo seleccionado'}}</small></div>
    <div class="crud-actions span-2"><button mat-button (click)="showForm=false">Cancelar</button><button mat-flat-button color="primary" (click)="save()" [disabled]="saving||!form.asistencia_personal_id||!form.motivo">{{saving?'Enviando...':'Enviar justificación'}}</button></div>
  </div></mat-card-content></mat-card>

  <mat-card class="crud-table-card"><div class="crud-toolbar"><strong>Solicitudes de {{institution.selected()?.shortName}}</strong><div class="toolbar-actions"><mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Estado</mat-label><mat-select [(ngModel)]="estado" (selectionChange)="load()"><mat-option value="">Todos</mat-option><mat-option value="PENDIENTE">Pendientes</mat-option><mat-option value="APROBADA">Aprobadas</mat-option><mat-option value="RECHAZADA">Rechazadas</mat-option></mat-select></mat-form-field><button mat-stroked-button (click)="load()">Actualizar</button></div></div><div class="material-table-wrap"><table mat-table [dataSource]="rows" class="material-table">
    <ng-container matColumnDef="fecha"><th mat-header-cell *matHeaderCellDef>Solicitud</th><td mat-cell *matCellDef="let r">{{r.fecha_solicitud|date:'dd/MM/yyyy HH:mm'}}</td></ng-container>
    <ng-container matColumnDef="personal"><th mat-header-cell *matHeaderCellDef>Personal</th><td mat-cell *matCellDef="let r">{{r.asistencia?.personal?.apellidos}}, {{r.asistencia?.personal?.nombres}}</td></ng-container>
    <ng-container matColumnDef="incidencia"><th mat-header-cell *matHeaderCellDef>Incidencia</th><td mat-cell *matCellDef="let r">{{r.asistencia?.incidencias_resumen}}</td></ng-container>
    <ng-container matColumnDef="motivo"><th mat-header-cell *matHeaderCellDef>Motivo</th><td mat-cell *matCellDef="let r"><b>{{r.tipo_justificacion}}</b><small class="cell-sub">{{r.motivo}}</small></td></ng-container>
    <ng-container matColumnDef="evidencia"><th mat-header-cell *matHeaderCellDef>Evidencia</th><td mat-cell *matCellDef="let r"><a *ngIf="r.archivo_evidencia" class="table-link" [href]="storage+'/'+r.archivo_evidencia" target="_blank">Ver archivo</a><span *ngIf="!r.archivo_evidencia">—</span></td></ng-container>
    <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let r"><span class="status-pill" [class.ok]="r.estado==='APROBADA'" [class.bad]="r.estado==='RECHAZADA'">{{r.estado}}</span></td></ng-container>
    <ng-container matColumnDef="acciones"><th mat-header-cell *matHeaderCellDef>Acciones</th><td mat-cell *matCellDef="let r" class="action-cell"><ng-container *ngIf="auth.isAdmin()&&r.estado==='PENDIENTE'"><button mat-stroked-button color="primary" (click)="review(r,'APROBADA')">Aprobar</button><button mat-stroked-button color="warn" (click)="review(r,'RECHAZADA')">Rechazar</button></ng-container><span *ngIf="!auth.isAdmin()||r.estado!=='PENDIENTE'">{{r.observacion_revision||'—'}}</span></td></ng-container>
    <tr mat-header-row *matHeaderRowDef="cols"></tr><tr mat-row *matRowDef="let row;columns:cols"></tr>
  </table><div class="empty material-empty" *ngIf="!rows.length">No hay justificaciones registradas.</div></div></mat-card>
</section>`})
export class JustificacionesMaterialComponent{
  rows:any[]=[];candidatas:any[]=[];showForm=false;saving=false;estado='';archivo:File|null=null;storage=environment.storageUrl;cols=['fecha','personal','incidencia','motivo','evidencia','estado','acciones'];
  form:any={asistencia_personal_id:null,tipo_justificacion:'SALUD',motivo:'',descripcion:''};private initialized=false;private lastSlug='';private loadSeq=0;private candidateSeq=0;
  constructor(private api:ApiService,private snack:MatSnackBar,public institution:InstitutionService,public auth:AuthService){effect(()=>{const slug=this.institution.selected()?.slug||'';if(this.initialized&&slug!==this.lastSlug){this.lastSlug=slug;this.rows=[];this.candidatas=[];this.showForm=false;this.load();}});queueMicrotask(()=>{this.initialized=true;this.lastSlug=this.institution.selected()?.slug||'';this.load();})}
  load(){const token=++this.loadSeq;const slug=this.institution.selected()?.slug||'';const p:any={per_page:100,institucion:slug};if(this.estado)p.estado=this.estado;this.api.get('/justificaciones',p).subscribe({next:r=>{if(token===this.loadSeq&&slug===(this.institution.selected()?.slug||''))this.rows=r.data||[]},error:()=>{if(token===this.loadSeq)this.rows=[]}})}
  toggleForm(){this.showForm=!this.showForm;if(this.showForm)this.loadCandidatas()}
  loadCandidatas(){const token=++this.candidateSeq;const slug=this.institution.selected()?.slug||'';this.api.get('/justificaciones/candidatas',{institucion:slug}).subscribe({next:r=>{if(token===this.candidateSeq&&slug===(this.institution.selected()?.slug||''))this.candidatas=Array.isArray(r)?r:[]},error:()=>{if(token===this.candidateSeq)this.candidatas=[]}})}
  fileChanged(e:any){this.archivo=e?.target?.files?.[0]||null}
  save(){if(!this.form.asistencia_personal_id||!this.form.motivo)return;const fd=new FormData();Object.entries(this.form).forEach(([k,v])=>fd.append(k,String(v??'')));if(this.archivo)fd.append('archivo',this.archivo);this.saving=true;this.api.post('/justificaciones',fd).subscribe({next:()=>{this.saving=false;this.snack.open('Justificación enviada','Cerrar',{duration:2500});this.showForm=false;this.form={asistencia_personal_id:null,tipo_justificacion:'SALUD',motivo:'',descripcion:''};this.archivo=null;this.load()},error:e=>{this.saving=false;this.err(e)}})}
  review(r:any,estado:string){const obs=prompt(`Observación para ${estado.toLowerCase()} (opcional):`)||'';this.api.patch(`/justificaciones/${r.justificacion_id}/revisar`,{estado,observacion_revision:obs}).subscribe({next:()=>{this.snack.open('Justificación actualizada','Cerrar',{duration:2500});this.load()},error:e=>this.err(e)})}
  err(e:any){const errors=e?.error?.errors;const m=errors?Object.values(errors).flat().join(' · '):(e?.error?.message||'No se pudo completar la operación');this.snack.open(String(m),'Cerrar',{duration:3500})}
}
