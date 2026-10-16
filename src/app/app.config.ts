import {
  ApplicationConfig,
  provideZoneChangeDetection
} from '@angular/core';

import {
  provideRouter
} from '@angular/router';

import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import {
  provideAnimationsAsync
} from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';

import {
  authInterceptor
} from './core/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [

    /**
     * IMPORTANTE
     * Fuerza a Angular a actualizar inmediatamente la interfaz
     * cuando cambian variables desde HTTP, RxJS, timers, etc.
     *
     * Esto es especialmente útil porque el proyecto tiene muchos
     * componentes construidos con propiedades normales:
     *
     * loading = false
     * rows = [...]
     * saving = false
     *
     * y no únicamente Signals.
     */
    provideZoneChangeDetection({
      eventCoalescing: true
    }),

    provideRouter(routes),

    provideHttpClient(
      withInterceptors([
        authInterceptor
      ])
    ),

    provideAnimationsAsync()

  ]
};