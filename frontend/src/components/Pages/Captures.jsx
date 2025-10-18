import React, { useState, useEffect } from 'react'
import Card from '../UI/Card'

const Captures = () => {
  const [captures, setCaptures] = useState([])
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState(localStorage.getItem('token') || 'demo-token-12345')

  // Fetch captures from backend
  useEffect(() => {
    const fetchCaptures = async () => {
      setLoading(true)
      try {
        const response = await fetch('http://localhost:8000/api/v1/captures')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        setCaptures(data)
      } catch (error) {
        console.error('❌ Failed to fetch captures:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCaptures()
    const interval = setInterval(fetchCaptures, 10000) // Reduced to 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Helper to format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return 'Invalid Date'
    }
  }

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Handle file download with warning
  const handleDownload = async (captureId, filename) => {
    if (!window.confirm(
      `⚠️ SECURITY WARNING: The file "${filename}" may be malicious.\n\n` +
      `Do not execute it. Only download for analysis in a sandbox.\n\nProceed with download?`
    )) return
    
    try {
      // Since download endpoint isn't implemented, create a mock download
      const mockContent = `This is a mock file for: ${filename}\n\n` +
                         `Actual file download functionality requires backend implementation.\n` +
                         `File would be served from: /api/v1/captures/${captureId}/download`
      
      const blob = new Blob([mockContent], { type: 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed: ' + error.message)
    }
  }

  // Handle capture deletion with authentication
  const handleDelete = async (captureId) => {
    if (!window.confirm('Are you sure you want to delete this capture record?')) return
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/captures/${captureId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.status === 401) {
        // Token might be invalid, try to login and get a new token
        const newToken = await handleLogin()
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch(`http://localhost:8000/api/v1/captures/${captureId}`, { 
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          })
          if (!retryResponse.ok) throw new Error(`HTTP ${retryResponse.status}`)
        } else {
          throw new Error('Authentication failed')
        }
      } else if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      // Remove from local state
      setCaptures(prev => prev.filter(capture => capture.id !== captureId))
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Delete failed: ' + error.message)
    }
  }

  // Handle login to get token
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

  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        <h1 className="neon-accent">File Captures</h1>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading captures...
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="neon-accent">File Captures</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="neon-cyan">
            {captures.length} capture{captures.length !== 1 ? 's' : ''}
          </span>
          <button 
            className="btn"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>

      <Card>
        {captures.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Source IP</th>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Files</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {captures.map((capture) => {
                  const fileCount = capture.files ? capture.files.length : 0
                  return (
                    <tr key={capture.id}>
                      <td>{formatDate(capture.ts)}</td>
                      <td>
                        <code>{capture.src_ip}:{capture.src_port}</code>
                      </td>
                      <td>
                        <span style={{ 
                          color: capture.method === 'POST' ? '#ff4444' : '#00aaff',
                          fontWeight: 'bold'
                        }}>
                          {capture.method}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem' }}>
                          {capture.http_path}
                        </code>
                      </td>
                      <td>
                        {fileCount > 0 ? (
                          <div>
                            <strong>{fileCount} file{fileCount !== 1 ? 's' : ''}</strong>
                            {capture.files.map((file, index) => (
                              <div key={index} style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                • {file.filename} ({formatFileSize(file.size)})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>No files</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {fileCount > 0 && (
                            <>
                              {capture.files.map((file, index) => (
                                <button 
                                  key={index}
                                  className="btn"
                                  onClick={() => handleDownload(capture.id, file.filename)}
                                  style={{ marginBottom: '0.25rem' }}
                                >
                                  Download {file.filename}
                                </button>
                              ))}
                            </>
                          )}
                          <button 
                            className="btn btn-danger"
                            onClick={() => handleDelete(capture.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            color: 'rgba(255,255,255,0.7)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
            <h3>No File Captures Yet</h3>
            <p>Uploaded files will appear here when detected by the HTTP honeypot.</p>
            <div style={{ marginTop: '2rem', textAlign: 'left', background: 'rgba(0,170,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
              <strong>Test the file capture:</strong>
              <code style={{ display: 'block', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)' }}>
                curl -X POST http://localhost:8080/upload -F "file=@/path/to/file.txt"
              </code>
            </div>
          </div>
        )}
      </Card>

      {/* Security Warning */}
      <Card style={{ marginTop: '2rem', background: 'rgba(255,0,0,0.1)', borderColor: 'rgba(255,0,0,0.3)' }}>
        <h3 style={{ color: '#ff4444', marginBottom: '1rem' }}>⚠️ Security Warning</h3>
        <p>
          All captured files are potentially malicious. Do not execute any downloaded files on production systems. 
          Always use isolated analysis environments with proper security controls.
        </p>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          <strong>Note:</strong> File download functionality is currently mocked. Implement proper file serving in the backend for production use.
        </p>
      </Card>
    </div>
  )
}

export default Captures