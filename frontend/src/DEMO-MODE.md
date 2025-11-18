# Demo Mode (Mock Data)

## Overview

La aplicación está configurada por defecto en **MODO DEMO** que usa datos simulados en memoria. Esto permite explorar todas las funcionalidades sin necesidad de un backend real.

## ✅ Ventajas del Modo Demo

- ✨ **Sin configuración**: La aplicación funciona inmediatamente
- 🚀 **Rápido**: No requiere instalar ni configurar un backend
- 🎯 **Completo**: Todas las funcionalidades están disponibles
- 💾 **Seguro**: Los datos no se envían a ningún servidor
- 🧪 **Perfecto para testing**: Prueba features sin afectar datos reales

## 📊 Datos Incluidos

### Usuario Demo
- Email: usuario@demo.com
- Nombre: Usuario Demo
- Instrucciones del agente: Reglas de ejemplo pre-configuradas

### Citas de Ejemplo
1. **Cita con dentista** - 20 Nov 2025, 10:00
2. **Reunión con equipo** - 18 Nov 2025, 14:00
3. **Cita médica general** - 25 Nov 2025, 09:30

## 🎮 Cómo Usar el Modo Demo

### Iniciar Sesión
1. Abre la aplicación
2. Ingresa cualquier email y contraseña (no se validan en modo demo)
3. O usa las credenciales sugeridas:
   - Email: `demo@example.com`
   - Password: `password123`

### Funcionalidades Disponibles
- ✅ Crear, editar y eliminar citas
- ✅ Comandos en lenguaje natural
- ✅ Entrada por voz
- ✅ Notificaciones y recordatorios
- ✅ Calendario compacto
- ✅ Actualizar perfil
- ✅ Cambiar contraseña
- ✅ Configurar instrucciones del agente

### Limitaciones
- ⚠️ Los datos se pierden al recargar la página
- ⚠️ No hay persistencia entre sesiones
- ⚠️ Comandos de voz usan parsing simple (no IA real)

## 🔄 Cambiar a Backend Real

Cuando estés listo para conectar a un backend real:

### Paso 1: Configurar API
```typescript
// En /utils/api.ts

// Cambiar de true a false
const USE_MOCK_DATA = false;

// Actualizar URL del backend
const API_BASE_URL = 'https://tu-backend.com';
```

### Paso 2: Verificar Endpoints
Asegúrate de que tu backend implementa todos los endpoints documentados en:
- `/api-examples.md` - Ejemplos de requests/responses
- `/dev-handoff.md` - Especificación técnica

### Paso 3: Testing
1. Prueba login/registro
2. Verifica operaciones CRUD de citas
3. Confirma que los tokens de autenticación funcionan
4. Valida el procesamiento de comandos

## 🛠️ Desarrollo

### Agregar Datos Mock Adicionales

Para agregar más citas de ejemplo:

```typescript
// En /utils/api.ts, busca mockCitas y agrega:

mockCitas.push({
  objectId: '4',
  titulo: 'Nueva cita de ejemplo',
  fecha: '2025-12-01',
  hora_inicio: '15:00',
  lugar: 'Ubicación',
  descripcion: 'Descripción',
  notificacion: {
    activa: true,
    mensaje: 'Mensaje de recordatorio',
    tiempo_anticipacion: 30,
  },
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
});
```

### Modificar Comportamiento Mock

Las funciones mock están en el objeto `mockApi` en `/utils/api.ts`:

- `mockApi.register()` - Simula registro
- `mockApi.login()` - Simula login
- `mockApi.createCita()` - Crea cita en memoria
- `mockApi.listCitas()` - Lista citas ordenadas
- `mockApi.processCommand()` - Parsing simple de comandos

### Ajustar Delay de Red

Para simular diferentes velocidades de red:

```typescript
// En /utils/api.ts
const mockDelay = () => new Promise(resolve => setTimeout(resolve, 300)); // ms
```

## 📱 Casos de Uso

### Para Desarrollo Frontend
- Trabaja en la UI sin depender del backend
- Itera rápidamente en diseños
- Prueba flujos de usuario end-to-end

### Para Demos y Presentaciones
- Muestra la aplicación sin configuración previa
- No requiere conexión a internet
- Datos consistentes y predecibles

### Para Testing Manual
- Prueba casos edge sin afectar datos reales
- Reinicia fácilmente con datos limpios (recarga la página)
- Experimenta con diferentes escenarios

### Para Onboarding
- Permite a nuevos desarrolladores explorar el código
- No requiere setup complejo de backend
- Aprende la arquitectura de forma práctica

## 🔍 Debugging

### Ver Datos en Memoria

Abre la consola del navegador y ejecuta:

```javascript
// Ver todas las citas
console.log(mockCitas);

// Ver usuario actual
console.log(mockUser);

// Ver token
console.log(mockToken);
```

### Logs de API Calls

Todas las llamadas mock incluyen un delay de 300ms que simula latencia de red. Para debug, puedes agregar console.logs:

```typescript
// En mockApi.listCitas
listCitas: async (): Promise<Cita[]> => {
  console.log('[MOCK] Fetching citas...', mockCitas);
  await mockDelay();
  return [...mockCitas].sort(...);
}
```

## ⚡ Próximos Pasos

Una vez que hayas explorado el modo demo:

1. **Lee la documentación técnica**
   - `api-examples.md` - Especificación de API
   - `dev-handoff.md` - Guía para desarrolladores
   - `VOICE-AI-INTEGRATION.md` - Integración con IA

2. **Configura tu backend**
   - Implementa los endpoints documentados
   - Verifica autenticación con tokens
   - Prueba con Postman o similar

3. **Cambia a modo real**
   - Actualiza `USE_MOCK_DATA = false`
   - Configura `API_BASE_URL`
   - Prueba todas las funcionalidades

4. **Implementa el agente IA**
   - Conecta un modelo de lenguaje (GPT, Claude, etc.)
   - Procesa comandos de voz
   - Aplica instrucciones personalizadas del usuario

## 🆘 Soporte

Si encuentras problemas en modo demo:

1. Verifica que `USE_MOCK_DATA = true`
2. Recarga la página para resetear datos
3. Abre la consola para ver errores
4. Revisa que no haya modificaciones en `/utils/api.ts`

Para problemas con backend real, consulta `dev-handoff.md`.

---

**¡Disfruta explorando la aplicación! 🎉**
