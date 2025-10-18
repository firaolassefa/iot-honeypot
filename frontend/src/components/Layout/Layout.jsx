import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const Layout = ({ children, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const menuItems = [
    { path: '/overview', label: 'Overview', icon: '📊' },
    { path: '/sessions', label: 'Sessions', icon: '🔒' },
    { path: '/captures', label: 'File Captures', icon: '📁' },
    { path: '/map', label: 'Attack Map', icon: '🗺️' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #0f1720 0%, #0b0f14 100%)',
      color: 'white'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.5rem',
            background: 'linear-gradient(45deg, #00aaff, #00ff88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🛡️ ThreatView
          </h1>
          <span style={{
            fontSize: '0.875rem',
            background: 'rgba(255,0,0,0.2)',
            color: '#ff4444',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255,0,0,0.3)'
          }}>
            HONEYPOT DASHBOARD
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn btn-danger"
            onClick={onLogout}
            style={{ fontSize: '0.875rem' }}
          >
            Logout
          </button>
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '4px',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ☰
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        {/* Sidebar */}
        <nav style={{
          width: '250px',
          background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          padding: '2rem 0',
          display: isMobileMenuOpen ? 'block' : { xs: 'none', md: 'block' }
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  textDecoration: 'none',
                  color: isActive(item.path) ? '#00ff88' : 'rgba(255,255,255,0.7)',
                  background: isActive(item.path) ? 'rgba(0,255,136,0.1)' : 'transparent',
                  borderRight: isActive(item.path) ? '3px solid #00ff88' : '3px solid transparent',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.background = 'rgba(255,255,255,0.05)'
                    e.target.style.color = '#00aaff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.background = 'transparent'
                    e.target.style.color = 'rgba(255,255,255,0.7)'
                  }
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                <span style={{ fontWeight: isActive(item.path) ? 'bold' : 'normal' }}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* System Status */}
          <div style={{
            margin: '2rem 1.5rem 0',
            padding: '1rem',
            background: 'rgba(0,170,255,0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(0,170,255,0.3)'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#00aaff' }}>System Status</h4>
            <div style={{ fontSize: '0.875rem' }}>
              <div>🟢 Backend: Online</div>
              <div>🟢 SSH Honeypot: Running</div>
              <div>🟢 HTTP Honeypot: Running</div>
              <div>🟡 Database: Connected</div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ 
          flex: 1,
          padding: '2rem',
          overflow: 'auto'
        }}>
          {children}
        </main>
      </div>

      <style>
        {`
          @media (max-width: 768px) {
            nav {
              position: fixed;
              top: 80px;
              left: 0;
              right: 0;
              bottom: 0;
              z-index: 1000;
              display: none;
            }
            
            button[style*="display: none"] {
              display: flex !important;
            }
            
            main {
              padding: 1rem;
            }
          }
        `}
      </style>
    </div>
  )
}

export default Layout