import React, { useState, useEffect } from 'react'
import Card from '../UI/Card'
import LiveLogs from '../UI/LiveLogs'

const Overview = () => {
  const [stats, setStats] = useState({
    total_events: 0,
    total_captures: 0,
    unique_attackers: 0,
    services: {},
    top_countries: [],
    recent_activity: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      setError(null)
      const response = await fetch('http://localhost:8000/api/v1/stats')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setError(error.message)
      // Set mock data for demo
      setStats({
        total_events: 42,
        total_captures: 8,
        unique_attackers: 15,
        services: { ssh: 28, http: 14 },
        top_countries: [
          { country: 'USA', count: 12 },
          { country: 'China', count: 8 },
          { country: 'Russia', count: 6 },
          { country: 'Germany', count: 4 }
        ],
        recent_activity: [
          { date: '2024-01-01', count: 5 },
          { date: '2024-01-02', count: 8 },
          { date: '2024-01-03', count: 12 }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate derived stats
  const sshConnections = stats.services?.ssh || 0
  const httpConnections = stats.services?.http || 0
  const totalConnections = stats.total_events || 0
  const uniqueIPs = stats.unique_attackers || 0
  const totalCaptures = stats.total_captures || 0

  // Calculate recent activity (last 24 hours)
  const recentConnections24h = stats.recent_activity?.reduce((sum, day) => sum + day.count, 0) || 0

  const getActivityLevel = () => {
    const totalRecent = recentConnections24h
    if (totalRecent === 0) return 'quiet'
    if (totalRecent < 5) return 'low'
    if (totalRecent < 20) return 'medium'
    return 'high'
  }

  const getActivityColor = (level) => {
    switch (level) {
      case 'quiet': return '#00aaff'
      case 'low': return '#00ff88'
      case 'medium': return '#ffaa00'
      case 'high': return '#ff4444'
      default: return '#00aaff'
    }
  }

  const activityLevel = getActivityLevel()

  if (loading) {
    return (
      <div>
        <h1 className="neon-accent">Overview</h1>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading dashboard...
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }} className="neon-accent">Overview</h1>
      
      {/* Activity Status Card */}
      <Card style={{ marginBottom: '2rem', borderLeft: `4px solid ${getActivityColor(activityLevel)}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="neon-cyan">Honeypot Status</h3>
            <p style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>
              {activityLevel === 'quiet' ? 'Waiting for activity...' :
               activityLevel === 'low' ? 'Low activity detected' :
               activityLevel === 'medium' ? 'Moderate activity' : 'High activity!'}
            </p>
          </div>
          <div style={{ 
            background: getActivityColor(activityLevel),
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '0.8rem'
          }}>
            {activityLevel} activity
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid-container">
        <Card>
          <h3 className="neon-cyan">Total Events</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>
            {totalConnections}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span>SSH: {sshConnections}</span>
            <span>HTTP: {httpConnections}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
            Last 24h: {recentConnections24h}
          </div>
        </Card>

        <Card>
          <h3 className="neon-cyan">File Captures</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>
            {totalCaptures}
          </p>
          <div style={{ fontSize: '0.875rem' }}>
            Files uploaded to honeypot
          </div>
        </Card>

        <Card>
          <h3 className="neon-cyan">Unique Attackers</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>
            {uniqueIPs}
          </p>
          <div style={{ fontSize: '0.875rem' }}>
            Unique IP addresses
          </div>
        </Card>

        <Card>
          <h3 className="neon-cyan">Top Countries</h3>
          <div style={{ margin: '1rem 0', minHeight: '120px' }}>
            {stats.top_countries && stats.top_countries.length > 0 ? (
              stats.top_countries.slice(0, 3).map((country, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>{country.country || 'Unknown'}:</span>
                  <span style={{ color: '#00ff88' }}>{country.count}</span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '1rem' }}>
                No country data
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Live Logs */}
      <Card style={{ marginTop: '2rem' }}>
        <h3 className="neon-cyan" style={{ marginBottom: '1rem' }}>Live Activity</h3>
        <LiveLogs />
      </Card>

      {/* Empty State Guidance */}
      {totalConnections === 0 && totalCaptures === 0 && (
        <Card style={{ marginTop: '2rem', background: 'rgba(0, 170, 255, 0.1)', borderColor: 'rgba(0, 170, 255, 0.3)' }}>
          <h3 style={{ color: '#00aaff', marginBottom: '1rem' }}>Getting Started</h3>
          <p>Your honeypot is running and ready to capture activity. To test the system:</p>
          <ul style={{ margin: '1rem 0', paddingLeft: '1.5rem' }}>
            <li>Connect via SSH: <code>ssh root@localhost -p 22222</code></li>
            <li>Send HTTP requests: <code>curl http://localhost:8080/</code></li>
            <li>Upload files: <code>curl -X POST http://localhost:8080/upload -F "file=@/path/to/file"</code></li>
          </ul>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
            All captured activity will appear here in real-time.
          </p>
        </Card>
      )}
    </div>
  )
}

export default Overview