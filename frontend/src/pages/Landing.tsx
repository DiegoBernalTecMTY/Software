import React from 'react'

interface Props { onNavigateToLogin: () => void; onNavigateToRegister: () => void }

export function Landing({ onNavigateToLogin, onNavigateToRegister }: Props) {
  return (
    <div className="auth-page">
      <div className="card" style={{ maxWidth: 900 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <h1>MNA — Agente de Citas</h1>
            <p className="muted">Organiza tus citas rápidamente usando comandos en lenguaje natural o crea citas manualmente. Seguro y sencillo.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="btn" onClick={onNavigateToLogin}>Iniciar sesión</button>
              <button className="btn ghost" onClick={onNavigateToRegister}>Crear cuenta</button>
            </div>
          </div>
          <div style={{ width: 300 }}>
            {/* Prefer PNG if present, fall back to SVG */}
            <img
              src="/assets/illustration-landing.png"
              alt="Ilustración de calendario"
              style={{ width: '100%' }}
              onError={(e) => {
                try {
                  (e.target as HTMLImageElement).src = '/assets/illustration-landing.svg'
                } catch (_) {}
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
