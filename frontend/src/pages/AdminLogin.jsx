import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_AUTH_URL } from '../utils/api'
import '../styles/admin.css'

function AdminLogin() {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${ADMIN_AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      const data = await res.json()

      if (data.status === 'success' && data.token) {
        localStorage.setItem('adminToken', data.token)
        navigate('/admin/dashboard')
      } else {
        setError(data.message || 'Invalid credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      margin: 0,
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#ffffff',
      fontFamily: "'Poppins', sans-serif"
    }}>
      <div style={{
        width: '360px',
        background: '#ffffff',
        color: '#0e2b64',
        borderRadius: '14px',
        padding: '35px 30px',
        boxShadow: '0 0 20px rgba(0,0,0,0.15)',
        borderTop: '6px solid #2d72f0'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '26px',
          fontWeight: 600,
          marginBottom: '25px',
          color: '#0e2b64'
        }}>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Admin Username"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            style={{
              width: '100%',
              padding: '14px 12px',
              marginTop: '12px',
              borderRadius: '8px',
              border: '1.8px solid #d1d9e6',
              fontSize: '15px',
              outline: 'none',
              transition: '0.3s'
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            style={{
              width: '100%',
              padding: '14px 12px',
              marginTop: '12px',
              borderRadius: '8px',
              border: '1.8px solid #d1d9e6',
              fontSize: '15px',
              outline: 'none',
              transition: '0.3s'
            }}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '14px',
              background: loading ? '#94a3b8' : '#2d72f0',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '17px',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: '0.25s'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && (
            <p style={{
              display: 'block',
              textAlign: 'center',
              color: 'red',
              marginTop: '12px',
              fontSize: '15px'
            }}>{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}

export default AdminLogin





