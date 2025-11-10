import { useState } from 'react'

interface Props { onLogin: (email: string, password: string) => Promise<void>; onNavigateToRegister: () => void }

export function Login({ onLogin, onNavigateToRegister }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: any) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <form onSubmit={submit} className="card">
        <h2>MNA — Iniciar sesión</h2>
        <label>Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Iniciando...' : 'Ingresar'}</button>
        <p className="muted">¿No tienes cuenta? <button type="button" onClick={onNavigateToRegister} className="link">Regístrate</button></p>
      </form>
    </div>
  )
}
