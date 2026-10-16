import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { InstitutionService } from '../core/institution.service';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section>
      <div class="page-head">
        <div>
          <span class="eyebrow">{{ institution.selected()?.name }}</span>
          <h1>Personal</h1>
          <p>Trabajadores y docentes de la institución seleccionada.</p>
        </div>
      </div>
      <div class="card filters">
        <input [(ngModel)]="q" placeholder="Buscar por nombre o documento" (keyup.enter)="load()" />
        <select [(ngModel)]="estado" (change)="load()">
          <option value="1">Activos</option>
          <option value="0">Cesados</option>
          <option value="">Todos</option>
        </select>
        <button class="btn secondary" (click)="load()">Buscar</button>
      </div>
      <div class="card table-card">
        <table>
          <thead><tr><th>Personal</th><th>Documento</th><th>Institución</th><th>Cargo</th><th>Estado</th></tr></thead>
          <tbody>
            <tr *ngFor="let p of rows">
              <td><b>{{ p.apellidos }}, {{ p.nombres }}</b><small>{{ p.codigo_personal }}</small></td>
              <td>{{ p.numero_documento || '-' }}</td>
              <td>{{ p.institucion?.nombre || '-' }}</td>
              <td>{{ p.cargo?.nombre || '-' }}</td>
              <td><span class="badge" [class.danger]="!p.estado">{{ p.estado ? 'ACTIVO' : 'CESADO' }}</span></td>
            </tr>
          </tbody>
        </table>
        <div class="empty" *ngIf="!rows.length">No hay registros.</div>
      </div>
    </section>
  `
})
export class PersonalComponent implements OnInit {
  rows: any[] = [];
  q = '';
  estado = '1';
  constructor(private api: ApiService, public institution: InstitutionService) {}
  ngOnInit() { this.load(); }
  load() {
    this.api.get('/personal', {
      q: this.q,
      estado: this.estado,
      institucion: this.institution.selected()?.slug || ''
    }).subscribe(r => this.rows = r.data || []);
  }
}
