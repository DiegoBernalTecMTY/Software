# Integración de Entrada por Voz con Agente IA

## Descripción General

El componente `CommandComposer` ahora incluye funcionalidad de entrada por voz que permite a los usuarios dictar comandos en lenguaje natural. Esta documentación describe cómo está implementada la funcionalidad actual y cómo conectarla a un agente IA real en el futuro.

## Estado Actual (Implementación Frontend)

### Tecnología Utilizada
- **Web Speech API**: API nativa del navegador para reconocimiento de voz
- **Idioma**: Español (es-ES)
- **Soporte de navegadores**: Chrome, Edge, Safari (con limitaciones)

### Características Implementadas

1. **Botón de Micrófono**
   - Ubicado en la esquina inferior derecha del textarea de comandos
   - Estados visuales:
     - Normal (ghost): Micrófono gris, listo para activarse
     - Activo (pulsante rojo): Grabando/escuchando
     - Deshabilitado: Cuando no hay soporte o está procesando

2. **Reconocimiento de Voz**
   - Idioma: Español de España (es-ES)
   - Modo: No continuo (se detiene después de capturar)
   - Resultados intermedios: Sí (muestra texto mientras hablas)
   - Transcripción en tiempo real al textarea

3. **Manejo de Errores**
   - Permiso de micrófono denegado
   - No se detectó voz
   - No hay micrófono disponible
   - Errores de red
   - Mensajes de error contextuales con toast notifications

4. **Estados de UI**
   - Indicador visual cuando está escuchando
   - Textarea deshabilitado durante la grabación
   - Mensaje dinámico explicando el estado actual
   - Animación de pulso en el botón mientras graba

## Integración con Agente IA Real

### Punto de Integración Principal

El punto clave de integración está en el evento `recognition.onresult` del componente `CommandComposer.tsx`:

```typescript
recognition.onresult = (event: any) => {
  const transcript = event.results[0][0].transcript;
  setCommand(transcript);
  
  if (event.results[0].isFinal) {
    // AQUÍ VA LA INTEGRACIÓN CON EL AGENTE IA
  }
};
```

### Paso 1: Crear Endpoint en API

En `/utils/api.ts`, agregar un nuevo endpoint:

```typescript
export const aiAgentApi = {
  /**
   * Send voice command to AI agent
   * POST /api/ai-agent/voice
   */
  processVoiceCommand: async (payload: {
    transcript: string;
    userId: string;
    context?: {
      instrucciones_agente?: string;
      recent_appointments?: Cita[];
      current_date?: string;
    };
  }): Promise<CommandResponse> => {
    return apiFetch<CommandResponse>('/api/ai-agent/voice', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
```

### Paso 2: Backend AI Agent (Recomendaciones)

El backend del agente IA debe:

#### Recibir
```json
{
  "transcript": "Agendar cita con el dentista mañana a las 3 de la tarde",
  "userId": "user-123",
  "context": {
    "instrucciones_agente": "• Prefiero citas por la mañana\n• Dentista siempre en Clínica Dental Centro",
    "recent_appointments": [...],
    "current_date": "2025-11-16"
  }
}
```

#### Procesar
1. **Parse del lenguaje natural**: Extraer intención, entidades (fecha, hora, lugar, tipo)
2. **Aplicar preferencias del usuario**: Usar `instrucciones_agente` como contexto
3. **Validación inteligente**: 
   - Verificar conflictos con citas existentes
   - Sugerir alternativas si hay problemas
   - Aplicar reglas personalizadas del usuario
4. **Generar respuesta estructurada**

#### Responder
```json
{
  "exito": true,
  "respuesta": "He agendado tu cita con el dentista para mañana sábado 17 de noviembre a las 15:00 en la Clínica Dental Centro, según tus preferencias.",
  "resultado": {
    "titulo": "Cita con dentista",
    "fecha": "2025-11-17",
    "hora_inicio": "15:00",
    "lugar": "Clínica Dental Centro",
    "descripcion": "",
    "notificacion": {
      "activa": true,
      "mensaje": "Tu cita con el dentista es en 30 minutos",
      "tiempo_anticipacion": 30
    }
  },
  "metadata": {
    "confidence": 0.95,
    "applied_rules": ["location_preference", "default_reminder"],
    "alternative_suggestions": []
  }
}
```

### Paso 3: Actualizar CommandComposer

Modificar el handler de resultado final:

```typescript
if (event.results[0].isFinal) {
  try {
    setIsProcessing(true);
    
    // Obtener contexto del usuario
    const userInstructions = user?.instrucciones_agente;
    const recentAppointments = await citasApi.list();
    
    // Enviar al agente IA
    const response = await aiAgentApi.processVoiceCommand({
      transcript: transcript,
      userId: user.objectId!,
      context: {
        instrucciones_agente: userInstructions,
        recent_appointments: recentAppointments.slice(0, 10),
        current_date: new Date().toISOString().split('T')[0],
      },
    });
    
    // Mostrar resultado
    setResult(response);
    toast.success('Comando procesado correctamente');
    
  } catch (error) {
    console.error('Error processing voice command:', error);
    toast.error('Error al procesar el comando de voz');
  } finally {
    setIsProcessing(false);
  }
}
```

### Paso 4: Características Avanzadas (Opcional)

#### 4.1 Respuesta por Voz (Text-to-Speech)
```typescript
const speakResponse = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
};

// Después de recibir respuesta del agente
if (response.respuesta) {
  speakResponse(response.respuesta);
}
```

