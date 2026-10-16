# Login institucional actualizado

Se reemplazó la presentación visual del login manteniendo la autenticación existente contra Laravel (`POST /api/auth/login`).

## Cambios
- Diseño dividido de dos paneles.
- Identidad visual dinámica para CCITP y Pitágoras.
- Logo institucional grande en escritorio y compacto en móvil.
- Campos de usuario/correo y contraseña rediseñados.
- Mostrar/ocultar contraseña.
- Estado de carga y mensajes de error.
- Enlace para cambiar de institución.
- Enlace al registro público de asistencia.
- Diseño responsive para desktop, tablet y móvil.

## Archivos modificados
- `src/app/pages/login.component.ts`
- `src/styles.css`

## Ejecución
```powershell
npm install
ng serve
```

Luego abre `http://localhost:4200` y selecciona CCITP o Pitágoras para acceder a su login.
