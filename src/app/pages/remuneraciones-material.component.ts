import { CommonModule } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { InstitutionService } from '../core/institution.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector:'app-remuneraciones-material',
  standalone:true,
  imports:[CommonModule,ReactiveFormsModule,MatButtonModule,MatCardModule,MatFormFieldModule,MatInputModule,MatSelectModule,MatTableModule,MatSnackBarModule],
  template:`
  <section class="material-page">
    <div class="page-head material-page-head">
      <div>
        <span class="eyebrow">{{ institution.selected()?.name }}</span>
        <h1>Remuneraciones</h1>
        <p>Historial de sueldo mensual o pago por hora. Un cambio crea una nueva vigencia.</p>
      </div>
      <button mat-flat-button color="primary" (click)="toggleForm()">{{showForm?'Cerrar formulario':'+ Nueva remuneración'}}</button>
    </div>

    <mat-card *ngIf="showForm" class="crud-form-card">
      <mat-card-content>
        <form [formGroup]="form" class="material-form-grid" (ngSubmit)="save()">
          <mat-form-field appearance="outline">
            <mat-label>Personal</mat-label>
            <mat-select formControlName="personal_id"><mat-option *ngFor="let p of personal" [value]="p.personal_id">{{p.nombre_completo}}</mat-option></mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tipo de pago</mat-label>
            <mat-select formControlName="tipo_pago_id"><mat-option *ngFor="let t of tipos" [value]="t.tipo_pago_id">{{t.nombre}}</mat-option></mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Curso / actividad (opcional)</mat-label>
            <input matInput formControlName="concepto" placeholder="Para pago por hora con tarifa específica">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Monto</mat-label>
            <input matInput type="number" min="0.01" step="0.01" formControlName="monto">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha inicio</mat-label>
            <input matInput type="date" formControlName="fecha_inicio">
          </mat-form-field>
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Observación</mat-label><textarea matInput formControlName="observacion"></textarea>
          </mat-form-field>
          <div class="crud-actions span-2">
            <button mat-button type="button" (click)="showForm=false">Cancelar</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving">{{saving?'Guardando...':'Guardar'}}</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card class="crud-table-card">
      <div class="crud-toolbar"><strong>Historial de {{ institution.selected()?.shortName }}</strong><button mat-stroked-button (click)="load()">Actualizar</button></div>
      <div class="material-table-wrap">
        <table mat-table [dataSource]="rows" class="material-table">
          <ng-container matColumnDef="personal"><th mat-header-cell *matHeaderCellDef>Personal</th><td mat-cell *matCellDef="let r">{{r.personal?.apellidos}}, {{r.personal?.nombres}}</td></ng-container>
          <ng-container matColumnDef="tipo"><th mat-header-cell *matHeaderCellDef>Tipo</th><td mat-cell *matCellDef="let r">{{r.tipo_pago?.nombre}}</td></ng-container>
          <ng-container matColumnDef="concepto"><th mat-header-cell *matHeaderCellDef>Curso / actividad</th><td mat-cell *matCellDef="let r">{{r.concepto||'General'}}</td></ng-container>
          <ng-container matColumnDef="monto"><th mat-header-cell *matHeaderCellDef>Monto</th><td mat-cell *matCellDef="let r">S/ {{r.monto}}</td></ng-container>
          <ng-container matColumnDef="inicio"><th mat-header-cell *matHeaderCellDef>Desde</th><td mat-cell *matCellDef="let r">{{r.fecha_inicio | date:'dd/MM/yyyy'}}</td></ng-container>
          <ng-container matColumnDef="fin"><th mat-header-cell *matHeaderCellDef>Hasta</th><td mat-cell *matCellDef="let r">{{r.fecha_fin ? (r.fecha_fin | date:'dd/MM/yyyy') : 'Vigente'}}</td></ng-container>
          <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let r"><span class="material-status" [class.ok]="r.estado">{{r.estado?'VIGENTE':'HISTÓRICO'}}</span></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr><tr mat-row *matRowDef="let row;columns:cols"></tr>
        </table>
        <div class="empty material-empty" *ngIf="!rows.length">No hay remuneraciones registradas.</div>
      </div>
    </mat-card>
  </section>`
})
export class RemuneracionesMaterialComponent implements OnInit {
  rows:any[]=[]; personal:any[]=[]; tipos:any[]=[]; showForm=false; saving=false;
  cols=['personal','tipo','concepto','monto','inicio','fin','estado'];
  private initialized=false; private lastSlug=''; private lookupSeq=0; private loadSeq=0;
  form:FormGroup;

  constructor(
    private fb:FormBuilder,
    private api:ApiService,
    public institution:InstitutionService,
    private snack:MatSnackBar
  ){
    effect(()=>{const slug=this.institution.selected()?.slug||'';if(this.initialized&&slug!==this.lastSlug){this.lastSlug=slug;this.rows=[];this.personal=[];this.showForm=false;this.load();}});
    this.form=this.fb.group({
      personal_id:[null,Validators.required],
      tipo_pago_id:[null,Validators.required],
      concepto:[''],
      monto:[null,[Validators.required,Validators.min(0.01)]],
      fecha_inicio:[new Date().toISOString().slice(0,10),Validators.required],
      observacion:['']
    });
  }

  ngOnInit(){this.initialized=true;this.lastSlug=this.institution.selected()?.slug||'';this.load();}
  toggleForm(){this.showForm=!this.showForm;if(this.showForm&&!this.personal.length)this.loadLookups();}
  loadLookups(){
    const token=++this.lookupSeq;const slug=this.institution.selected()?.slug||'';
    forkJoin({
      personal:this.api.get('/catalogos/personal',{institucion:slug}),
      tipos:this.api.get('/catalogos/tipos-pago')
    }).subscribe({next:(r:any)=>{if(token!==this.lookupSeq||slug!==(this.institution.selected()?.slug||''))return;this.personal=Array.isArray(r.personal)?r.personal:[];this.tipos=Array.isArray(r.tipos)?r.tipos:[];},error:e=>{if(token===this.lookupSeq)this.showError(e)}});
  }
  load(){
    const token=++this.loadSeq;const slug=this.institution.selected()?.slug||'';
    this.api.get('/remuneraciones',{per_page:200,institucion:slug})
      .subscribe({next:r=>{if(token===this.loadSeq&&slug===(this.institution.selected()?.slug||''))this.rows=r.data||[]},error:e=>{if(token===this.loadSeq)this.showError(e)}});
  }
  save(){
    if(this.form.invalid)return;
    this.saving=true;
    this.api.post('/remuneraciones',this.form.value).subscribe({
      next:()=>{this.saving=false;this.snack.open('Remuneración registrada','Cerrar',{duration:2500});this.showForm=false;this.form.reset({fecha_inicio:new Date().toISOString().slice(0,10)});this.load();},
      error:e=>{this.saving=false;this.showError(e);}
    });
  }
  showError(e:any){
    const errors=e?.error?.errors;
    const msg=errors?Object.values(errors).flat().join(' · '):(e?.error?.message||'No se pudo completar la operación');
    this.snack.open(String(msg),'Cerrar',{duration:4000});
  }
}
