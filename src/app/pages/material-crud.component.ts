import { CommonModule } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
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
import { MatTooltipModule } from '@angular/material/tooltip';

interface Option { value:any; label:string; }
interface FieldConfig {
  key:string; label:string; type?:'text'|'email'|'number'|'date'|'time'|'textarea'|'select'|'toggle'|'password';
  required?:boolean; optionsKey?:string; min?:number; hideOnEdit?:boolean; placeholder?:string;
}
interface ColumnConfig { key:string; label:string; }
interface CrudConfig {
  title:string; subtitle:string; endpoint:string; pk:string;
  columns:ColumnConfig[]; fields:FieldConfig[];
  lookups?:Record<string,{endpoint:string; value:string; label:string; params?:any}>;
  deleteLabel?:string; deleteMode?:'delete'|'cesar';
  query?:()=>any;
}

@Component({
  selector:'app-material-crud', standalone:true,
  imports:[CommonModule,ReactiveFormsModule,FormsModule,MatButtonModule,MatCardModule,MatFormFieldModule,MatInputModule,MatSelectModule,MatSlideToggleModule,MatTableModule,MatSnackBarModule,MatProgressSpinnerModule,MatTooltipModule],
  template:`
  <section class="material-page">
    <div class="page-head material-page-head">
      <div><span class="eyebrow">Administración</span><h1>{{config.title}}</h1><p>{{config.subtitle}}</p></div>
      <button mat-flat-button color="primary" (click)="newRecord()">+ Nuevo registro</button>
    </div>

    <mat-card *ngIf="formVisible" class="crud-form-card">
      <mat-card-header><mat-card-title>{{editing ? 'Editar' : 'Nuevo'}} {{config.title.toLowerCase()}}</mat-card-title></mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" class="material-form-grid" (ngSubmit)="save()">
          <ng-container *ngFor="let field of config.fields">
            <ng-container *ngIf="!(editing && field.hideOnEdit)">
              <mat-slide-toggle *ngIf="field.type==='toggle'" [formControlName]="field.key" class="toggle-field">{{field.label}}</mat-slide-toggle>

              <mat-form-field *ngIf="field.type!=='toggle' && field.type!=='textarea'" appearance="outline">
                <mat-label>{{field.label}}</mat-label>
                <mat-select *ngIf="field.type==='select'" [formControlName]="field.key">
                  <mat-option [value]="null">-- Seleccione --</mat-option>
                  <mat-option *ngFor="let opt of options[field.optionsKey || '']" [value]="opt.value">{{opt.label}}</mat-option>
                </mat-select>
                <input *ngIf="field.type!=='select'" matInput [type]="field.type==='password'?'password':(field.type || 'text')" [formControlName]="field.key" [attr.min]="field.min ?? null" [placeholder]="field.placeholder || ''">
                <mat-error *ngIf="form.get(field.key)?.hasError('required')">Campo obligatorio</mat-error>
                <mat-error *ngIf="form.get(field.key)?.hasError('email')">Correo no válido</mat-error>
              </mat-form-field>

              <mat-form-field *ngIf="field.type==='textarea'" appearance="outline" class="span-2">
                <mat-label>{{field.label}}</mat-label><textarea matInput rows="3" [formControlName]="field.key"></textarea>
              </mat-form-field>
            </ng-container>
          </ng-container>
          <div class="crud-actions span-2">
            <button mat-button type="button" (click)="cancelForm()">Cancelar</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving">{{saving?'Guardando...':'Guardar'}}</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card class="crud-table-card">
      <div class="crud-toolbar"><mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Buscar</mat-label><input matInput [(ngModel)]="search" (ngModelChange)="applyFilter()" [ngModelOptions]="{standalone:true}" placeholder="Filtrar registros"></mat-form-field><button mat-stroked-button (click)="load()">Actualizar</button></div>
      <div class="material-loading" *ngIf="loading"><mat-spinner diameter="36"></mat-spinner></div>
      <div class="material-table-wrap" *ngIf="!loading">
        <table mat-table [dataSource]="filteredRows" class="material-table">
          <ng-container *ngFor="let col of config.columns" [matColumnDef]="col.key">
            <th mat-header-cell *matHeaderCellDef>{{col.label}}</th>
            <td mat-cell *matCellDef="let row">{{display(row,col.key)}}</td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let row" class="action-cell">
              <button mat-stroked-button color="primary" (click)="edit(row)">Editar</button>
              <button *ngIf="resource==='cobranza' && Number(row.saldo)>0" mat-stroked-button (click)="registrarPago(row)">Registrar pago</button>
              <button mat-stroked-button color="warn" (click)="remove(row)">{{config.deleteLabel || 'Desactivar'}}</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
        <div class="empty material-empty" *ngIf="!filteredRows.length">No hay registros.</div>
      </div>
    </mat-card>
  </section>`
})
export class MaterialCrudComponent implements OnInit {
  config!:CrudConfig; form!:FormGroup; rows:any[]=[]; filteredRows:any[]=[]; options:Record<string,Option[]>={};
  resource=''; editing:any=null; formVisible=false; loading=false; saving=false; search='';
  displayedColumns:string[]=[];
  private lookupsLoaded=false;
  private lookupsLoading=false;
  private initialized=false;
  private lastSlug='';
  private loadSeq=0;
  Number=Number;

