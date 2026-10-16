import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth.guard';
import { InstitutionSelectorComponent } from './pages/institution-selector.component';
import { LoginComponent } from './pages/login.component';
import { RegistrarAsistenciaComponent } from './pages/registrar-asistencia.component';
import { LayoutComponent } from './pages/layout.component';
import { DashboardComponent } from './pages/dashboard.component';
import { MaterialCrudComponent } from './pages/material-crud.component';
import { MaterialListComponent } from './pages/material-list.component';
import { JustificacionesMaterialComponent } from './pages/justificaciones-material.component';
import { RemuneracionesMaterialComponent } from './pages/remuneraciones-material.component';
import { HorariosMaterialComponent } from './pages/horarios-material.component';
import { AdminInstitutionsComponent } from './pages/admin-institutions.component';
import { PlanillasComponent } from './pages/planillas.component';
import { ReportesComponent } from './pages/reportes.component';
import { AuditoriaComponent } from './pages/auditoria.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'login/:institucion', redirectTo: 'login', pathMatch: 'full' },
  { path: 'asistencia', component: InstitutionSelectorComponent },
  { path: 'registrar-asistencia/:institucion', component: RegistrarAsistenciaComponent },
  { path: 'registrar-asistencia', redirectTo: 'asistencia', pathMatch: 'full' },
  {
    path: '', component: LayoutComponent, canActivate: [authGuard], children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'instituciones-panel', component: AdminInstitutionsComponent, canActivate:[adminGuard] },
      { path: 'personal', component: MaterialCrudComponent, data:{resource:'personal'}, canActivate:[adminGuard] },
      { path: 'alumnos', component: MaterialCrudComponent, data:{resource:'alumnos'}, canActivate:[adminGuard] },
      { path: 'instituciones', component: MaterialCrudComponent, data:{resource:'instituciones'}, canActivate:[adminGuard] },
      { path: 'cargos', component: MaterialCrudComponent, data:{resource:'cargos'}, canActivate:[adminGuard] },
      { path: 'horarios', component: HorariosMaterialComponent, canActivate:[adminGuard] },
      { path: 'asistencias', component: MaterialListComponent, data:{resource:'asistencias'} },
      { path: 'justificaciones', component: JustificacionesMaterialComponent },
      { path: 'remuneraciones', component: RemuneracionesMaterialComponent, canActivate:[adminGuard] },
      { path: 'planillas', component: PlanillasComponent },
      { path: 'morosidad', component: MaterialCrudComponent, data:{resource:'cobranza'}, canActivate:[adminGuard] },
      { path: 'reportes', component: ReportesComponent, canActivate:[adminGuard] },
      { path: 'auditoria', component: AuditoriaComponent, canActivate:[adminGuard] },
      { path: 'usuarios', component: MaterialCrudComponent, data:{resource:'usuarios'}, canActivate:[adminGuard] }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
