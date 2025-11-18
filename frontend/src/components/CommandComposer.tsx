import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Calendar, Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import type { CommandResponse, Cita } from '../utils/api';

interface CommandComposerProps {
  onProcess: (texto: string) => Promise<CommandResponse>;
  onConfirm?: (result: any) => void;
}

export function CommandComposer({ onProcess, onConfirm }: CommandComposerProps) {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CommandResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const suggestedCommands = [
    'Agendar cita con el dentista el martes a las 4pm',
    'Revisar mis citas de esta semana',
    'Crear reunión con el equipo mañana a las 10am',
    'Recordatorio: cita médica viernes',
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsVoiceSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES'; // Spanish language
      recognition.continuous = false; // Stop after one result
      recognition.interimResults = true; // Show interim results
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Escuchando... Habla ahora');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCommand(transcript);
        
        // If it's the final result, we can optionally auto-process
        if (event.results[0].isFinal) {
          // ==========================================
          // TODO: AI AGENT INTEGRATION POINT
          // ==========================================
          // When ready to connect to a real AI agent:
          // 1. Create an endpoint in /utils/api.ts:
          //    - voiceToAIAgent: async (audioTranscript: string) => Promise<CommandResponse>
          //    - This should send the transcript to your AI agent backend
          // 2. The AI agent should:
          //    - Process the natural language command
          //    - Return structured appointment data
          //    - Include contextual information from user's instrucciones_agente
          // 3. Replace the toast below with:
          //    - await onProcess(transcript); // This will call the existing command processor
          //    - Or create a separate handler for voice-specific processing
          // 4. Consider adding:
          //    - Loading state while AI processes
          //    - Streaming responses for real-time feedback
          //    - Voice output (text-to-speech) for AI responses
          //    - Conversation history for context-aware interactions
          // ==========================================
          
          toast.success('Comando capturado: ' + transcript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = 'Error al capturar voz';
        let errorDescription = '';
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = '🔒 Permiso de micrófono denegado';
            errorDescription = 'Haz clic en el ícono de candado o configuración en la barra de direcciones y permite el acceso al micrófono. Luego recarga la página.';
            break;
          case 'no-speech':
            errorMessage = 'No se detectó voz';
            errorDescription = 'Intenta hablar más cerca del micrófono o en un lugar más silencioso.';
            break;
          case 'audio-capture':
            errorMessage = 'No se detectó micrófono';
            errorDescription = 'Verifica que tu micrófono esté conectado y configurado correctamente en tu sistema.';
            break;
          case 'network':
            errorMessage = 'Error de red';
            errorDescription = 'La función de voz requiere conexión a internet. Verifica tu conexión.';
            break;
          default:
            errorDescription = 'Por favor, intenta de nuevo.';
        }
        
        toast.error(errorMessage, {
          description: errorDescription,
          duration: 6000,
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsVoiceSupported(false);
      console.warn('Speech Recognition not supported in this browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleProcess = async () => {
    if (!command.trim()) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await onProcess(command);
      setResult(response);
      // Auto-execute only when the agent explicitly signals execution intent
      // i.e. the parsed output includes `raw.execute === true`. This prevents
      // accidental creations when the model misclassifies an intent (for
      // example, replying 'create' to a 'show' query). If execution is
      // requested, call the backend via api.command.processWithConfirm so the
      // server performs the create with the user's token (ensuring ownerId).
      try {
        const raw = (response as any)?.raw || {};
        const hasResultado = Boolean((response as any)?.resultado && Object.keys((response as any).resultado).length);
        const wantsExecute = raw.execute === true || raw.execute === 'true';
        if (wantsExecute && hasResultado) {
          // Use onProcess with confirm path if provided (caller will likely
          // map to api.command.processWithConfirm). We check both to be safe.
          if (typeof (onProcess as any) === 'function') {
            // call backend to execute
            try {
              setIsProcessing(true);
              await (onProcess as any)(command, true);
              // Clear UI after successful execution
              setCommand('');
              setResult(null);
            } catch (e) {
              console.error('Auto-execute via onProcess failed', e);
            } finally {
              setIsProcessing(false);
            }
          } else if (onConfirm) {
            // fallback: call onConfirm (local create)
            try {
              onConfirm((response as any).resultado);
              setCommand('');
              setResult(null);
            } catch (e) {
              console.error('Auto-confirm failed', e);
            }
          }
        }
      } catch (e) {
        console.error('Error in auto-execute logic', e);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el comando');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (result && onConfirm) {
      onConfirm(result.resultado);
      setCommand('');
      setResult(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleProcess();
    }
  };

  const handleVoiceInput = () => {
    if (!isVoiceSupported) {
      toast.error('Tu navegador no soporta entrada por voz. Prueba con Chrome o Edge.');
      return;
    }
    
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Start listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          toast.error('Error al iniciar el reconocimiento de voz');
        }
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Centro de Comandos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Escribe en lenguaje natural lo que quieres hacer. Por ejemplo: "Agendar cita con el
          dentista el martes a las 4pm"
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Command input */}
        <div className="space-y-2">
          <div className="relative">
            <Textarea
              placeholder="Escribe o dicta tu comando aquí..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              disabled={isProcessing || isListening}
              className="resize-none pr-12"
            />
            {/* Voice input button */}
            <Button
              type="button"
              size="icon"
              variant={isListening ? "default" : "ghost"}
              className={`absolute bottom-2 right-2 h-8 w-8 ${
                isListening ? 'animate-pulse bg-destructive hover:bg-destructive/90' : ''
              }`}
              onClick={handleVoiceInput}
              disabled={isProcessing || !isVoiceSupported}
              title={isListening ? 'Detener grabación' : 'Dictar por voz'}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {isListening 
                ? '🎤 Escuchando... Habla ahora' 
                : 'Presiona Cmd/Ctrl + Enter para enviar o usa el micrófono'
              }
            </span>
            <Button
              onClick={handleProcess}
              disabled={!command.trim() || isProcessing || isListening}
              size="sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Procesar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Suggested commands */}
        {!result && !error && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Comandos sugeridos:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedCommands.map((suggested, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setCommand(suggested)}
                >
                  {suggested}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Result preview */}
        {result && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            {/* Display the actual LLM response first */}
            {result.respuesta && (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Respuesta del Agente:</p>
                  <p className="mt-2 whitespace-pre-wrap rounded bg-background p-3 text-sm text-foreground leading-relaxed">
                    {result.respuesta}
                  </p>
                </div>
              </div>
            )}

            {/* Only show structured cita preview if there's appointment data to create */}
            {result.resultado && typeof result.resultado === 'object' && 'titulo' in result.resultado && (
              <>
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm font-medium text-foreground mb-3">¿Quieres crear esta cita?</p>
                  <Card className="border-primary/40">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground">
                          {result.resultado.titulo || 'Nueva cita'}
                        </h4>
                        <div className="grid gap-2 text-sm">
                          {result.resultado.fecha && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(
                                  result.resultado.fecha + 'T00:00:00'
                                ).toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                                {result.resultado.hora_inicio && ` a las ${result.resultado.hora_inicio}`}
                              </span>
                            </div>
                          )}
                          {result.resultado.lugar && (
                            <p className="text-muted-foreground">📍 {result.resultado.lugar}</p>
                          )}
                          {result.resultado.descripcion && (
                            <p className="text-muted-foreground">{result.resultado.descripcion}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResult(null);
                      setCommand('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleConfirm}>
                    Confirmar
                  </Button>
                </div>
              </>
            )}

            {/* If there's NO structured data, just show close button */}
            {(!result.resultado || typeof result.resultado !== 'object' || !('titulo' in result.resultado)) && (
              <div className="flex justify-end gap-3 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResult(null);
                    setCommand('');
                  }}
                >
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