  constructor(private route:ActivatedRoute, private api:ApiService, private fb:FormBuilder, private snack:MatSnackBar, public institution:InstitutionService){
    effect(()=>{
      const slug=this.institution.selected()?.slug||'';
      if(!this.initialized || slug===this.lastSlug) return;
      this.lastSlug=slug; this.rows=[]; this.filteredRows=[]; this.lookupsLoaded=false; this.options={}; this.cancelForm(); this.load();
    });
  }

  ngOnInit(){
    const resource=this.route.snapshot.data['resource'] as string;
    this.resource=resource;
    this.config=this.makeConfig(resource);
    this.displayedColumns=[...this.config.columns.map(c=>c.key),'acciones'];
    // Primero cargamos la tabla. Los catálogos se cargan de forma diferida
    // únicamente cuando el usuario abre Nuevo/Editar. Esto evita bloquear
    // la vista inicial de Personal con solicitudes que aún no son necesarias.
    this.buildForm();
    this.initialized=true;
    this.lastSlug=this.institution.selected()?.slug||'';
    this.load();
  }

  private buildForm(){
    const group:any={};
    for(const f of this.config.fields){
      const validators:any[]=[]; if(f.required) validators.push(Validators.required); if(f.type==='email') validators.push(Validators.email);
      group[f.key]=[f.type==='toggle'?true:null,validators];
    }
    this.form=this.fb.group(group);
  }

  private ensureLookups(done:()=>void){
    const lookups=this.config.lookups||{};
    const keys=Object.keys(lookups);
    if(!keys.length || this.lookupsLoaded){ done(); return; }
    if(this.lookupsLoading) return;

    this.lookupsLoading=true;
    const calls:any={};
    for(const key of keys){
      const l=lookups[key];
      const params={...(l.params||{})};
      if(key==='personal' || key==='alumnos') params.institucion=this.institution.selected()?.slug||'';
      calls[key]=this.api.get(l.endpoint,params);
    }

    forkJoin(calls).subscribe({
      next:(res:any)=>{
        for(const key of keys){
          const l=lookups[key];
          let list=Array.isArray(res[key])?res[key]:(res[key]?.data||[]);
          if(key==='instituciones' && this.institution.selected()){
            list=list.filter((x:any)=>this.isSelectedInstitutionName(String(x.nombre||'')));
          }
          this.options[key]=list.map((x:any)=>({value:x[l.value],label:this.path(x,l.label) ?? x[l.value]}));
        }
        this.lookupsLoaded=true;
        this.lookupsLoading=false;
        done();
      },
      error:(e:any)=>{
        this.lookupsLoading=false;
        this.toast(this.errorText(e));
      }
    });
  }

  load(){
    const token=++this.loadSeq;
    const slug=this.institution.selected()?.slug||'';
    this.loading=true;
    const params={per_page:200,...(this.config.query?.()||{})};
    this.api.get(this.config.endpoint,params).subscribe({
      next:r=>{
        if(token!==this.loadSeq || slug!==(this.institution.selected()?.slug||'')) return;
        this.rows=Array.isArray(r)?r:(r?.data||[]);
        this.applyFilter();
        this.loading=false;
      },
      error:e=>{
        if(token!==this.loadSeq) return;
        this.loading=false;
        this.toast(this.errorText(e));
      }
    });
  }

