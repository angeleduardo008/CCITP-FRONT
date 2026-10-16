import { CommonModule } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { InstitutionService } from '../core/institution.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-horarios-material',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatTableModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
  <section class="material-page">
    <div class="page-head material-page-head">
      <div>
        <span class="eyebrow">{{ institution.selected()?.name }}</span>
        <h1>Horarios semanales</h1>
        <p>Asigna uno o dos bloques a varios días sin perder el histórico anterior.</p>
      </div>
      <button mat-flat-button color="primary" (click)="toggleForm()">
        {{ showForm ? 'Cerrar formulario' : '+ Asignar jornada' }}
      </button>
    </div>

    <mat-card *ngIf="showForm" class="crud-form-card phase3-schedule-card">
      <mat-card-header>
        <mat-card-title>Nueva vigencia de horario</mat-card-title>
        <mat-card-subtitle>Los horarios vigentes de los días seleccionados se cerrarán al día anterior.</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" class="material-form-grid" (ngSubmit)="saveWeekly()">
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Personal</mat-label>
            <mat-select formControlName="personal_id">
              <mat-option *ngFor="let p of personal" [value]="p.personal_id">{{ p.nombre_completo }} · {{ p.cargo || 'Sin cargo' }}</mat-option>
            </mat-select>
            <mat-error>Seleccione una persona</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Días de trabajo</mat-label>
            <mat-select formControlName="dias" multiple>
              <mat-option *ngFor="let d of days" [value]="d.value">{{ d.label }}</mat-option>
            </mat-select>
            <mat-error>Seleccione al menos un día</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Vigente desde</mat-label>
            <input matInput type="date" formControlName="fecha_desde">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Vigente hasta (opcional)</mat-label>
            <input matInput type="date" formControlName="fecha_hasta">
          </mat-form-field>

          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Curso / actividad del bloque 1 (opcional)</mat-label>
            <input matInput formControlName="concepto1" placeholder="Ej. Matemática, Cocina, Administración">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Bloque 1 · entrada</mat-label>
            <input matInput type="time" formControlName="entrada1">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Bloque 1 · salida</mat-label>
            <input matInput type="time" formControlName="salida1">
          </mat-form-field>

          <mat-slide-toggle formControlName="segundo_bloque" class="span-2 toggle-field">
            Agregar segundo bloque (ejemplo: Leticia 14:00–17:30)
          </mat-slide-toggle>

          <ng-container *ngIf="form.value.segundo_bloque">
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Curso / actividad del bloque 2 (opcional)</mat-label>
              <input matInput formControlName="concepto2">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Bloque 2 · entrada</mat-label>
              <input matInput type="time" formControlName="entrada2">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Bloque 2 · salida</mat-label>
              <input matInput type="time" formControlName="salida2">
            </mat-form-field>
          </ng-container>

          <mat-form-field appearance="outline">
            <mat-label>Tolerancia (minutos)</mat-label>
            <input matInput type="number" min="0" max="180" formControlName="tolerancia_minutos">
          </mat-form-field>

          <div class="phase3-schedule-note span-2">
            <b>Importante:</b> esta opción conserva el histórico. No edita retroactivamente jornadas anteriores.
          </div>

          <div class="crud-actions span-2">
            <button mat-button type="button" (click)="showForm=false">Cancelar</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving">
              {{ saving ? 'Guardando...' : 'Guardar horario semanal' }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card class="crud-table-card">
      <div class="crud-toolbar phase3-toolbar">
        <div>
          <strong>Horarios registrados</strong>
          <small>Se muestran vigentes e históricos de {{ institution.selected()?.shortName }}.</small>
        </div>
        <button mat-stroked-button (click)="load()">Actualizar</button>
      </div>
      <div class="material-loading" *ngIf="loading"><mat-spinner diameter="36"></mat-spinner></div>
      <div class="material-table-wrap" *ngIf="!loading">
        <table mat-table [dataSource]="rows" class="material-table">
          <ng-container matColumnDef="personal"><th mat-header-cell *matHeaderCellDef>Personal</th><td mat-cell *matCellDef="let r"><b>{{r.personal?.apellidos}}, {{r.personal?.nombres}}</b></td></ng-container>
          <ng-container matColumnDef="dia"><th mat-header-cell *matHeaderCellDef>Día</th><td mat-cell *matCellDef="let r">{{dayName(r.dia_semana)}}</td></ng-container>
          <ng-container matColumnDef="bloque"><th mat-header-cell *matHeaderCellDef>Bloque</th><td mat-cell *matCellDef="let r">{{r.bloque}}</td></ng-container>
          <ng-container matColumnDef="concepto"><th mat-header-cell *matHeaderCellDef>Curso / actividad</th><td mat-cell *matCellDef="let r">{{r.concepto||'General'}}</td></ng-container>
          <ng-container matColumnDef="entrada"><th mat-header-cell *matHeaderCellDef>Entrada</th><td mat-cell *matCellDef="let r">{{shortTime(r.hora_entrada)}}</td></ng-container>
          <ng-container matColumnDef="salida"><th mat-header-cell *matHeaderCellDef>Salida</th><td mat-cell *matCellDef="let r">{{shortTime(r.hora_salida)}}</td></ng-container>
          <ng-container matColumnDef="vigencia"><th mat-header-cell *matHeaderCellDef>Vigencia</th><td mat-cell *matCellDef="let r">{{shortDate(r.fecha_desde)}} → {{r.fecha_hasta ? shortDate(r.fecha_hasta) : 'actual'}}</td></ng-container>
          <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let r"><span class="material-status" [class.ok]="r.estado" [class.bad]="!r.estado">{{r.estado?'VIGENTE':'HISTÓRICO'}}</span></td></ng-container>
          <ng-container matColumnDef="accion"><th mat-header-cell *matHeaderCellDef>Acción</th><td mat-cell *matCellDef="let r"><button *ngIf="r.estado" mat-stroked-button color="warn" (click)="deactivate(r)">Desactivar</button><span *ngIf="!r.estado">—</span></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns:cols"></tr>
        </table>
        <div class="empty material-empty" *ngIf="!rows.length">No hay horarios registrados.</div>
      </div>
    </mat-card>
  </section>
  `
})
export class HorariosMaterialComponent implements OnInit {
  personal:any[]=[]; rows:any[]=[]; loading=false; saving=false; showForm=false;
  cols=['personal','dia','bloque','concepto','entrada','salida','vigencia','estado','accion'];
  private initialized=false; private lastSlug=''; private lookupSeq=0; private loadSeq=0;
  days=[
    {value:1,label:'Lunes'},{value:2,label:'Martes'},{value:3,label:'Miércoles'},
    {value:4,label:'Jueves'},{value:5,label:'Viernes'},{value:6,label:'Sábado'},{value:7,label:'Domingo'}
  ];

  form!:FormGroup;

  constructor(
    private fb:FormBuilder,
    private api:ApiService,
    public institution:InstitutionService,
    private snack:MatSnackBar
  ){
    effect(()=>{const slug=this.institution.selected()?.slug||'';if(this.initialized&&slug!==this.lastSlug){this.lastSlug=slug;this.personal=[];this.rows=[];this.showForm=false;this.load();}});
    this.form=this.fb.group({
      personal_id:[null,Validators.required],
      dias:[[] as number[],Validators.required],
      fecha_desde:[new Date().toISOString().slice(0,10),Validators.required],
      fecha_hasta:[''],
      concepto1:[''],
      entrada1:['07:00',Validators.required],
      salida1:['13:00',Validators.required],
      segundo_bloque:[false],
      concepto2:[''],
      entrada2:['14:00'],
      salida2:['17:30'],
      tolerancia_minutos:[0,[Validators.required,Validators.min(0),Validators.max(180)]]
    });
  }

  ngOnInit(){ this.initialized=true;this.lastSlug=this.institution.selected()?.slug||'';this.load(); }

  toggleForm(){
    this.showForm=!this.showForm;
    if(this.showForm && !this.personal.length) this.loadPersonal();
  }

  loadPersonal(){
    const token=++this.lookupSeq;const slug=this.institution.selected()?.slug||'';
    this.api.get('/catalogos/personal',{institucion:slug})
      .subscribe((r:any)=>{if(token===this.lookupSeq&&slug===(this.institution.selected()?.slug||''))this.personal=Array.isArray(r)?r:[];});
  }

  load(){
    const token=++this.loadSeq;const slug=this.institution.selected()?.slug||'';
    this.loading=true;
    this.api.get('/horarios',{per_page:500,institucion:slug})
      .subscribe({next:(r:any)=>{if(token!==this.loadSeq||slug!==(this.institution.selected()?.slug||''))return;this.rows=r.data||[];this.loading=false;},error:e=>{if(token!==this.loadSeq)return;this.loading=false;this.error(e);}});
  }

  saveWeekly(){
    if(this.form.invalid) return;
    const v:any=this.form.value;
    const bloques:any[]=[{bloque:1,concepto:v.concepto1||null,hora_entrada:v.entrada1,hora_salida:v.salida1}];
    if(v.segundo_bloque){
      if(!v.entrada2 || !v.salida2){ this.snack.open('Completa el segundo bloque','Cerrar',{duration:3000}); return; }
      bloques.push({bloque:2,concepto:v.concepto2||null,hora_entrada:v.entrada2,hora_salida:v.salida2});
    }
    const body={
      personal_id:v.personal_id,
      dias:v.dias,
      bloques,
      fecha_desde:v.fecha_desde,
      fecha_hasta:v.fecha_hasta||null,
      tolerancia_minutos:Number(v.tolerancia_minutos||0)
    };
    this.saving=true;
    this.api.post('/horarios/semana',body).subscribe({
      next:(r:any)=>{
        this.saving=false;
        this.snack.open(r.message||'Horario semanal guardado','Cerrar',{duration:3000});
        this.showForm=false; this.load();
      },
      error:e=>{this.saving=false;this.error(e);}
    });
  }

  deactivate(row:any){
    if(!confirm(`¿Desactivar el horario de ${row.personal?.nombres || 'esta persona'}? El histórico se conservará.`)) return;
    this.api.delete(`/horarios/${row.horario_personal_id}`).subscribe({
      next:()=>{this.snack.open('Horario desactivado','Cerrar',{duration:2500});this.load();},
      error:e=>this.error(e)
    });
  }

  dayName(n:number){ return ['', 'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][Number(n)]||n; }
  shortTime(v:any){ return v ? String(v).substring(0,5) : '-'; }
  shortDate(v:any){ if(!v)return '-'; const s=String(v).substring(0,10).split('-'); return s.length===3?`${s[2]}/${s[1]}/${s[0]}`:v; }
  error(e:any){ const errors=e?.error?.errors; const msg=errors?Object.values(errors).flat().join(' · '):(e?.error?.message||'No se pudo completar la operación'); this.snack.open(String(msg),'Cerrar',{duration:4500}); }
}
