import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Calendar, List, ChevronRight, Loader2, Mic, MicOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { Confetti } from '../components/Confetti';
import { toast } from 'sonner@2.0.3';
import type { Cita, CommandResponse } from '../utils/api';

interface DashboardProps {
  citas: Cita[];
  onProcessCommand: (texto: string) => Promise<CommandResponse>;
  onNavigate: (page: string, params?: any) => void;
  userName?: string;
}

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export function Dashboard({ citas, onProcessCommand, onNavigate, userName }: DashboardProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Welcome message on mount
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'agent',
      content: `¡Hola${userName ? ` ${userName.split(' ')[0]}` : ''}! 👋 Soy tu asistente de citas personal. Puedo ayudarte a agendar, buscar o gestionar tus reuniones. ¿Qué te gustaría hacer hoy?`,
      timestamp: new Date(),
      suggestions: [
        'Agendar una cita para mañana',
        'Mostrar mis próximas citas',
        'Cancelar una reunión',
        'Ver mi calendario de esta semana',
      ],
    };
    setMessages([welcomeMessage]);
  }, [userName]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

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
        setInput(transcript);
        
        // If it's the final result, show success message
        if (event.results[0].isFinal) {
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

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Process command through backend
      const response = await onProcessCommand(input.trim());

      // Simulate a brief delay for natural conversation feel
      await new Promise((resolve) => setTimeout(resolve, 500));

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        // Use agent response only; do not fall back to a hardcoded string.
        content: response.respuesta,
        timestamp: new Date(),
        suggestions: getSuggestionsBasedOnContext(response),
      };

      setMessages((prev) => [...prev, agentMessage]);
      
      // Show confetti for successful actions
      if (response.exito) {
        setShowConfetti(true);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: 'Lo siento, tuve un problema procesando tu solicitud. ¿Podrías intentar reformularla?',
        timestamp: new Date(),
        suggestions: [
          'Agendar una cita',
          'Ver mis citas',
          'Ir a la vista de aplicación',
        ],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  const getSuggestionsBasedOnContext = (response: CommandResponse): string[] => {
    // Return contextual suggestions based on the response
    if (response.exito) {
      return [
        'Ver todas mis citas',
        '¿Qué tengo para mañana?',
        'Ir a la vista de aplicación',
      ];
    }
    return [
      'Agendar una nueva cita',
      'Mostrar calendario',
      'Ver citas de hoy',
    ];
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

  const upcomingCount = citas.filter((cita) => {
    const citaDateTime = new Date(`${cita.fecha}T${cita.hora_inicio}:00`);
    return citaDateTime > new Date();
  }).length;

  return (
    <>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="flex h-[calc(100vh-4rem)] bg-transparent">
        {/* Agent chat section - Left */}
        <div className="flex flex-1 flex-col">
        {/* Main container */}
        <div className="flex h-full w-full flex-1 flex-col">
          {/* Quick stats bar */}
          <div className="border-b border-primary/20 bg-white/60 dark:bg-slate-900/80 backdrop-blur-lg px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-gradient-primary p-1.5 shadow-glow-primary">
                    <Calendar className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground dark:text-cyan-50">
                    {upcomingCount} {upcomingCount === 1 ? 'cita próxima' : 'citas próximas'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('app-dashboard')}
                  className="text-xs hover:bg-primary/10 dark:hover:bg-primary/20 dark:text-cyan-50"
                >
                  <List className="mr-1.5 h-3.5 w-3.5" />
                  Vista de aplicación
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('citas')}
                  className="text-xs hover:bg-primary/10 dark:hover:bg-primary/20 dark:text-cyan-50"
                >
                  <Calendar className="mr-1.5 h-3.5 w-3.5" />
                  Todas las citas
                </Button>
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                >
                  <div
                    className={`max-w-[85%] space-y-2 ${
                      message.type === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Message bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-md transition-all duration-300 ${
                        message.type === 'user'
                          ? 'gradient-primary text-white shadow-glow-primary'
                          : 'bg-white dark:bg-slate-800 border border-primary/10 dark:border-primary/30'
                      }`}
                    >
                      {message.type === 'agent' && (
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full gradient-secondary shadow-glow-secondary">
                            <Sparkles className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-secondary dark:text-purple-300">
                            Asistente
                          </span>
                        </div>
                      )}
                      <p className={`whitespace-pre-wrap text-sm leading-relaxed ${
                        message.type === 'agent' ? 'text-foreground dark:text-slate-100' : ''
                      }`}>
                        {message.content}
                      </p>
                    </div>

                    {/* Suggestions */}
                    {message.type === 'agent' && message.suggestions && (
                      <div className="flex flex-wrap gap-2 pl-8">
                        {message.suggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="h-auto rounded-full border-primary/30 dark:border-primary/40 bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 px-3 py-1.5 text-xs font-medium transition-all hover:border-primary hover:shadow-md hover:scale-105 dark:text-cyan-50 dark:hover:bg-primary/20"
                          >
                            {suggestion}
                            <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex justify-start animate-slide-up">
                  <div className="max-w-[85%]">
                    <div className="rounded-2xl border border-primary/20 bg-white px-4 py-3 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full gradient-primary">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          Procesando tu solicitud...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-primary/20 bg-white/60 dark:bg-slate-900/80 backdrop-blur-lg p-4 shadow-lg">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-end gap-3">
                {/* Voice input button - Left */}
                <Button
                  type="button"
                  size="icon"
                  variant={isListening ? "default" : "outline"}
                  className={`h-[52px] w-[52px] shrink-0 rounded-full transition-all duration-300 ${
                    isListening 
                      ? 'animate-pulse gradient-success text-white shadow-glow-primary scale-110' 
                      : 'border-primary/30 dark:border-primary/40 hover:border-primary hover:shadow-md hover:scale-105 dark:text-cyan-300'
                  }`}
                  onClick={handleVoiceInput}
                  disabled={isProcessing || !isVoiceSupported}
                  title={isListening ? 'Detener grabación' : 'Dictar por voz'}
                >
                  {isListening ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
                
                {/* Text input area */}
                <div className="relative flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe o dicta tu solicitud aquí... (ej: 'Agendar reunión con el doctor mañana a las 3pm')"
                    className="min-h-[52px] max-h-[200px] resize-none pr-14 text-sm border-primary/20 dark:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-slate-800 dark:text-slate-100 shadow-sm"
                    disabled={isProcessing || isListening}
                    rows={1}
                  />
                  {/* Send button - Right */}
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || isProcessing || isListening}
                    className="absolute bottom-2 right-2 h-9 w-9 rounded-full gradient-primary shadow-md hover:shadow-glow-primary transition-all duration-300 hover:scale-110"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-center text-xs font-medium text-muted-foreground dark:text-slate-400">
                {isListening 
                  ? '🎤 Escuchando... Habla ahora' 
                  : 'Presiona Enter para enviar, Shift+Enter para nueva línea, o usa el micrófono'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications panel - Right */}
      <div className="w-80 hidden lg:block">
        <NotificationsPanel citas={citas} onNavigate={onNavigate} />
      </div>
      </div>
    </>
  );
}
