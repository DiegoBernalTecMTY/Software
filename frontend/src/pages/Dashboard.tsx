import React, { useState } from 'react'
import { Header } from '../components/Header'
import { CommandComposer } from '../components/CommandComposer'
import { CitaForm } from '../components/CitaForm'
import { CitaCard } from '../components/CitaCard'

export function Dashboard({ user, citas, isLoading, onCreateCita, onUpdateCita, onDeleteCita, onProcessCommand, onLogout }: any) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <main className="container">
        <section className="pane">
          <h2>Comando rápido</h2>
          <CommandComposer onProcess={onProcessCommand} />
        </section>

        <section className="pane">
          <div className="row">
            <h2>Citas</h2>
            <div>
              <button className="btn" onClick={() => setShowForm(s => !s)}>{showForm ? 'Cerrar' : 'Crear cita'}</button>
            </div>
          </div>
          {showForm && <CitaForm onSave={async (p: any) => { await onCreateCita(p); setShowForm(false) }} onCancel={() => setShowForm(false)} />}

          <div className="list">
            {isLoading ? <div>Loading...</div> : (citas && citas.length ? citas.map((c: any) => (
              <CitaCard key={c.objectId} cita={c} onEdit={() => {}} onDelete={onDeleteCita} />
            )) : <div className="empty">Aún no tienes citas.</div>)}
          </div>
        </section>
      </main>
    </div>
  )
}
