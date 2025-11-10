import React from 'react'

export function CitaDetail({ cita, onBack, onUpdateCita, onDeleteCita }: any) {
  if (!cita) return <div className="container">Cita no encontrada</div>
  return (
    <div className="container">
      <button className="btn ghost" onClick={onBack}>Volver</button>
      <h2>{cita.titulo}</h2>
      <div>{cita.fecha} · {cita.hora_inicio}</div>
      <div>{cita.lugar}</div>
      <p>{cita.descripcion}</p>
      <div className="actions">
        <button className="btn" onClick={() => onUpdateCita(cita.objectId, { /* example */ })}>Editar</button>
        <button className="btn danger" onClick={() => onDeleteCita(cita.objectId)}>Eliminar</button>
      </div>
    </div>
  )
}