  newRecord(){
    this.ensureLookups(()=>{
      this.editing=null;
      this.form.reset();
      if(this.resource==='usuarios'){this.form.get('password')?.setValidators([Validators.required,Validators.minLength(8)]);this.form.get('password')?.updateValueAndValidity({emitEvent:false});}
      for(const f of this.config.fields) if(f.type==='toggle') this.form.get(f.key)?.setValue(true);
      if((this.resource==='personal' || this.resource==='alumnos') && this.options['instituciones']?.length===1){
        this.form.get('institucion_id')?.setValue(this.options['instituciones'][0].value);
      }
      this.formVisible=true;
    });
  }
  edit(row:any){
    this.ensureLookups(()=>{
      this.editing=row;
      if(this.resource==='usuarios'){this.form.get('password')?.clearValidators();this.form.get('password')?.setValidators([Validators.minLength(8)]);this.form.get('password')?.updateValueAndValidity({emitEvent:false});}
      const values:any={};
      for(const f of this.config.fields){
        values[f.key]=this.path(row,f.key);
        if(f.type==='date' && values[f.key]) values[f.key]=String(values[f.key]).substring(0,10);
      }
      this.form.reset(values);
      this.formVisible=true;
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }
  cancelForm(){this.formVisible=false;this.editing=null;this.form.reset();}

  save(){
    if(this.form.invalid) return; this.saving=true; const body:any={...this.form.value};
    for(const f of this.config.fields){ if(f.type==='number' && body[f.key]!==null && body[f.key]!=='' ) body[f.key]=Number(body[f.key]); }
    if(this.editing && body.password==='') delete body.password;
    const id=this.editing?.[this.config.pk]; const req=this.editing?this.api.put(`${this.config.endpoint}/${id}`,body):this.api.post(this.config.endpoint,body);
    req.subscribe({next:()=>{this.saving=false;this.toast('Registro guardado correctamente');this.cancelForm();this.load();},error:e=>{this.saving=false;this.toast(this.errorText(e));}});
  }

  remove(row:any){
    const id=row[this.config.pk];
    if(this.config.deleteMode==='cesar'){
      if(row.estado===false || row.estado===0){ this.toast('Este personal ya se encuentra cesado'); return; }
      const today=new Date().toISOString().slice(0,10);
      const fecha=prompt('Fecha de cese (AAAA-MM-DD). Se conservarán asistencia, horarios y remuneraciones históricas:',today);
      if(!fecha) return;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha)){ this.toast('Fecha de cese no válida'); return; }
      if(!confirm(`¿Confirmas el cese con fecha ${fecha}? También se cerrarán horarios, remuneración vigente y acceso de usuario.`)) return;
      this.api.patch(`${this.config.endpoint}/${id}/cesar`,{fecha_cese:fecha}).subscribe({
        next:()=>{this.toast('Personal cesado y vigencias cerradas correctamente');this.load();},
        error:e=>this.toast(this.errorText(e))
      });
      return;
    }
    if(!confirm('¿Confirmas la acción sobre este registro?')) return;
    this.api.delete(`${this.config.endpoint}/${id}`).subscribe({next:()=>{this.toast('Operación realizada');this.load();},error:e=>this.toast(this.errorText(e))});
  }


  registrarPago(row:any){
    const saldo=Number(row.saldo||0);
    if(saldo<=0){this.toast('La cuenta no tiene saldo pendiente');return;}
    const monto=Number(prompt(`Monto a registrar (saldo S/ ${saldo.toFixed(2)}):`,saldo.toFixed(2))||0);
    if(!monto)return;
    const metodo=prompt('Método de pago (efectivo, transferencia, Yape, etc.):','Efectivo')||'';
    const referencia=prompt('Referencia/operación (opcional):','')||'';
    this.api.post(`/cobranza/${row.cuenta_cobranza_id}/pago`,{monto,metodo,referencia}).subscribe({
      next:()=>{this.toast('Pago registrado correctamente');this.load();},
      error:e=>this.toast(this.errorText(e))
    });
  }

