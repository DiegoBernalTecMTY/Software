import React from 'react'
import { CitaCard } from '../components/CitaCard'

export function CitasList({ citas, isLoading, onUpdateCita, onDeleteCita }: any) {
  return (
    <div className="container">
      <h2>Citas</h2>
      <div className="list">
        {isLoading ? <div>Loading...</div> : (citas && citas.length ? citas.map((c: any) => (
          <CitaCard key={c.objectId} cita={c} onEdit={() => {}} onDelete={onDeleteCita} />
        )) : <div className="empty">No hay citas.</div>)}
      </div>
    </div>
  )
}
