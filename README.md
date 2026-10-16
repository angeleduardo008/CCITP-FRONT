# Registro de Asistencia - Frontend Angular

Frontend Angular 21 del sistema de registro de asistencia para **CCITP** y **Pitágoras School**.

## Flujo de acceso

1. `/` - Selección de institución.
2. `/login/ccitp` o `/login/pitagoras` - Login con identidad visual de la institución.
3. `/registrar-asistencia/ccitp` o `/registrar-asistencia/pitagoras` - Marcación pública filtrada por institución.
4. `/dashboard` - Panel autenticado.

## Identidad visual

- CCITP: azul institucional, blanco y acento rojo, usando el logo oficial incorporado.
- Pitágoras School: azul marino y turquesa, usando el logo extraído de la referencia proporcionada.

Las imágenes de referencia originales se conservaron en `public/referencias/` y los logos usados por el sistema están en `public/logos/`.

## Instalación

```bash
npm install
ng serve
```

Frontend: `http://localhost:4200`

Backend esperado: `http://127.0.0.1:8000/api`

## Nota para Laravel

El frontend envía el identificador lógico de institución (`ccitp` o `pitagoras`) en:

- Login: propiedad `institucion`.
- Consultas públicas: query string `institucion`.
- Marcación: campo `institucion` en `FormData`.
- Peticiones autenticadas: cabecera `X-Institucion`.

Laravel puede utilizar ese valor para validar que el usuario y el personal pertenezcan a la institución seleccionada.
