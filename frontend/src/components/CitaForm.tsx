import React, { useState } from 'react'

export function CitaForm({ initial = {}, onSave, onCancel }: any) {
  const [titulo, setTitulo] = useState(initial.titulo || '')
  const [fecha, setFecha] = useState(initial.fecha || '')
  const [hora, setHora] = useState(initial.hora_inicio || '')
  const [lugar, setLugar] = useState(initial.lugar || '')
  const [descripcion, setDescripcion] = useState(initial.descripcion || '')

  const submit = (e: any) => {
    e.preventDefault();
    onSave({ titulo, fecha, hora_inicio: hora, lugar, descripcion })
  }

  return (
    <form onSubmit={submit} className="card">
      <label>Título<input value={titulo} onChange={(e) => setTitulo(e.target.value)} required /></label>
      <label>Fecha<input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required /></label>
      <label>Hora inicio<input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required /></label>
      <label>Lugar<input value={lugar} onChange={(e) => setLugar(e.target.value)} /></label>
      <label>Descripción<textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></label>
      <div className="actions">
        <button type="submit" className="btn">Guardar</button>
        <button type="button" onClick={onCancel} className="btn ghost">Cancelar</button>
      </div>
    </form>
  )
}
