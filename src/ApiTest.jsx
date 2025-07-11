import { useState } from 'react'

function ApiTest() {
  const [apiData, setApiData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const testApi = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Test the root API endpoint
      const response = await fetch('http://159.65.177.29:8000/')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setApiData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testDirectories = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Test the service status endpoint
      const response = await fetch('http://159.65.177.29:8000/directories/service-status')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setApiData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Directory Analyzer API Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testApi} disabled={loading} style={{ marginRight: '10px' }}>
          Test API Root
        </button>
        <button onClick={testDirectories} disabled={loading}>
          Test Directories Service
        </button>
      </div>

      {loading && <div>Loading...</div>}
      
      {error && (
        <div style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          Error: {error}
        </div>
      )}
      
      {apiData && (
        <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
          <h3>API Response:</h3>
          <pre>{JSON.stringify(apiData, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>Available API Endpoints:</h3>
        <ul>
          <li><a href="http://159.65.177.29:8000/docs" target="_blank">API Documentation</a></li>
          <li><a href="http://159.65.177.29:8000/" target="_blank">API Root</a></li>
          <li><a href="http://159.65.177.29:8000/directories/service-status" target="_blank">Service Status</a></li>
        </ul>
      </div>
    </div>
  )
}

export default ApiTest
