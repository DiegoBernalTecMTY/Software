import React from 'react'

export function Header({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <header className="app-header">
      <div className="container">
        <h1 className="brand">MNA</h1>
        <div className="spacer" />
        <div className="user">
          <span className="name">{user?.nombre || user?.email}</span>
          <button onClick={onLogout} className="btn small">Cerrar sesión</button>
        </div>
      </div>
    </header>
  )
}
