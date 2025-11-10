import { useState } from 'react'

interface Props { onRegister: (nombre: string, email: string, password: string) => Promise<void>; onNavigateToLogin: () => void }

export function Register({ onRegister, onNavigateToLogin }: Props) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: any) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onRegister(nombre, email, password)
    } catch (err: any) {
      setError(err.message || 'Error al registrar')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <form onSubmit={submit} className="card">
        <h2>Crear cuenta</h2>
        <label>Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear cuenta'}</button>
        <p className="muted">¿Ya tienes cuenta? <button type="button" onClick={onNavigateToLogin} className="link">Inicia sesión</button></p>
      </form>
    </div>
  )
}
