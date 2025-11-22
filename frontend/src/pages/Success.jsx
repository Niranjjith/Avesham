import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PUBLIC_API_URL } from '../utils/api'
import '../styles/success.css'

function Success() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const serialNumber = searchParams.get('serial')
  
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!serialNumber) {
      setError('No booking serial number provided')
      setLoading(false)
      return
    }

    // Fetch booking details
    fetchBookingDetails()
  }, [serialNumber])

  const fetchBookingDetails = async () => {
    try {
      // Try to get booking from localStorage first (if just completed payment)
      const storedBooking = localStorage.getItem('lastBooking')
      if (storedBooking) {
        const parsed = JSON.parse(storedBooking)
        if (parsed.serialNumber === serialNumber) {
          setBooking(parsed)
          setLoading(false)
          return
        }
      }

      // If not in localStorage, we can't fetch from API without auth
      // So we'll just use the serial number for download
      setBooking({ serialNumber })
      setLoading(false)
    } catch (err) {
      console.error('Error fetching booking:', err)
      setError('Failed to load booking details')
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!serialNumber) return

    setDownloading(true)
    try {
      const response = await fetch(`${PUBLIC_API_URL}/download-ticket/${serialNumber}`)
      
      if (!response.ok) {
        throw new Error('Failed to download ticket')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Avesham_Ticket_${serialNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download ticket. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="success-container">
        <div className="success-content">
          <div className="loading-spinner"></div>
          <p>Loading your booking details...</p>
        </div>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="success-container">
        <div className="success-content error-state">
          <div className="error-icon">⚠️</div>
          <h1>Error</h1>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="success-container">
      <div className="success-content">
        {/* Success Icon */}
        <div className="success-icon">
          <svg viewBox="0 0 100 100" className="checkmark">
            <circle cx="50" cy="50" r="45" className="circle" />
            <path d="M30 50 L45 65 L70 35" className="check" />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="success-title">Payment Successful! 🎉</h1>
        <p className="success-subtitle">
          Thank you for your booking. Your ticket has been confirmed.
        </p>

        {/* Booking Details */}
        {booking && (
          <div className="booking-details">
            <div className="detail-card">
              <div className="detail-item">
                <span className="detail-label">Serial Number:</span>
                <span className="detail-value">{booking.serialNumber || serialNumber}</span>
              </div>
              
              {booking.fullName && (
                <div className="detail-item">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{booking.fullName}</span>
                </div>
              )}
              
              {booking.email && (
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{booking.email}</span>
                </div>
              )}
              
              {booking.ticketType && (
                <div className="detail-item">
                  <span className="detail-label">Ticket Type:</span>
                  <span className="detail-value">{booking.ticketType}</span>
                </div>
              )}
              
              {booking.quantity && (
                <div className="detail-item">
                  <span className="detail-label">Quantity:</span>
                  <span className="detail-value">{booking.quantity}</span>
                </div>
              )}
              
              {booking.totalAmount && (
                <div className="detail-item">
                  <span className="detail-label">Amount Paid:</span>
                  <span className="detail-value">₹{booking.totalAmount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Download Section */}
        <div className="download-section">
          <h2>Download Your Ticket</h2>
          <p className="download-description">
            Click the button below to download your ticket PDF. 
            Please bring this ticket (or the serial number) along with a valid ID to the venue.
          </p>
          
          <button 
            onClick={handleDownload} 
            className="btn-download"
            disabled={downloading}
          >
            {downloading ? (
              <>
                <span className="spinner-small"></span>
                Downloading...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Ticket PDF
              </>
            )}
          </button>

          {serialNumber && (
            <div className="download-link-info">
              <p>You can also access your ticket later using this link:</p>
              <div className="link-box">
                <code>{window.location.origin}/success?serial={serialNumber}</code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/success?serial=${serialNumber}`)
                    alert('Link copied to clipboard!')
                  }}
                  className="btn-copy"
                  title="Copy link"
                >
                  📋
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Important Information */}
        <div className="info-section">
          <h3>Important Information</h3>
          <ul>
            <li>✅ A confirmation email has been sent to your email address</li>
            <li>✅ Please save your serial number for reference</li>
            <li>✅ Bring a valid ID proof along with your ticket to the venue</li>
            <li>✅ The ticket PDF contains a QR code for easy verification</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to Home
          </button>
          <button 
            onClick={() => window.print()} 
            className="btn-secondary"
          >
            Print This Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default Success


