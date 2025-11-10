import { useState } from 'react';
import { Send, Sparkles, Calendar, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
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

  const suggestedCommands = [
    'Agendar cita con el dentista el martes a las 4pm',
    'Revisar mis citas de esta semana',
    'Crear reunión con el equipo mañana a las 10am',
    'Recordatorio: cita médica viernes',
  ];

  const handleProcess = async () => {
    if (!command.trim()) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await onProcess(command);
      setResult(response);
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
          <Textarea
            placeholder="Escribe tu comando aquí..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={isProcessing}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Presiona Cmd/Ctrl + Enter para enviar
            </span>
            <Button
              onClick={handleProcess}
              disabled={!command.trim() || isProcessing}
              size="sm"
            >
              <Send className="mr-2 h-4 w-4" />
              {isProcessing ? 'Procesando...' : 'Procesar'}
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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Interpretación sugerida:</p>
                <p className="mt-1 text-sm text-muted-foreground">{result.mensaje}</p>
              </div>
            </div>

            {/* Cita result preview */}
            {result.resultado && (
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
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