  applyFilter(){ const q=this.search.toLowerCase().trim(); this.filteredRows=!q?this.rows:this.rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q)); }
  display(row:any,key:string){
    if(key==='estado') return row.estado===true || row.estado===1 ? 'ACTIVO' : (row.estado===false || row.estado===0 ? 'INACTIVO' : row.estado || '-');
    if(key==='dia_semana'){ return ['', 'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][Number(row.dia_semana)] || row.dia_semana; }
    if(key==='fecha_ingreso' || key==='fecha_cese'){ const v=this.path(row,key); if(!v)return '-'; const x=String(v).substring(0,10).split('-'); return x.length===3?`${x[2]}/${x[1]}/${x[0]}`:v; }
    return this.path(row,key) ?? '-';
  }
  path(obj:any,path:string){ return path.split('.').reduce((a,k)=>a?.[k],obj); }
  toast(message:string){this.snack.open(message,'Cerrar',{duration:3500});}
  errorText(e:any){ const errors=e?.error?.errors; if(errors) return Object.values(errors).flat().join(' · '); return e?.error?.message || 'Ocurrió un error'; }

  private isSelectedInstitutionName(name:string):boolean{
    const slug=this.institution.selected()?.slug;
    const n=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(slug==='ccitp') return n.includes('ccitp');
    if(slug==='divertimundo') return n.includes('divertimundo') || n.includes('diveretimundo');
    if(slug==='pitagoras') return n.includes('pitagoras');
    return true;
  }

  private makeConfig(resource:string):CrudConfig{
    const instSlug=()=>this.institution.selected()?.slug||'';
    const configs:Record<string,CrudConfig>={
      instituciones:{title:'Institución',subtitle:'Datos de la institución seleccionada.',endpoint:'/instituciones',pk:'institucion_id',query:()=>({institucion:instSlug()}),columns:[{key:'nombre',label:'Nombre'},{key:'ruc',label:'RUC'},{key:'direccion',label:'Dirección'},{key:'estado',label:'Estado'}],fields:[{key:'nombre',label:'Nombre',required:true},{key:'razon_social',label:'Razón social'},{key:'ruc',label:'RUC'},{key:'direccion',label:'Dirección'},{key:'telefono',label:'Teléfono'},{key:'correo',label:'Correo',type:'email'},{key:'estado',label:'Activo',type:'toggle'}]},
      cargos:{title:'Cargos',subtitle:'Catálogo de cargos del personal.',endpoint:'/cargos',pk:'cargo_id',columns:[{key:'nombre',label:'Cargo'},{key:'descripcion',label:'Descripción'},{key:'estado',label:'Estado'}],fields:[{key:'nombre',label:'Nombre',required:true},{key:'descripcion',label:'Descripción',type:'textarea'},{key:'estado',label:'Activo',type:'toggle'}]},
      personal:{title:'Personal',subtitle:'Trabajadores y docentes de la institución seleccionada.',endpoint:'/personal',pk:'personal_id',deleteLabel:'Cesar',deleteMode:'cesar',query:()=>({institucion:instSlug()}),columns:[{key:'apellidos',label:'Apellidos'},{key:'nombres',label:'Nombres'},{key:'numero_documento',label:'Documento'},{key:'cargo.nombre',label:'Cargo'},{key:'fecha_ingreso',label:'Ingreso'},{key:'fecha_cese',label:'Cese'},{key:'estado',label:'Estado'}],lookups:{instituciones:{endpoint:'/instituciones',value:'institucion_id',label:'nombre',params:{estado:1,per_page:100}},cargos:{endpoint:'/cargos',value:'cargo_id',label:'nombre',params:{estado:1,per_page:100}}},fields:[{key:'institucion_id',label:'Institución',type:'select',optionsKey:'instituciones',required:true},{key:'cargo_id',label:'Cargo',type:'select',optionsKey:'cargos',required:true},{key:'codigo_personal',label:'Código personal'},{key:'tipo_documento',label:'Tipo documento'},{key:'numero_documento',label:'Número documento'},{key:'nombres',label:'Nombres',required:true},{key:'apellidos',label:'Apellidos',required:true},{key:'telefono',label:'Teléfono'},{key:'correo',label:'Correo',type:'email'},{key:'fecha_nacimiento',label:'Fecha nacimiento',type:'date'},{key:'fecha_ingreso',label:'Fecha ingreso',type:'date'},{key:'fecha_cese',label:'Fecha cese',type:'date'},{key:'estado',label:'Activo',type:'toggle'}]},
      horarios:{title:'Horarios',subtitle:'Bloques y jornadas asignadas al personal.',endpoint:'/horarios',pk:'horario_personal_id',columns:[{key:'personal.apellidos',label:'Apellidos'},{key:'personal.nombres',label:'Nombres'},{key:'dia_semana',label:'Día'},{key:'bloque',label:'Bloque'},{key:'hora_entrada',label:'Entrada'},{key:'hora_salida',label:'Salida'},{key:'tolerancia_minutos',label:'Tolerancia'},{key:'estado',label:'Estado'}],lookups:{personal:{endpoint:'/catalogos/personal',value:'personal_id',label:'nombre_completo'}},fields:[{key:'personal_id',label:'Personal',type:'select',optionsKey:'personal',required:true},{key:'dia_semana',label:'Día de semana',type:'select',optionsKey:'dias',required:true},{key:'bloque',label:'Bloque',type:'number',required:true,min:1},{key:'hora_entrada',label:'Hora entrada',type:'time',required:true},{key:'hora_salida',label:'Hora salida',type:'time',required:true},{key:'tolerancia_minutos',label:'Tolerancia (min)',type:'number',min:0},{key:'fecha_desde',label:'Desde',type:'date'},{key:'fecha_hasta',label:'Hasta',type:'date'},{key:'estado',label:'Activo',type:'toggle'}]},
      alumnos:{title:'Alumnos',subtitle:'Matrícula operativa y datos para cobranza de la institución.',endpoint:'/alumnos',pk:'alumno_id',query:()=>({institucion:instSlug()}),columns:[{key:'apellidos',label:'Apellidos'},{key:'nombres',label:'Nombres'},{key:'numero_documento',label:'Documento'},{key:'apoderado',label:'Apoderado'},{key:'programa_turno',label:'Programa / turno'},{key:'monto_mensualidad',label:'Mensualidad'},{key:'estado',label:'Estado'}],lookups:{instituciones:{endpoint:'/instituciones',value:'institucion_id',label:'nombre',params:{estado:1,per_page:100}}},fields:[{key:'institucion_id',label:'Institución',type:'select',optionsKey:'instituciones',required:true},{key:'codigo_alumno',label:'Código alumno'},{key:'tipo_documento',label:'Tipo documento'},{key:'numero_documento',label:'Número documento'},{key:'nombres',label:'Nombres',required:true},{key:'apellidos',label:'Apellidos',required:true},{key:'fecha_nacimiento',label:'Fecha nacimiento',type:'date'},{key:'telefono',label:'Teléfono'},{key:'correo',label:'Correo',type:'email'},{key:'apoderado',label:'Apoderado'},{key:'telefono_apoderado',label:'Teléfono apoderado'},{key:'programa_turno',label:'Programa / turno'},{key:'monto_matricula',label:'Matrícula',type:'number',min:0},{key:'monto_mensualidad',label:'Mensualidad',type:'number',min:0},{key:'observacion',label:'Observación',type:'textarea'},{key:'estado',label:'Activo',type:'toggle'}]},
      usuarios:{title:'Usuarios',subtitle:'Cuentas, roles y acceso al sistema.',endpoint:'/usuarios',pk:'usuario_id',columns:[{key:'nombre_usuario',label:'Usuario'},{key:'correo',label:'Correo'},{key:'rol.nombre',label:'Rol'},{key:'personal.apellidos',label:'Personal'},{key:'estado',label:'Estado'}],lookups:{roles:{endpoint:'/catalogos/roles',value:'rol_id',label:'nombre'},personal:{endpoint:'/catalogos/personal',value:'personal_id',label:'nombre_completo'}},fields:[{key:'personal_id',label:'Personal vinculado',type:'select',optionsKey:'personal'},{key:'rol_id',label:'Rol',type:'select',optionsKey:'roles',required:true},{key:'nombre_usuario',label:'Nombre de usuario',required:true},{key:'correo',label:'Correo',type:'email',required:true},{key:'password',label:'Contraseña',type:'password',required:false,placeholder:'En edición, déjalo vacío para conservarla'},{key:'estado',label:'Activo',type:'toggle'}]},
      cobranza:{title:'Morosidad / Cobranza',subtitle:'Cuentas pendientes y pagos de alumnos.',endpoint:'/cobranza',pk:'cuenta_cobranza_id',deleteLabel:'Marcar pagado',query:()=>({institucion:instSlug()}),columns:[{key:'alumno.apellidos',label:'Apellidos'},{key:'alumno.nombres',label:'Nombres'},{key:'concepto',label:'Concepto'},{key:'periodo',label:'Periodo'},{key:'monto_total',label:'Total'},{key:'monto_pagado',label:'Pagado'},{key:'saldo',label:'Saldo'},{key:'estado',label:'Estado'}],lookups:{alumnos:{endpoint:'/catalogos/alumnos',value:'alumno_id',label:'nombre_completo'}},fields:[{key:'alumno_id',label:'Alumno',type:'select',optionsKey:'alumnos',required:true},{key:'concepto',label:'Concepto',required:true},{key:'periodo',label:'Periodo'},{key:'monto_total',label:'Monto total',type:'number',required:true,min:0},{key:'monto_pagado',label:'Monto pagado',type:'number',min:0},{key:'fecha_vencimiento',label:'Vencimiento',type:'date'},{key:'estado',label:'Estado',type:'select',optionsKey:'estadosCobranza'},{key:'observacion',label:'Observación',type:'textarea'}]},
    };
    const cfg=configs[resource]; if(!cfg) throw new Error('CRUD no configurado: '+resource);
    this.options['dias']=[1,2,3,4,5,6,7].map((n,i)=>({value:n,label:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][i]}));
    this.options['estadosCobranza']=['PENDIENTE','PARCIAL','PAGADO','MOROSO'].map(x=>({value:x,label:x}));
    return cfg;
  }
}
