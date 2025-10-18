import React, { useState, useEffect } from 'react'
import Card from '../UI/Card'

const MapView = () => {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchConnectionsForMap()
  }, [])

  const fetchConnectionsForMap = async () => {
    try {
      setError(null)
      const response = await fetch('http://localhost:8000/api/v1/connections')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      // Filter connections with valid GeoIP data
      const connectionsWithGeo = data.connections.filter(conn => 
        conn.latitude && 
        conn.longitude &&
        Math.abs(conn.latitude) <= 90 &&
        Math.abs(conn.longitude) <= 180 &&
        conn.latitude !== 0 && 
        conn.longitude !== 0
      )
      
      setConnections(connectionsWithGeo)
    } catch (error) {
      console.error('Failed to fetch connections for map:', error)
      setError(error.message)
      // Use mock data as fallback
      setConnections(generateMockConnections())
    } finally {
      setLoading(false)
    }
  }

  // Generate mock connections for demonstration
  const generateMockConnections = () => {
    const mockLocations = [
      { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA' },
      { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', country: 'USA' },
      { lat: 51.5074, lng: -0.1278, city: 'London', country: 'UK' },
      { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France' },
      { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan' },
      { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia' },
      { lat: 39.9042, lng: 116.4074, city: 'Beijing', country: 'China' },
      { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany' },
    ]
    
    return mockLocations.map((loc, index) => ({
      id: index + 1,
      source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      service: Math.random() > 0.5 ? 'ssh' : 'http',
      latitude: loc.lat,
      longitude: loc.lng,
      country: loc.country,
      city: loc.city,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
    }))
  }

  const getAttackColor = (type) => {
    switch (type) {
      case 'ssh': return '#00ff88'
      case 'http': return '#ffaa00'
      default: return '#00aaff'
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        <h1 className="neon-accent">Attack Map</h1>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading map data...
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="neon-accent">Attack Map</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="neon-cyan">
            {connections.length} attack locations
          </span>
          <button className="btn" onClick={fetchConnectionsForMap}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <Card style={{ background: 'rgba(255,165,0,0.1)', borderColor: 'orange', marginBottom: '1rem' }}>
          <p style={{ color: '#ffaa00', margin: 0 }}>
            Using mock data: {error}
          </p>
        </Card>
      )}

      <Card>
        <div style={{ 
          height: '500px', 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'rgba(255,255,255,0.7)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Mock Map Visualization */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(0,170,255,0.1)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}></div>
          
          {/* Attack Points */}
          {connections.map((connection) => {
            const attackColor = getAttackColor(connection.service)
            // Convert lat/lng to screen coordinates (mock positioning)
            const x = 50 + (connection.longitude / 180) * 40
            const y = 50 - (connection.latitude / 90) * 40
            
            return (
              <div
                key={connection.id}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  width: '12px',
                  height: '12px',
                  background: attackColor,
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: `0 0 10px ${attackColor}`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: 2
                }}
                title={`${connection.source_ip} - ${connection.service} - ${connection.country}`}
              />
            )
          })}
          
          <div style={{ 
            position: 'relative', 
            zIndex: 2, 
            textAlign: 'center',
            background: 'rgba(0,0,0,0.7)',
            padding: '2rem',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
            <h3>Interactive Attack Map</h3>
            <p style={{ marginBottom: '1rem' }}>
              {connections.length > 0 
                ? `Showing ${connections.length} attack locations worldwide`
                : 'No attack data available'
              }
            </p>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
              This is a static visualization. For interactive maps, integrate with Leaflet/OpenStreetMap.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginTop: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: '#00ff88',
              borderRadius: '50%',
              border: '2px solid white'
            }}></div>
            <span>SSH Attacks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: '#ffaa00',
              borderRadius: '50%',
              border: '2px solid white'
            }}></div>
            <span>HTTP Attacks</span>
          </div>
        </div>
      </Card>

      {/* Connection List */}
      {connections.length > 0 && (
        <Card style={{ marginTop: '2rem' }}>
          <h3 className="neon-cyan" style={{ marginBottom: '1rem' }}>Recent Attack Locations</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>IP Address</th>
                  <th>Location</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {connections.slice(0, 10).map((conn) => (
                  <tr key={conn.id}>
                    <td>
                      <span style={{ color: getAttackColor(conn.service) }}>
                        {conn.service?.toUpperCase()}
                      </span>
                    </td>
                    <td>{conn.source_ip}</td>
                    <td>
                      {conn.country || 'Unknown'}
                      {conn.city && conn.city !== 'Unknown' ? `, ${conn.city}` : ''}
                    </td>
                    <td>{new Date(conn.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default MapView