#### 4.2 Conversación Continua
```typescript
const [conversationHistory, setConversationHistory] = useState<
  Array<{ role: 'user' | 'assistant'; content: string }>
>([]);

// Agregar al contexto del agente IA
context: {
  conversation_history: conversationHistory,
  // ...
}
```

#### 4.3 Procesamiento Streaming
```typescript
// Para respuestas en tiempo real del agente
const streamResponse = async (transcript: string) => {
  const response = await fetch('/api/ai-agent/voice-stream', {
    method: 'POST',
    body: JSON.stringify({ transcript }),
  });
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  let accumulatedResponse = '';
  
  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    accumulatedResponse += chunk;
    
    // Actualizar UI en tiempo real
    setResult(prev => ({
      ...prev,
      respuesta: accumulatedResponse,
    }));
  }
};
```

## Modelos de IA Recomendados

### Opciones de Servicios

1. **OpenAI GPT-4 / GPT-3.5**
   - Pros: Excelente comprensión del español, contexto largo
   - Cons: Requiere API key, costos por token
   - Uso: Enviar transcript + instrucciones_agente como prompt

2. **Anthropic Claude**
   - Pros: Buen seguimiento de instrucciones, seguro
   - Cons: Requiere API key, disponibilidad regional
   - Uso: Similar a OpenAI con system prompts

3. **Google Gemini**
   - Pros: Multimodal, integración con Google services
   - Cons: Más reciente, menos documentación en español
   - Uso: API REST o SDK

4. **Azure OpenAI Service**
   - Pros: Enterprise, cumplimiento GDPR
   - Cons: Setup más complejo, costos
   - Uso: Mismo que OpenAI pero con hosting Azure

5. **Modelos locales (LLaMA, Mistral)**
   - Pros: Sin costos por uso, privacidad total
   - Cons: Requiere infraestructura, menor calidad
   - Uso: Desplegar con Ollama o similar

### Ejemplo de Prompt para el Agente

```
System: Eres un asistente inteligente para agendar citas. Tu trabajo es:
1. Interpretar comandos en lenguaje natural en español
2. Extraer: título, fecha, hora, lugar, descripción
3. Aplicar las preferencias del usuario
4. Generar respuestas amigables y confirmar la acción

Preferencias del usuario:
{instrucciones_agente}

Citas recientes:
{recent_appointments}

Usuario: {transcript}

Responde en formato JSON:
{
  "exito": boolean,
  "respuesta": "string (confirmación amigable)",
  "resultado": {
    "titulo": "string",
    "fecha": "YYYY-MM-DD",
    "hora_inicio": "HH:MM",
    "lugar": "string",
    "descripcion": "string"
  }
}
```

## Mejores Prácticas

### Seguridad
- ✅ Validar y sanitizar transcripts antes de enviar al backend
- ✅ No incluir información sensible en logs
- ✅ Implementar rate limiting para prevenir abuse
- ✅ Usar HTTPS para todas las comunicaciones

### UX
- ✅ Proporcionar feedback visual inmediato al hablar
- ✅ Permitir editar el texto transcrito antes de enviar
- ✅ Ofrecer comandos de ejemplo al usuario
- ✅ Manejar errores gracefully con mensajes claros

### Performance
- ✅ Cachear respuestas comunes del agente
- ✅ Optimizar el tamaño del contexto enviado
- ✅ Implementar timeouts apropiados
- ✅ Considerar procesamiento asíncrono para comandos complejos

### Privacidad
- ✅ Informar al usuario que se está usando el micrófono
- ✅ No grabar audio, solo usar transcripción en tiempo real
- ✅ Permitir deshabilitar la función de voz
- ✅ Cumplir con GDPR y regulaciones locales

## Testing

### Tests Manuales
1. Verificar reconocimiento de voz en diferentes navegadores
2. Probar con diferentes acentos del español
3. Validar manejo de errores (sin micrófono, sin permiso)
4. Confirmar que la transcripción aparece correctamente

### Tests Automatizados (Futuros)
```typescript
describe('Voice Input', () => {
  it('should initialize speech recognition', () => {
    // Mock SpeechRecognition API
    // Render CommandComposer
    // Assert button is enabled
  });
  
  it('should handle voice transcript', async () => {
    // Mock recognition.onresult
    // Simulate voice input
    // Assert command is set correctly
  });
  
  it('should send to AI agent on final result', async () => {
    // Mock API call
    // Trigger onresult with isFinal=true
    // Assert API was called with correct payload
  });
});
```

## Troubleshooting

### El micrófono no funciona
- Verificar permisos del navegador
- Comprobar que hay un micrófono conectado
- Probar en HTTPS (requerido por Web Speech API)
- Verificar soporte del navegador

### La transcripción es incorrecta
- Mejorar calidad del audio (micrófono mejor)
- Hablar más claro y pausado
- Verificar idioma configurado (es-ES)
- Considerar modelo de IA para corrección

### El agente no entiende comandos
- Revisar prompt del sistema
- Agregar más ejemplos en el training
- Ajustar las instrucciones_agente del usuario
- Implementar fallback a formulario manual

## Referencias

- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Speech Recognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Soporte

Para preguntas sobre la implementación o integración, consulta:
- `/dev-handoff.md` - Documentación general del proyecto
- `/api-examples.md` - Ejemplos de endpoints API
- `/component-spec.md` - Especificaciones de componentes
