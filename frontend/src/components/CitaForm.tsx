import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import type { Cita } from '../utils/api';

interface CitaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Cita>) => Promise<void>;
  initialData?: Cita | null;
  mode?: 'create' | 'edit';
}

export function CitaForm({
  open,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
}: CitaFormProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    fecha: '',
    hora_inicio: '',
    lugar: '',
    descripcion: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        titulo: initialData.titulo || '',
        fecha: initialData.fecha || '',
        hora_inicio: initialData.hora_inicio || '',
        lugar: initialData.lugar || '',
        descripcion: initialData.descripcion || '',
      });
    } else {
      setFormData({
        titulo: '',
        fecha: '',
        hora_inicio: '',
        lugar: '',
        descripcion: '',
      });
    }
    setErrors({});
  }, [initialData, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es obligatoria';
    } else {
      // Check if date is valid
      const dateObj = new Date(formData.fecha + 'T00:00:00');
      if (isNaN(dateObj.getTime())) {
        newErrors.fecha = 'Fecha inválida';
      }
    }

    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'La hora es obligatoria';
    } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.hora_inicio)) {
      newErrors.hora_inicio = 'Formato de hora inválido (HH:MM)';
    }

    if (!formData.lugar.trim()) {
      newErrors.lugar = 'El lugar es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      setErrors({
        submit: error.message || 'Error al guardar la cita',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear nueva cita' : 'Editar cita'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Completa los detalles de tu nueva cita.'
              : 'Actualiza los detalles de tu cita.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titulo"
              name="titulo"
              placeholder="Ej: Revisión dental"
              value={formData.titulo}
              onChange={handleChange}
              className={errors.titulo ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.titulo && (
              <p className="text-xs text-destructive">{errors.titulo}</p>
            )}
          </div>

          {/* Fecha y Hora */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fecha">
                Fecha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleChange}
                className={errors.fecha ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.fecha && (
                <p className="text-xs text-destructive">{errors.fecha}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora_inicio">
                Hora <span className="text-destructive">*</span>
              </Label>
              <Input
                id="hora_inicio"
                name="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={handleChange}
                className={errors.hora_inicio ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.hora_inicio && (
                <p className="text-xs text-destructive">{errors.hora_inicio}</p>
              )}
            </div>
          </div>

          {/* Lugar */}
          <div className="space-y-2">
            <Label htmlFor="lugar">
              Lugar <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lugar"
              name="lugar"
              placeholder="Ej: Consultorio Dr. García"
              value={formData.lugar}
              onChange={handleChange}
              className={errors.lugar ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.lugar && (
              <p className="text-xs text-destructive">{errors.lugar}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              placeholder="Agrega detalles adicionales..."
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Guardando...'
                : mode === 'create'
                ? 'Crear cita'
                : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
