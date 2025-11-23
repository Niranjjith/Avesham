import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_API_URL, PUBLIC_API_URL } from '../utils/api'
import QRScanner from '../components/QRScanner'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import '../styles/admin.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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

  // Calculate chart data from bookings
  const chartData = useMemo(() => {
    if (!allBookings.length) {
      return {
        revenueByDate: { labels: [], data: [] },
        ticketTypeDistribution: { dayPass: 0, seasonPass: 0 },
        revenueByType: { dayPass: 0, seasonPass: 0 }
      }
    }

    // Group bookings by date
    const revenueByDateMap = {}
    let dayPassCount = 0
    let seasonPassCount = 0
    let dayPassRevenue = 0
    let seasonPassRevenue = 0

    allBookings.forEach(booking => {
      const date = new Date(booking.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      if (!revenueByDateMap[date]) {
        revenueByDateMap[date] = 0
      }
      revenueByDateMap[date] += booking.totalAmount || 0

      if (booking.ticketType === 'Day Pass') {
        dayPassCount += booking.quantity || 0
        dayPassRevenue += booking.totalAmount || 0
      } else if (booking.ticketType === 'Season Pass') {
        seasonPassCount += booking.quantity || 0
        seasonPassRevenue += booking.totalAmount || 0
      }
    })

    const sortedDates = Object.keys(revenueByDateMap).sort((a, b) => {
      return new Date(a) - new Date(b)
    })

    return {
      revenueByDate: {
        labels: sortedDates,
        data: sortedDates.map(date => revenueByDateMap[date])
      },
      ticketTypeDistribution: {
        dayPass: dayPassCount,
        seasonPass: seasonPassCount
      },
      revenueByType: {
        dayPass: dayPassRevenue,
        seasonPass: seasonPassRevenue
      }
    }
  }, [allBookings])

  const updatePrices = async () => {
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
      const res = await fetch(`${ADMIN_API_URL}/update-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dayPass: dayPrice, seasonPass: seasonPrice })
      })

      const responseText = await res.text()
      const contentType = res.headers.get('content-type') || ''

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseErr) {
        if (contentType.includes('text/html') || responseText.trim().startsWith('<!')) {
          alert('Server error: Please check backend connection')
        } else {
          alert(`Server error: ${res.status} ${res.statusText}`)
        }
        return
      }

      if (!res.ok) {
        if (res.status === 403) {
          alert('Session expired. Please login again.')
          logout()
          return
        }
        alert(result.message || 'Failed to update prices')
        return
      }

      if (result.status === 'success') {
        alert('Prices updated successfully!')
        loadAdmin()
      }
    } catch (err) {
      console.error('Price Update Error:', err)
      alert('Failed to update prices. Please try again.')
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

  const deleteAllBookings = async () => {
    const confirm1 = window.confirm(
      '⚠️ WARNING: This will delete ALL bookings permanently!\n\n' +
      'This action cannot be undone. Are you sure you want to continue?'
    )
    
    if (!confirm1) return

    const confirm2 = window.confirm(
      '⚠️ FINAL CONFIRMATION\n\n' +
      'You are about to delete ALL booking data. This is irreversible.\n\n' +
      'Type "DELETE ALL" in the next prompt to confirm.'
    )
    
    if (!confirm2) return

    const confirmText = window.prompt(
      'Type "DELETE ALL" (in uppercase) to confirm deletion:'
    )

    if (confirmText !== 'DELETE ALL') {
      alert('Deletion cancelled. Confirmation text did not match.')
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`${ADMIN_API_URL}/delete-all-bookings`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (data.status === 'success') {
        alert(`Successfully deleted ${data.deletedCount} booking(s)`)
        loadAdmin()
      } else {
        alert(data.message || 'Failed to delete bookings')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const openPDFInNewWindow = async (serialNumber) => {
    try {
      const pdfUrl = `${PUBLIC_API_URL}/download-ticket/${serialNumber}`
      window.open(pdfUrl, '_blank')
    } catch (err) {
      console.error('PDF open error:', err)
      alert('Failed to open PDF. Please try again.')
    }
  }

  const downloadPDF = async (serialNumber) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${ADMIN_API_URL}/download-ticket/${serialNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Avesham_Ticket_${serialNumber}.pdf`
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
  }

  // Chart configurations
  const revenueChartData = {
    labels: chartData.revenueByDate.labels,
    datasets: [{
      label: 'Daily Revenue',
      data: chartData.revenueByDate.data,
      borderColor: 'rgb(102, 126, 234)',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: 'rgb(102, 126, 234)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  }

  const ticketTypeChartData = {
    labels: ['Day Pass', 'Season Pass'],
    datasets: [{
      data: [chartData.ticketTypeDistribution.dayPass, chartData.ticketTypeDistribution.seasonPass],
      backgroundColor: [
        'rgba(79, 172, 254, 0.8)',
        'rgba(67, 233, 123, 0.8)'
      ],
      borderColor: [
        'rgba(79, 172, 254, 1)',
        'rgba(67, 233, 123, 1)'
      ],
      borderWidth: 2
    }]
  }

  const revenueByTypeChartData = {
    labels: ['Day Pass Revenue', 'Season Pass Revenue'],
    datasets: [{
      label: 'Revenue (₹)',
      data: [chartData.revenueByType.dayPass, chartData.revenueByType.seasonPass],
      backgroundColor: [
        'rgba(79, 172, 254, 0.8)',
        'rgba(67, 233, 123, 0.8)'
      ],
      borderColor: [
        'rgba(79, 172, 254, 1)',
        'rgba(67, 233, 123, 1)'
      ],
      borderWidth: 2,
      borderRadius: 8
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: { size: 11 }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 11 }
        }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        cornerRadius: 8
      }
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1>📊 Admin Dashboard</h1>
            <p className="header-subtitle">Avesham Season 2 - Analytics & Management</p>
          </div>
          <div className="admin-actions">
            <button className="btn btn-success" onClick={goHome}>
              🏠 Home
            </button>
            <button className="btn btn-primary" onClick={() => setShowQRScanner(true)}>
              📷 Scan QR
            </button>
            <button className="btn btn-info" onClick={downloadExcel}>
              📥 Export Excel
            </button>
            <button 
              className="btn btn-danger" 
              onClick={deleteAllBookings}
              disabled={loading}
            >
              🗑️ Delete All Data
            </button>
            <button className="btn btn-secondary" onClick={logout}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-title">Total Revenue</p>
                <p className="stat-card-value">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="stat-card-icon revenue">💰</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-title">Total Tickets</p>
                <p className="stat-card-value">{stats.totalTickets}</p>
              </div>
              <div className="stat-card-icon tickets">🎫</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-title">Day Pass Revenue</p>
                <p className="stat-card-value">{formatCurrency(stats.dayPassRevenue)}</p>
              </div>
              <div className="stat-card-icon day">📅</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-title">Season Pass Revenue</p>
                <p className="stat-card-value">{formatCurrency(stats.seasonPassRevenue)}</p>
              </div>
              <div className="stat-card-icon season">⭐</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="content-card chart-card">
            <h2>📈 Revenue Trend</h2>
            <div className="chart-container">
              {chartData.revenueByDate.labels.length > 0 ? (
                <Line data={revenueChartData} options={chartOptions} />
              ) : (
                <div className="empty-chart">No data available</div>
              )}
            </div>
          </div>

          <div className="content-card chart-card">
            <h2>🎫 Ticket Distribution</h2>
            <div className="chart-container">
              {chartData.ticketTypeDistribution.dayPass + chartData.ticketTypeDistribution.seasonPass > 0 ? (
                <Doughnut data={ticketTypeChartData} options={doughnutOptions} />
              ) : (
                <div className="empty-chart">No data available</div>
              )}
            </div>
          </div>

          <div className="content-card chart-card">
            <h2>💵 Revenue by Ticket Type</h2>
            <div className="chart-container">
              {chartData.revenueByType.dayPass + chartData.revenueByType.seasonPass > 0 ? (
                <Bar data={revenueByTypeChartData} options={chartOptions} />
              ) : (
                <div className="empty-chart">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Price Update Section */}
        <div className="content-card">
          <h2>⚙️ Update Ticket Prices</h2>
          <div className="price-form">
            <div className="form-group">
              <label htmlFor="dayPassPrice">Day Pass Price (₹)</label>
              <input
                id="dayPassPrice"
                type="number"
                value={prices.dayPass}
                onChange={(e) => setPrices({ ...prices, dayPass: e.target.value })}
                placeholder="199"
              />
            </div>
            <div className="form-group">
              <label htmlFor="seasonPassPrice">Season Pass Price (₹)</label>
              <input
                id="seasonPassPrice"
                type="number"
                value={prices.seasonPass}
                onChange={(e) => setPrices({ ...prices, seasonPass: e.target.value })}
                placeholder="699"
              />
            </div>
          </div>
          <button
            className="btn btn-success"
            onClick={updatePrices}
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? '⏳ Updating...' : '💾 Save Prices'}
          </button>
        </div>

        {/* Bookings Table */}
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>📋 All Bookings ({bookings.length})</h2>
            <div className="search-container" style={{ width: '100%', maxWidth: '400px' }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, phone, serial number..."
                value={searchQuery}
                onChange={(e) => filterBookings(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="text-center">#</th>
                  <th>Serial</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Ticket Type</th>
                  <th className="text-center">Qty</th>
                  <th className="text-center">Amount</th>
                  <th>Payment ID</th>
                  <th>Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((booking, index) => (
                    <tr key={index}>
                      <td className="text-center">{index + 1}</td>
                      <td>{booking.serialNumber || '-'}</td>
                      <td>{booking.fullName || '-'}</td>
                      <td>{booking.email || '-'}</td>
                      <td>{booking.phone || '-'}</td>
                      <td>{booking.ticketType || '-'}</td>
                      <td className="text-center">{booking.quantity || 0}</td>
                      <td className="text-center">{formatCurrency(booking.totalAmount || 0)}</td>
                      <td style={{ fontSize: '0.75rem', wordBreak: 'break-word' }}>
                        {booking.paymentId || '-'}
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>
                        {booking.timestamp ? new Date(booking.timestamp).toLocaleString() : '-'}
                      </td>
                      <td>
                        {booking.serialNumber && (
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-view"
                              onClick={() => openPDFInNewWindow(booking.serialNumber)}
                              title="View PDF in new window"
                            >
                              👁️ View
                            </button>
                            <button
                              className="btn btn-sm btn-download"
                              onClick={() => downloadPDF(booking.serialNumber)}
                              title="Download PDF"
                            >
                              📥 PDF
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <p>No bookings found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onClose={() => setShowQRScanner(false)}
            onVerify={(booking) => {
              console.log('QR Verified:', booking)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
