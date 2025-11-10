import React, { useState } from 'react'

export function CommandComposer({ onProcess }: any) {
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const submit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await onProcess(texto)
      setResult(r)
    } catch (err: any) {
      setResult({ error: err.message || 'Error' })
    } finally { setLoading(false) }
  }

  return (
    <div className="command">
      <form onSubmit={submit} className="card">
        <label>Comando natural
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej: Agenda una revisión dental para el martes a las 4pm" />
        </label>
        <div className="actions">
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Procesando...' : 'Procesar'}</button>
        </div>
      </form>
      {result && <pre className="result">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  )
}
