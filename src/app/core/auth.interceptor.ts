import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { InstitutionService } from './institution.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const institutionService = inject(InstitutionService);
  const institution = institutionService.selected();
  const token = auth.token();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (institution) headers['X-Institucion'] = institution.slug;
  const request = Object.keys(headers).length ? req.clone({ setHeaders: headers }) : req;

  return next(request).pipe(catchError(err => {
    if (err.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      institutionService.clear();
      router.navigate(['/login']);
    }
    return throwError(() => err);
  }));
};
