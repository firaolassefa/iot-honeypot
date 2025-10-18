import React, { useState, useEffect } from 'react'
import Card from '../UI/Card'

const Settings = () => {
  const [settings, setSettings] = useState({
    geoip_enabled: true,
    email_alerts_enabled: false,
    smtp_configured: false,
    bind_addr: '0.0.0.0',
    ports: {
      ssh: 22222,
      http: 8080,
      backend: 8000,
      frontend: 3000
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || 'demo-token-12345')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        console.error('Failed to fetch settings, using defaults')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    setSaveStatus(null)
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setSaveStatus({ type: 'success', message: 'Settings saved successfully!' })
      } else if (response.status === 401) {
        // Try to re-authenticate
        const newToken = await handleLogin()
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch('http://localhost:8000/api/v1/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`
            },
            body: JSON.stringify(settings)
          })
          if (retryResponse.ok) {
            setSaveStatus({ type: 'success', message: 'Settings saved successfully!' })
          } else {
            throw new Error('Failed to save settings after re-authentication')
          }
        } else {
          throw new Error('Authentication failed')
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Save failed:', error)
      setSaveStatus({ type: 'error', message: 'Failed to save settings: ' + error.message })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveStatus(null), 5000)
    }
  }

  const handleTestEmail = async () => {
    setSaving(true)
    setTestEmailResult(null)
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/settings/test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTestEmailResult(data)
      } else if (response.status === 401) {
        const newToken = await handleLogin()
        if (newToken) {
          const retryResponse = await fetch('http://localhost:8000/api/v1/settings/test-email', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          })
          if (retryResponse.ok) {
            const data = await retryResponse.json()
            setTestEmailResult(data)
          } else {
            throw new Error('Failed to test email after re-authentication')
          }
        } else {
          throw new Error('Authentication failed')
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Test email failed:', error)
      setTestEmailResult({ 
        success: false, 
        message: 'Failed to test email: ' + error.message 
      })
    } finally {
      setSaving(false)
      setTimeout(() => setTestEmailResult(null), 5000)
    }
  }

  const handleServiceControl = async (service, action) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/control/${service}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${service} ${action}: ${data.message}`)
      } else if (response.status === 401) {
        const newToken = await handleLogin()
        if (newToken) {
          const retryResponse = await fetch(`http://localhost:8000/api/v1/control/${service}/${action}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          })
          if (retryResponse.ok) {
            const data = await retryResponse.json()
            alert(`${service} ${action}: ${data.message}`)
          } else {
            throw new Error('Service control failed after re-authentication')
          }
        } else {
          throw new Error('Authentication failed')
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      alert('Service control failed: ' + error.message)
    }
  }

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'honeypot123'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newToken = data.access_token
        setToken(newToken)
        localStorage.setItem('token', newToken)
        return newToken
      } else {
        throw new Error('Login failed')
      }
    } catch (error) {
      console.error('Login failed:', error)
      alert('Authentication required. Please log in again.')
      return null
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePortChange = (portKey, value) => {
    const portValue = parseInt(value)
    if (portValue >= 1 && portValue <= 65535) {
      setSettings(prev => ({
        ...prev,
        ports: {
          ...prev.ports,
          [portKey]: portValue
        }
      }))
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        <h1 className="neon-accent">Settings</h1>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading settings...
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h1 className="neon-accent" style={{ marginBottom: '2rem' }}>Settings</h1>

      {/* Save Status */}
      {saveStatus && (
        <Card style={{ 
          background: saveStatus.type === 'success' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
          borderColor: saveStatus.type === 'success' ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)',
          marginBottom: '1rem'
        }}>
          <p style={{ 
            color: saveStatus.type === 'success' ? '#00ff88' : '#ff4444',
            margin: 0
          }}>
            {saveStatus.message}
          </p>
        </Card>
      )}

      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Service Control */}
        <Card>
          <h3 className="neon-cyan" style={{ marginBottom: '1rem' }}>Service Control</h3>
          <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>
            Control the honeypot services
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn"
              onClick={() => handleServiceControl('ssh', 'restart')}
            >
              Restart SSH Honeypot
            </button>
            <button 
              className="btn"
              onClick={() => handleServiceControl('http', 'restart')}
            >
              Restart HTTP Honeypot
            </button>
            <button 
              className="btn"
              onClick={() => handleServiceControl('backend', 'restart')}
            >
              Restart Backend
            </button>
          </div>
        </Card>

        {/* GeoIP Settings */}
        <Card>
          <h3 className="neon-cyan" style={{ marginBottom: '1rem' }}>GeoIP Configuration</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              id="geoip-enabled"
              checked={settings.geoip_enabled}
              onChange={(e) => handleSettingChange('geoip_enabled', e.target.checked)}
            />
            <label htmlFor="geoip-enabled">Enable GeoIP Lookups</label>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
            {settings.geoip_enabled ? 
              'GeoIP is enabled. Attack sources will be shown on the map.' :
              'GeoIP is disabled. Enable and provide GeoLite2 database for map functionality.'
            }
          </p>
        </Card>

        {/* Email Alerts */}
        <Card>
          <h3 className="neon-cyan" style={{ marginBottom: '1rem' }}>Email Alerts</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              id="email-alerts-enabled"
              checked={settings.email_alerts_enabled}
              onChange={(e) => handleSettingChange('email_alerts_enabled', e.target.checked)}
            />
            <label htmlFor="email-alerts-enabled">Enable Email Alerts</label>
          </div>
          
          <div style={{ 
            padding: '1rem', 
            background: settings.smtp_configured ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
            border: `1px solid ${settings.smtp_configured ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)'}`,
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <strong>SMTP Status:</strong> {settings.smtp_configured ? 'Configured' : 'Not Configured'}
          </div>

          <div>
            <button 
              className="btn"
              onClick={handleTestEmail}
              disabled={saving}
            >
              {saving ? 'Testing...' : 'Test Email Configuration'}
            </button>
            
            {testEmailResult && (
              <div style={{ 
                marginTop: '1rem',
                padding: '0.5rem',
                background: testEmailResult.success ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                border: `1px solid ${testEmailResult.success ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)'}`,
                borderRadius: '4px'
              }}>
                {testEmailResult.message}
              </div>
            )}
          </div>
        </Card>

        {/* Network Configuration */}
        <Card>
          <h3 className="neon-cyan" style={{ marginBottom: '1rem' }}>Network Configuration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00aaff' }}>
                Bind Address
              </label>
              <input
                type="text"
                value={settings.bind_addr}
                onChange={(e) => handleSettingChange('bind_addr', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00aaff' }}>
                SSH Port
              </label>
              <input
                type="number"
                value={settings.ports.ssh}
                onChange={(e) => handlePortChange('ssh', e.target.value)}
                min="1"
                max="65535"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00aaff' }}>
                HTTP Port
              </label>
              <input
                type="number"
                value={settings.ports.http}
                onChange={(e) => handlePortChange('http', e.target.value)}
                min="1"
                max="65535"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="neon-cyan">Save Configuration</h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>
                Apply your settings changes
              </p>
            </div>
            <button 
              className="btn"
              onClick={handleSaveSettings}
              disabled={saving}
              style={{ minWidth: '120px' }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </Card>

        {/* Security Warning */}
        <Card style={{ background: 'rgba(255,0,0,0.1)', borderColor: 'rgba(255,0,0,0.3)' }}>
          <h3 style={{ color: '#ff4444', marginBottom: '1rem' }}>⚠️ Security Configuration Notice</h3>
          <p style={{ marginBottom: '1rem' }}>
            Most settings are configured via environment variables and require container restart to take effect.
            For production deployment:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Change default credentials in the backend configuration</li>
            <li>Use isolated network segments</li>
            <li>Regularly update GeoIP databases</li>
            <li>Monitor and rotate access tokens</li>
            <li>Never expose honeypot services to the public internet</li>
          </ul>
          <p>
            Settings shown here are read from the backend. Some changes may require backend service restart.
          </p>
        </Card>
      </div>
    </div>
  )
}

export default Settings