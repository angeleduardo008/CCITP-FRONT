import { CommonModule } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/api.service';
import { InstitutionService } from '../core/institution.service';
import { AuthService } from '../core/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({selector:'app-material-list',standalone:true,imports:[CommonModule,FormsModule,MatButtonModule,MatCardModule,MatFormFieldModule,MatInputModule,MatSelectModule,MatTableModule,MatProgressSpinnerModule],template:`
<section class="material-page">
  <div class="page-head material-page-head"><div><span class="eyebrow">Consulta</span><h1>{{title}}</h1><p>{{subtitle}}</p></div><button mat-stroked-button (click)="load()">{{ resource==='asistencias' ? 'Actualizar incidencias' : 'Actualizar' }}</button></div>
  <mat-card class="crud-table-card">
    <div class="crud-toolbar">
      <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Buscar</mat-label><input matInput [(ngModel)]="search" (ngModelChange)="applyFilter()"></mat-form-field>
      <mat-form-field *ngIf="resource==='asistencias'" appearance="outline" subscriptSizing="dynamic"><mat-label>Estado</mat-label><mat-select [(ngModel)]="estado" (selectionChange)="load()"><mat-option value="">Todos</mat-option><mat-option value="PRESENTE">PRESENTE</mat-option><mat-option value="TARDANZA">TARDANZA</mat-option><mat-option value="FALTA">FALTA</mat-option><mat-option value="PERMISO">PERMISO</mat-option></mat-select></mat-form-field>
    </div>
    <div class="material-loading" *ngIf="loading"><mat-spinner diameter="36"></mat-spinner></div>
    <div class="material-table-wrap" *ngIf="!loading">
      <table mat-table [dataSource]="filteredRows" class="material-table">
        <ng-container *ngFor="let col of columns" [matColumnDef]="col.key"><th mat-header-cell *matHeaderCellDef>{{col.label}}</th><td mat-cell *matCellDef="let row">{{display(row,col.key)}}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="displayed"></tr><tr mat-row *matRowDef="let row; columns:displayed"></tr>
      </table>
      <div class="empty material-empty" *ngIf="!filteredRows.length">No hay registros.</div>
    </div>
  </mat-card>
</section>`})
export class MaterialListComponent implements OnInit{
  resource='';title='';subtitle='';endpoint='';rows:any[]=[];filteredRows:any[]=[];columns:any[]=[];displayed:string[]=[];loading=false;search='';estado='';private initialized=false;private lastSlug='';private loadSeq=0;
  constructor(private route:ActivatedRoute,private api:ApiService,public institution:InstitutionService,private auth:AuthService){effect(()=>{const slug=this.institution.selected()?.slug||'';if(this.initialized&&slug!==this.lastSlug){this.lastSlug=slug;this.rows=[];this.filteredRows=[];this.load();}})}
  ngOnInit(){this.resource=this.route.snapshot.data['resource'];this.configure();this.initialized=true;this.lastSlug=this.institution.selected()?.slug||'';this.load();}
  configure(){
    if(this.resource==='asistencias'){this.title='Asistencias e incidencias';this.subtitle='Entradas, salidas, tardanzas, salidas anticipadas y faltas automáticas.';this.endpoint='/asistencias';this.columns=[{key:'fecha',label:'Fecha'},{key:'personal.apellidos',label:'Apellidos'},{key:'personal.nombres',label:'Nombres'},{key:'hora_entrada_programada',label:'Entrada prog.'},{key:'fecha_hora_entrada',label:'Entrada real'},{key:'minutos_tardanza',label:'Tardanza (min)'},{key:'hora_salida_programada',label:'Salida prog.'},{key:'fecha_hora_salida',label:'Salida real'},{key:'minutos_salida_anticipada',label:'Salida anticipada (min)'},{key:'estado_asistencia',label:'Estado'},{key:'incidencias_resumen',label:'Incidencias'}];}
    else if(this.resource==='planillas'){this.title='Planillas';this.subtitle='Resumen de remuneraciones, descuentos y neto mensual.';this.endpoint='/planillas';this.columns=[{key:'anio',label:'Año'},{key:'mes',label:'Mes'},{key:'personal.apellidos',label:'Apellidos'},{key:'personal.nombres',label:'Nombres'},{key:'monto_referencia',label:'Referencia'},{key:'monto_bruto',label:'Bruto'},{key:'total_descuentos',label:'Descuentos'},{key:'monto_neto',label:'Neto'},{key:'estado',label:'Estado'}];}
    this.displayed=this.columns.map(c=>c.key);
  }
  load(){
    const token=++this.loadSeq;
    const slug=this.institution.selected()?.slug||'';
    this.loading=true;
    const params:any={per_page:200,institucion:slug};
    if(this.estado)params.estado=this.estado;

    if(this.resource==='asistencias' && this.auth.isAdmin()){
      this.api.post('/asistencias/procesar',{institucion:params.institucion}).subscribe({
        next:()=>this.loadRows(params,token,slug),
        error:()=>this.loadRows(params,token,slug)
      });
      return;
    }

    this.loadRows(params,token,slug);
  }

  private loadRows(params:any,token:number,slug:string){
    this.api.get(this.endpoint,params).subscribe({
      next:r=>{if(token!==this.loadSeq||slug!==(this.institution.selected()?.slug||''))return;this.rows=Array.isArray(r)?r:(r.data||[]);this.applyFilter();this.loading=false;},
      error:()=>{if(token!==this.loadSeq)return;this.rows=[];this.filteredRows=[];this.loading=false;}
    });
  }
  applyFilter(){const q=this.search.toLowerCase().trim();this.filteredRows=!q?this.rows:this.rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q));}
  path(o:any,p:string){return p.split('.').reduce((a,k)=>a?.[k],o)}
  display(row:any,key:string){const v=this.path(row,key);if(v===null||v===undefined||v==='')return '-';if(key==='mes')return ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][Number(v)]||v;if(key==='fecha')return String(v).substring(0,10).split('-').reverse().join('/');if(key==='fecha_hora_entrada'||key==='fecha_hora_salida'){const d=new Date(v);return isNaN(d.getTime())?String(v):d.toLocaleString('es-PE',{dateStyle:'short',timeStyle:'medium'});}return v;}
}
