from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional


class CitaModel(BaseModel):
    titulo: Optional[str] = Field(None, description="Título de la cita")
    fecha: Optional[str] = Field(None, description="Fecha YYYY-MM-DD")
    hora_inicio: Optional[str] = Field(None, description="Hora HH:MM")
    lugar: Optional[str] = Field(None, description="Lugar de la cita")
    descripcion: Optional[str] = Field(None, description="Descripción opcional")


class CommandOutput(BaseModel):
    action: str = Field(..., description="create|update|delete|list|clarify|none")
    mensaje: Optional[str] = Field(None, description="Interpretación en español")
    resultado: Optional[CitaModel] = Field(None, description="Datos de la cita si aplica (para create or full update)")
    updates: Optional[dict] = Field(None, description="Campos a actualizar para 'update' (partial update)")
    target_id: Optional[str] = Field(None, description="ID objetivo para update/delete")
    query: Optional[str] = Field(None, description="Query libre para list/clarify actions when id unknown")
    candidates: Optional[list] = Field(None, description="Lista opcional de candidatos cuando hay ambigüedad")
    clarify_questions: Optional[list] = Field(None, description="Preguntas de clarificación sugeridas por el modelo")
