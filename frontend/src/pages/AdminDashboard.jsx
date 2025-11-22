import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_API_URL } from '../utils/api'
import QRScanner from '../components/QRScanner'
import '../styles/admin.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const [token, setToken] = useState(localStorage.getItem('adminToken'))
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTickets: 0,
    dayPassRevenue: 0,
    seasonPassRevenue: 0
  })
  const [bookings, setBookings] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [prices, setPrices] = useState({ dayPass: 199, seasonPass: 699 })
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }
    loadAdmin()
  }, [token, navigate])

  const loadAdmin = async () => {
    try {
      const res = await fetch(`${ADMIN_API_URL}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        if (res.status === 403) {
          alert('Session expired. Please login again.')
          logout()
          return
        }
        throw new Error('Failed to load dashboard data')
      }

      const data = await res.json()
      if (data.status === 'success') {
        setStats({
          totalRevenue: data.totalRevenue || 0,
          totalTickets: data.totalTickets || 0,
          dayPassRevenue: data.dayPassRevenue || 0,
          seasonPassRevenue: data.seasonPassRevenue || 0
        })
        setAllBookings(data.bookings || [])
        setBookings(data.bookings || [])
        if (data.prices) {
          setPrices({
            dayPass: data.prices.dayPass || 199,
            seasonPass: data.prices.seasonPass || 699
          })
        }
      }
    } catch (error) {
      console.error('Dashboard Load Error:', error)
      alert('Failed to load dashboard data. Please refresh the page.')
    }
  }

  const updatePrices = async () => {
    // Get values directly from input elements to ensure we have the latest values
    const dayPriceInput = document.getElementById('dayPassPrice')
    const seasonPriceInput = document.getElementById('seasonPassPrice')
    
    if (!dayPriceInput || !seasonPriceInput) {
      alert('Price input fields not found')
      return
    }

    const dayPrice = parseInt(dayPriceInput.value)
    const seasonPrice = parseInt(seasonPriceInput.value)

    if (isNaN(dayPrice) || isNaN(seasonPrice) || dayPrice <= 0 || seasonPrice <= 0) {
      alert('Enter valid positive prices')
      return
    }

    setLoading(true)
    try {
      const apiUrl = `${ADMIN_API_URL}/update-prices`
      console.log('Updating prices:', { dayPass: dayPrice, seasonPass: seasonPrice })
      console.log('API URL:', apiUrl)
      console.log('Token present:', !!token)
      console.log('Current hostname:', window.location.hostname)

      // First, check if backend is reachable
      try {
        const healthCheck = await fetch(`${ADMIN_API_URL.replace('/admin', '')}/admin/test`)
        console.log('Backend health check:', healthCheck.status)
      } catch (healthErr) {
        console.warn('Backend health check failed:', healthErr)
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dayPass: dayPrice, seasonPass: seasonPrice })
      })

      console.log('Response status:', res.status)
      console.log('Response headers:', Object.fromEntries(res.headers.entries()))

      // Get response as text first
      const responseText = await res.text()
      const contentType = res.headers.get('content-type') || ''

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseErr) {
        console.error('Failed to parse response as JSON')
        console.error('Response text (first 500 chars):', responseText.substring(0, 500))
        
        if (contentType.includes('text/html') || responseText.trim().startsWith('<!')) {
          const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          const errorMsg = isLocal 
            ? `Backend server is not running or route doesn't exist.\n\nPlease ensure:\n1. Backend is running on http://localhost:5000\n2. Run: cd backend && npm start\n\nAPI URL: ${apiUrl}`
            : `Server returned HTML instead of JSON. The route may not exist on the deployed server.\n\nPlease check:\n1. Backend is deployed to Render\n2. Latest code is deployed\n3. Route /api/admin/update-prices exists\n\nAPI URL: ${apiUrl}`
          alert(errorMsg)
        } else {
          alert(`Server error: ${res.status} ${res.statusText}\n\nResponse: ${responseText.substring(0, 200)}`)
        }
        return
      }

      if (!res.ok) {
        if (res.status === 403) {
          alert('Session expired. Please login again.')
          logout()
          return
        }
        if (res.status === 400) {
          alert(result.message || 'Invalid price values')
          return
        }
        if (res.status === 404) {
          alert(`Route not found: ${apiUrl}\n\n${result.message || 'The update-prices route may not be deployed.'}`)
          return
        }
        throw new Error(result.message || `Server error: ${res.status}`)
      }

      if (result.status === 'success') {
        alert('Prices updated successfully!')
        loadAdmin()
      } else {
        throw new Error(result.message || 'Update failed')
      }
    } catch (err) {
      console.error('Price Update Error:', err)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        const errorMsg = isLocal
          ? `Cannot connect to backend server.\n\nPlease ensure:\n1. Backend is running: cd backend && npm start\n2. Backend is on http://localhost:5000\n\nError: ${err.message}`
          : `Cannot connect to backend server.\n\nPlease check:\n1. Backend is deployed and running\n2. CORS is configured correctly\n\nError: ${err.message}`
        alert(errorMsg)
      } else {
        const errorMsg = err.message || 'Failed to update prices. Please check your connection and try again.'
        alert(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const filterBookings = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setBookings(allBookings)
      return
    }

    const filtered = allBookings.filter(booking => {
      const q = query.toLowerCase()
      return (
        (booking.serialNumber && booking.serialNumber.toLowerCase().includes(q)) ||
        (booking.fullName && booking.fullName.toLowerCase().includes(q)) ||
        (booking.email && booking.email.toLowerCase().includes(q)) ||
        (booking.phone && booking.phone.includes(q)) ||
        (booking.ticketType && booking.ticketType.toLowerCase().includes(q)) ||
        (booking.paymentId && booking.paymentId.toLowerCase().includes(q))
      )
    })
    setBookings(filtered)
  }

  const downloadExcel = async () => {
    try {
      // Load XLSX library dynamically
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
      script.onload = () => {
        const excelData = bookings.map((b, index) => ({
          'S.No': index + 1,
          'Serial Number': b.serialNumber || '-',
          'Full Name': b.fullName || '-',
          'Email': b.email || '-',
          'Phone': b.phone || '-',
          'Ticket Type': b.ticketType || '-',
          'Quantity': b.quantity || 0,
          'Total Amount': b.totalAmount || 0,
          'Payment ID': b.paymentId || '-',
          'Date': b.timestamp ? new Date(b.timestamp).toLocaleString() : '-'
        }))

        const ws = window.XLSX.utils.json_to_sheet(excelData)
        const wb = window.XLSX.utils.book_new()
        window.XLSX.utils.book_append_sheet(wb, ws, 'Bookings')
        const fileName = `Avesham_Bookings_${new Date().toISOString().split('T')[0]}.xlsx`
        window.XLSX.writeFile(wb, fileName)
      }
      document.body.appendChild(script)
    } catch (err) {
      console.error('Excel download error:', err)
      alert('Failed to download. Please try again.')
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setToken(null)
    navigate('/admin/login')
  }

  const goHome = () => {
    navigate('/')
  }

  return (
    <div style={{
      margin: 0,
      padding: 0,
      background: '#f6f8ff',
      fontFamily: "'Poppins', sans-serif",
      color: '#0e2b64',
      minHeight: '100vh'
    }}>
      <div style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: 'auto'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '25px',
          fontSize: '30px',
          fontWeight: 700
        }}>Admin Dashboard - Avesham Season 2</h1>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '15px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <button
            onClick={goHome}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: '0.3s',
              fontSize: '15px'
            }}
          >
            🏠 Home
          </button>
          <button
            onClick={() => setShowQRScanner(true)}
            style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: '0.3s',
              fontSize: '15px'
            }}
          >
            📷 Scan QR Code
          </button>
          <button
            onClick={downloadExcel}
            style={{
              background: '#2d72f0',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: '0.3s',
              fontSize: '15px'
            }}
          >
            Download Excel
          </button>
          <button
            onClick={logout}
            style={{
              background: '#ff3b3b',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: '0.3s',
              fontSize: '15px'
            }}
          >
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div style={{
            background: 'white',
            padding: '18px',
            borderRadius: '12px',
            border: '2px solid #dce6ff',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ color: '#2d72f0', marginBottom: '5px' }}>Total Revenue</h3>
            <p>₹{stats.totalRevenue}</p>
          </div>
          <div style={{
            background: 'white',
            padding: '18px',
            borderRadius: '12px',
            border: '2px solid #dce6ff',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ color: '#2d72f0', marginBottom: '5px' }}>Total Tickets</h3>
            <p>{stats.totalTickets}</p>
          </div>
          <div style={{
            background: 'white',
            padding: '18px',
            borderRadius: '12px',
            border: '2px solid #dce6ff',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ color: '#2d72f0', marginBottom: '5px' }}>Day Pass Revenue</h3>
            <p>₹{stats.dayPassRevenue}</p>
          </div>
          <div style={{
            background: 'white',
            padding: '18px',
            borderRadius: '12px',
            border: '2px solid #dce6ff',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ color: '#2d72f0', marginBottom: '5px' }}>Season Pass Revenue</h3>
            <p>₹{stats.seasonPassRevenue}</p>
          </div>
        </div>

        {/* Price Update Section */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '18px',
          marginBottom: '25px',
          border: '2px solid #dce6ff'
        }}>
          <h2 style={{ marginBottom: '15px', textAlign: 'center' }}>Update Ticket Prices</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '15px'
          }}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: '5px', display: 'block' }}>
                Day Pass Price (₹)
              </label>
              <input
                id="dayPassPrice"
                type="number"
                value={prices.dayPass}
                onChange={(e) => setPrices({ ...prices, dayPass: e.target.value })}
                placeholder="199"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #bcc8e6',
                  borderRadius: '8px'
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600, marginBottom: '5px', display: 'block' }}>
                Season Pass Price (₹)
              </label>
              <input
                id="seasonPassPrice"
                type="number"
                value={prices.seasonPass}
                onChange={(e) => setPrices({ ...prices, seasonPass: e.target.value })}
                placeholder="699"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #bcc8e6',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
          <button
            onClick={updatePrices}
            disabled={loading}
            style={{
              marginTop: '15px',
              background: loading ? '#94a3b8' : '#0e8c1f',
              color: 'white',
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {loading ? 'Updating...' : 'Save Prices'}
          </button>
        </div>

        {/* Bookings Table */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h2 style={{ margin: 0 }}>All Bookings</h2>
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => filterBookings(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 15px',
                border: '2px solid #dce6ff',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none'
              }}
            />
            <span style={{
              position: 'absolute',
              right: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#2d72f0',
              fontSize: '18px'
            }}>🔍</span>
          </div>
        </div>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'white'
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '10px',
                borderBottom: '1px solid #e3e8f5',
                textAlign: 'center',
                background: '#2d72f0',
                color: 'white',
                fontWeight: 600
              }}>#</th>
              <th style={{
                padding: '10px',
                borderBottom: '1px solid #e3e8f5',
                textAlign: 'center',
                background: '#2d72f0',
                color: 'white',
                fontWeight: 600
              }}>Serial</th>
              <th style={{
                padding: '10px',
                borderBottom: '1px solid #e3e8f5',
                textAlign: 'center',
                background: '#2d72f0',
                color: 'white',
                fontWeight: 600
              }}>Name</th>
              <th style={{
                padding: '10px',
                borderBottom: '1px solid #e3e8f5',
                textAlign: 'center',
                background: '#2d72f0',
                color: 'white',
                fontWeight: 600
              }}>Email</th>
              <th style={{
                padding: '10px',
                borderBottom: '1px solid #e3e8f5',
                textAlign: 'center',
                background: '#2d72f0',
                color: 'white',
                fontWeight: 600
              }}>Phone</th>
              <th style={{
                padding: '10px',
                borderBottom: '1px solid #e3e8f5',
                textAlign: 'center',
                background: '#2d72f0',
                color: 'white',
                fontWeight: 600
              }}>Ticket</th>
              <th style={{
                padding: '10px',
                borderBottom: '1px solid #e3e8f5',
                textAlign: 'center',
                background: '#2d72f0',
                color: 'white',
                fontWeight: 600
              }}>Qty</th>
              <th style={{
                padding: '10px',
                borderBottom: '1px solid #e3e8f5',
                textAlign: 'center',
                background: '#2d72f0',
                color: 'white',
                fontWeight: 600
              }}>Amount</th>
              <th style={{
                padding: '10px',
                borderBottom: '1px solid #e3e8f5',
                textAlign: 'center',
                background: '#2d72f0',
                color: 'white',
                fontWeight: 600
              }}>Payment ID</th>
              <th style={{
                padding: '10px',
                borderBottom: '1px solid #e3e8f5',
                textAlign: 'center',
                background: '#2d72f0',
                color: 'white',
                fontWeight: 600
              }}>Date</th>
              <th style={{
                padding: '10px',
                borderBottom: '1px solid #e3e8f5',
                textAlign: 'center',
                background: '#2d72f0',
                color: 'white',
                fontWeight: 600
              }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((booking, index) => (
                <tr key={index} style={{
                  background: index % 2 === 0 ? 'white' : '#f1f5ff'
                }}>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{booking.serialNumber || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{booking.fullName || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{booking.email || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{booking.phone || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{booking.ticketType || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{booking.quantity || 0}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>₹{booking.totalAmount || 0}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{booking.paymentId || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {booking.timestamp ? new Date(booking.timestamp).toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {booking.serialNumber && (
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('adminToken')
                            const res = await fetch(`${ADMIN_API_URL}/download-ticket/${booking.serialNumber}`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            })
                            if (res.ok) {
                              const blob = await res.blob()
                              const url = URL.createObjectURL(blob)
                              const link = document.createElement('a')
                              link.href = url
                              link.download = `Avesham_Ticket_${booking.serialNumber}.pdf`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                              URL.revokeObjectURL(url)
                            } else {
                              alert('Failed to download ticket PDF')
                            }
                          } catch (err) {
                            console.error('Download error:', err)
                            alert('Failed to download ticket PDF')
                          }
                        }}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        📥 PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" style={{
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onClose={() => setShowQRScanner(false)}
            onVerify={(booking) => {
              console.log('QR Verified:', booking)
              // Optionally refresh bookings after verification
              // loadAdmin()
            }}
          />
        )}
      </div>
    </div>
  )
}

export default AdminDashboard

