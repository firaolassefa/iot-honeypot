import React, { useState } from 'react'
import Card from '../UI/Card'

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        onLogin(data.access_token)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Login failed')
      }
    } catch (err) {
      setError('Network error: Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #0f1720 0%, #0b0f14 100%)'
    }}>
      <Card style={{ width: '400px', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }} className="neon-accent">
          Honeypot Dashboard
        </h2>
        
        {error && (
          <div style={{ 
            padding: '1rem', 
            background: 'rgba(255,0,0,0.1)', 
            border: '1px solid rgba(255,0,0,0.3)',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: '#ff4444'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00aaff' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white'
              }}
              placeholder="admin"
              required
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00aaff' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white'
              }}
              placeholder="honeypot123"
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: 'rgba(255,255,0,0.1)', 
          borderRadius: '8px',
          border: '1px solid rgba(255,255,0,0.3)',
          fontSize: '0.875rem'
        }}>
          <strong>Default Credentials:</strong><br/>
          Username: <code>admin</code><br/>
          Password: <code>honeypot123</code>
        </div>

        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: 'rgba(255,0,0,0.1)', 
          borderRadius: '8px',
          border: '1px solid rgba(255,0,0,0.3)',
          fontSize: '0.875rem'
        }}>
          <strong>Security Notice:</strong> Change default credentials in production. Run in isolated networks only.
        </div>
      </Card>
    </div>
  )
}

export default Login