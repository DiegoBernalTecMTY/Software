import React from 'react'

export function CitaCard({ cita, onEdit, onDelete }: any) {
  return (
    <div className="cita-card">
      <div>
        <strong>{cita.titulo}</strong>
        <div className="muted">{cita.fecha} · {cita.hora_inicio}</div>
      </div>
      <div className="actions">
        <button onClick={() => onEdit(cita)} className="btn small">Editar</button>
        <button onClick={() => onDelete(cita.objectId)} className="btn danger small">Eliminar</button>
      </div>
    </div>
  )
}
