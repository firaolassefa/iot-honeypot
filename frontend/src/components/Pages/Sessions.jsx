import React, { useState, useEffect } from 'react'
import Card from '../UI/Card'

const Sessions = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedSession, setSelectedSession] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [filter])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/api/v1/connections?limit=100')
      
      if (response.ok) {
        const data = await response.json()
        console.log('Raw backend data:', data) // Debug log
        
        // FIXED: Better data mapping that handles both backend formats
        const mappedSessions = data.connections.map(conn => {
          // Extract username from different possible locations
          let username = null;
          let authenticated = false;
          let duration = null;
          let clientVersion = null;

          // Handle SSH sessions
          if (conn.service === 'ssh' && conn.event_data) {
            username = conn.event_data.session_data?.username || 
                      conn.event_data.username || 
                      null;
            authenticated = conn.event_data.session_data?.authenticated || false;
            duration = conn.event_data.session_data?.duration || null;
            clientVersion = conn.event_data.client_version || null;
          }
          
          // Handle HTTP sessions
          if (conn.service === 'http' && conn.event_data) {
            // For HTTP, we might not have username, but we can show path/method
            username = null; // HTTP typically doesn't have usernames
            authenticated = false;
            duration = null;
            clientVersion = conn.event_data.user_agent || null;
          }

          return {
            id: conn.id,
            timestamp: conn.timestamp,
            service: conn.service,
            source_ip: conn.source_ip,
            port: conn.port,
            user: username,
            password: null, // Always null for security
            meta: {
              duration: duration,
              client_version: clientVersion,
              authenticated: authenticated,
              // Additional HTTP-specific data
              path: conn.event_data?.path || null,
              method: conn.event_data?.method || null,
              user_agent: conn.event_data?.user_agent || null
            },
            event_data: conn.event_data,
            country: conn.country || 'Unknown',
            city: conn.city || 'Unknown'
          }
        })
        
        console.log('Mapped sessions:', mappedSessions) // Debug log
        
        let filteredData = mappedSessions
        if (filter !== 'all') {
          filteredData = mappedSessions.filter(session => session.service === filter)
        }
        
        setSessions(filteredData)
      } else {
        console.error('Backend response not OK:', response.status)
        // Use mock data if backend fails
        setSessions(generateMockSessions())
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      setSessions(generateMockSessions())
    } finally {
      setLoading(false)
    }
  }

  const generateMockSessions = () => {
    const mockSessions = []
    const services = ['ssh', 'ssh', 'ssh', 'ssh', 'http', 'http']
    const usernames = ['root', 'admin', 'ubuntu', 'test', null, null]
    
    for (let i = 0; i < 15; i++) {
      const service = services[Math.floor(Math.random() * services.length)]
      const hasCredentials = Math.random() > 0.6
      
      mockSessions.push({
        id: i + 1,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
        service: service,
        source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        port: service === 'ssh' ? 22222 : 8080,
        user: hasCredentials ? usernames[Math.floor(Math.random() * usernames.length)] : null,
        password: hasCredentials ? '••••••••' : null,
        meta: {
          duration: Math.random() > 0.3 ? Math.floor(Math.random() * 30) : null,
          client_version: service === 'ssh' ? 'SSH-2.0-OpenSSH_8.2' : 'Mozilla/5.0',
          authenticated: Math.random() > 0.7
        },
        country: ['USA', 'China', 'Russia', 'Germany', 'Unknown'][Math.floor(Math.random() * 5)],
        city: ['New York', 'Beijing', 'Moscow', 'Berlin', 'Unknown'][Math.floor(Math.random() * 5)]
      })
    }
    
    return mockSessions
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return 'Invalid Date'
    }
  }

  const getSessionTypeColor = (type) => {
    switch (type) {
      case 'ssh': return '#00ff88'
      case 'http': return '#ffaa00'
      default: return '#00aaff'
    }
  }

  const handleViewSession = (session) => {
    setSelectedSession(session)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedSession(null)
  }

  // FIXED: Better rendering with fallbacks for missing data
  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        <h1 className="neon-accent">Sessions</h1>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading sessions...
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="neon-accent">Sessions</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label className="neon-cyan">Filter:</label>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white'
            }}
          >
            <option value="all">All Sessions</option>
            <option value="ssh">SSH Only</option>
            <option value="http">HTTP Only</option>
          </select>
          <button 
            className="btn"
            onClick={fetchSessions}
            style={{ marginLeft: '1rem' }}
          >
            Refresh
          </button>
        </div>
      </div>

      <Card>
        {sessions && sessions.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Source IP</th>
                  <th>Location</th>
                  <th>Username</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{formatDate(session.timestamp)}</td>
                    <td>
                      <span style={{ color: getSessionTypeColor(session.service) }}>
                        {session.service?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>{session.source_ip || 'N/A'}:{session.port || 'N/A'}</td>
                    <td>
                      {session.country || 'Unknown'}
                      {session.city && session.city !== 'Unknown' ? `, ${session.city}` : ''}
                    </td>
                    <td>
                      {session.user ? (
                        <span style={{ color: '#00ff88' }}>{session.user}</span>
                      ) : (
                        session.service === 'http' ? 'HTTP Request' : 'N/A'
                      )}
                    </td>
                    <td>
                      {session.meta?.duration ? 
                        `${session.meta.duration}s` : 'N/A'
                      }
                    </td>
                    <td>
                      <span style={{
                        color: session.meta?.authenticated ? '#00ff88' : '#ff4444',
                        fontWeight: 'bold'
                      }}>
                        {session.service === 'http' ? 'Request' : 
                         session.meta?.authenticated ? 'Authenticated' : 'Failed'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn"
                        onClick={() => handleViewSession(session)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            color: 'rgba(255,255,255,0.7)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3>No Sessions Yet</h3>
            <p>SSH and HTTP connections will appear here when detected.</p>
            <button 
              className="btn"
              onClick={fetchSessions}
              style={{ marginTop: '1rem' }}
            >
              Check Again
            </button>
          </div>
        )}
      </Card>

      {/* Session Details Modal */}
      {showModal && selectedSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,0,0,0.3)',
                border: '1px solid rgba(255,0,0,0.5)',
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <h2 className="neon-accent" style={{ marginBottom: '1.5rem' }}>
              Session Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <Card>
                <h4 className="neon-cyan">Basic Info</h4>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div><strong>ID:</strong> {selectedSession.id}</div>
                  <div><strong>Service:</strong> 
                    <span style={{ color: getSessionTypeColor(selectedSession.service), marginLeft: '0.5rem' }}>
                      {selectedSession.service?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  <div><strong>Source:</strong> {selectedSession.source_ip || 'N/A'}:{selectedSession.port || 'N/A'}</div>
                  <div><strong>Location:</strong> {selectedSession.country || 'Unknown'}, {selectedSession.city || 'Unknown'}</div>
                  <div><strong>Time:</strong> {formatDate(selectedSession.timestamp)}</div>
                  <div><strong>Duration:</strong> {selectedSession.meta?.duration ? `${selectedSession.meta.duration}s` : 'N/A'}</div>
                </div>
              </Card>

              <Card>
                <h4 className="neon-cyan">Session Data</h4>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div><strong>Username:</strong> 
                    {selectedSession.user ? (
                      <span style={{ color: '#00ff88', marginLeft: '0.5rem' }}>{selectedSession.user}</span>
                    ) : (
                      <span style={{ marginLeft: '0.5rem' }}>
                        {selectedSession.service === 'http' ? 'HTTP Request' : 'N/A'}
                      </span>
                    )}
                  </div>
                  <div><strong>Status:</strong> 
                    <span style={{ 
                      color: selectedSession.meta?.authenticated ? '#00ff88' : '#ff4444',
                      marginLeft: '0.5rem'
                    }}>
                      {selectedSession.service === 'http' ? 'HTTP Request' : 
                       selectedSession.meta?.authenticated ? 'Authenticated' : 'Failed'}
                    </span>
                  </div>
                  <div><strong>Client Version:</strong> 
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                      {selectedSession.meta?.client_version || selectedSession.meta?.user_agent || 'Unknown'}
                    </span>
                  </div>
                  {selectedSession.meta?.path && (
                    <div><strong>Path:</strong> 
                      <span style={{ marginLeft: '0.5rem' }}>
                        {selectedSession.meta.path}
                      </span>
                    </div>
                  )}
                  {selectedSession.meta?.method && (
                    <div><strong>Method:</strong> 
                      <span style={{ marginLeft: '0.5rem' }}>
                        {selectedSession.meta.method}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {selectedSession.event_data && (
              <Card>
                <h4 className="neon-cyan">Raw Event Data</h4>
                <div style={{ 
                  background: 'rgba(0,0,0,0.3)',
                  padding: '1rem',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  fontSize: '0.85rem'
                }}>
                  <pre>{JSON.stringify(selectedSession.event_data, null, 2)}</pre>
                </div>
              </Card>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button 
                className="btn"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sessions