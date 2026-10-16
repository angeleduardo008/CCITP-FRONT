# Login institucional mejorado

Cambios realizados:
- Nuevo login compartido para CCITP y Pitágoras usando el mismo componente.
- Diseño adaptado automáticamente a los colores y logotipo de cada institución.
- Alto fijo de pantalla en escritorio con `100dvh` para evitar scroll vertical.
- Modo compacto automático para laptops/pantallas con poca altura.
- Diseño móvil en una sola columna.
- Se conservan la autenticación existente, rutas, mensajes de error, mostrar/ocultar contraseña y acceso al registro de asistencia.
- No se modificó el backend.

Archivos principales modificados:
- `src/app/pages/login.component.ts`
- `src/styles.css`

Para ejecutar:
```powershell
npm install
ng serve
```

Si el navegador conserva una versión anterior:
```powershell
Remove-Item -Recurse -Force .angular\cache -ErrorAction SilentlyContinue
ng serve
```
Después usa Ctrl + F5 en el navegador.
