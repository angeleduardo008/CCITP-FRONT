import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { InstitutionService } from './institution.service';

export interface AuthUser {
  usuario_id: number;
  nombre_usuario: string;
  correo: string;
  rol: string;
  personal?: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<AuthUser | null>(this.readUser());

  constructor(
    private http: HttpClient,
    private router: Router,
    private institution: InstitutionService
  ) {}

  login(login: string, password: string) {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, {
      login,
      password
    }).pipe(tap(r => {
      localStorage.setItem('token', r.token);
      localStorage.setItem('user', JSON.stringify(r.user));
      this.user.set(r.user);

      if (r.user?.rol === 'ADMINISTRADOR') {
        this.institution.clear();
      } else {
        const selected = r.institucion
          ? this.institution.select(r.institucion)
          : this.institution.selectByName(r.user?.personal?.institucion?.nombre);

        if (!selected) {
          this.institution.clear();
        }
      }
    }));
  }

  logout() {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      complete: () => this.clear(),
      error: () => this.clear()
    });
  }

  token() { return localStorage.getItem('token'); }
  isAuthenticated() { return !!this.token(); }
  isAdmin() { return this.user()?.rol === 'ADMINISTRADOR'; }

  private clear() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.user.set(null);
    this.institution.clear();
    this.router.navigate(['/login']);
  }

  private readUser(): AuthUser | null {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  }
}
