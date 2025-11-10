# MNA-Software

Repositorio del proyecto de ejemplo (backend + frontend) para la aplicación de citas.

Este proyecto contiene:

- Un backend ligero en Python usando Flask (`app.py`) que actúa como proxy hacia Backendless para usuarios y datos de `citas`/`usuarios`.
- Un frontend separado creado con Vite (carpeta `frontend/`) con una interfaz React/TSX y componentes reutilizables.

## Requisitos

- Windows (las instrucciones siguientes usan PowerShell). También funcionan en macOS/Linux con pasos equivalentes.
- Python 3.10+ instalado y en PATH.
- Node.js 16+ (con npm) para el frontend.
- Conexión a Internet para instalar dependencias y usar Backendless.

Opcionalmente, si dispone de credenciales de Backendless, configure las variables de entorno que se indican abajo.

## Preparar y ejecutar el backend (Flask)

1) Abrir PowerShell en la raíz del proyecto (donde está `app.py`).

2) Crear y activar un entorno virtual (recomendado):

```powershell
# Crear venv
python -m venv .venv

# Activar en PowerShell
. .\.venv\Scripts\Activate.ps1
```

3) Instalar dependencias. Este repositorio incluye `requirements.txt` con las dependencias mínimas necesarias. Recomendado:

```powershell
# Actualizar pip e instalar desde requirements.txt
pip install --upgrade pip
pip install -r requirements.txt
```

Si prefieres instalar manualmente o no usar `requirements.txt`, puedes instalar las dependencias fundamentales así:

```powershell
pip install flask requests flask-cors
```

4) (Opcional) establecer variables de entorno para Backendless si desea usar credenciales propias en lugar de los valores por defecto embebidos en `app.py`:

```powershell
$env:BACKENDLESS_APP_ID = "tu-backendless-app-id"
$env:BACKENDLESS_REST_API_KEY = "tu-backendless-rest-api-key"
```

5) Ejecutar la aplicación Flask:

```powershell
python .\app.py
```

Por defecto Flask se inicia en `http://127.0.0.1:5000` con `debug=True`. Verá salidas de logs y rutas disponibles en la consola.

Rutas útiles (ejemplos):
- GET `/debug/urls` — muestra las URLs calculadas hacia Backendless.
- POST `/users/register` — registra usuario (proxy a Backendless).
- POST `/users/login` — inicia sesión (proxy a Backendless).

Nota sobre CORS: `app.py` añade cabeceras CORS (permitiendo `*`) y funciona aun sin `flask-cors` instalado. Si el frontend está en otro puerto, esto permite peticiones desde el navegador en desarrollo.

## Preparar y ejecutar el frontend (Vite)

1) Abrir otra ventana de PowerShell y situarse en la carpeta `frontend`:

```powershell
cd .\frontend
```

2) Instale dependencias con npm (o yarn/pnpm si las prefiere):

```powershell
npm install
```

3) Iniciar el servidor de desarrollo Vite:

```powershell
npm run dev
```

Por defecto Vite ejecutará el frontend en `http://localhost:5173` (o en el puerto que Vite muestre en consola). Abra esa URL en el navegador.

### Cómo hacer que frontend y backend se comuniquen

- El backend corre por defecto en el puerto `5000` y Vite en `5173`. El frontend debe apuntar a las rutas del backend (por ejemplo `http://127.0.0.1:5000/users/login`).
- Verifique en el código del frontend (por ejemplo `frontend/src/utils/api.ts` o archivos equivalentes) la constante o la configuración que define la URL base de la API y actualícela si es necesario.

Ejemplo simple de llamada desde frontend:

```js
// ejemplo: usar http://127.0.0.1:5000 como API base en desarrollo
const API_BASE = 'http://127.0.0.1:5000'
fetch(`${API_BASE}/usuarios`)
  .then(r => r.json())
  .then(console.log)

```

## Variables importantes

- BACKENDLESS_APP_ID — (opcional) ID de la app Backendless.
- BACKENDLESS_REST_API_KEY — (opcional) API key REST de Backendless.

Puede exportarlas en PowerShell (solo afectan a la sesión actual):

```powershell
$env:BACKENDLESS_APP_ID = "E60A01B9-D08F-4932-915E-F479323571A3"
$env:BACKENDLESS_REST_API_KEY = "222DE0E2-363D-468A-A5B3-0556E6A62310"
```

Si no las define, `app.py` usa valores de fallback escritos en el archivo (útiles para pruebas locales).

## Resolución de problemas comunes

- Error: "Address already in use" al iniciar Flask: cambie el puerto o cierre la aplicación que usa el puerto. Para ejecutar Flask en otro puerto:

```powershell
python -c "from app import app; app.run(port=8000)"
```

- Problemas CORS desde el navegador: asegúrese de que `app.py` esté corriendo y que devuelve cabeceras CORS; si usa proxys o un servidor externo revise que `user-token` y otras cabeceras que requieren autenticación se pasen correctamente.

- Dependencias faltantes: instale `flask`, `requests` y opcionalmente `flask-cors`.

## Estructura del repositorio (resumen)

- `app.py` — servidor Flask (backend/proxy hacia Backendless).
- `frontend/` — proyecto Vite con React/TSX (interfaz de usuario).
- `MOCK_DATA.csv`, `MOCK_DATA.json` — ejemplos de datos de muestra.
- `docs/`, `figma/` — documentación de diseño y recursos.

## Contribuir

1. Hacer fork / branch.
2. Crear cambios y pruebas mínimas.
3. Abrir pull request describiendo qué se cambió y por qué.

## Contacto

Si necesitas ayuda o quieres reportar un problema, crea un issue en el repositorio o contacta al mantenedor.

---

Resumen de verificación: instrucciones apuntadas a PowerShell en Windows; si usas macOS/Linux sustituye los comandos de activación del entorno virtual por `source .venv/bin/activate`.

¡Listo! Sigue los pasos anteriores para probar el backend (`app.py`) y el frontend (Vite) en otra máquina.
