import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { ADMIN_API_URL } from '../utils/api'

function QRScanner({ onClose, onVerify }) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [qrBoxSize, setQrBoxSize] = useState(250)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  // Calculate responsive QR box size
  useEffect(() => {
    const updateQrBoxSize = () => {
      const screenWidth = window.innerWidth
      setQrBoxSize(screenWidth < 480 ? Math.min(screenWidth - 60, 250) : 250)
    }
    updateQrBoxSize()
    window.addEventListener('resize', updateQrBoxSize)
    return () => window.removeEventListener('resize', updateQrBoxSize)
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current && isScanning) {
        html5QrCodeRef.current.stop().catch(() => {})
      }
    }
  }, [isScanning])

  const startScanning = async () => {
    try {
      setError('')
      setVerificationResult(null)
      
      const html5QrCode = new Html5Qrcode("qr-reader")
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: qrBoxSize, height: qrBoxSize }
        },
        (decodedText, decodedResult) => {
          // QR code scanned successfully
          handleQRScan(decodedText)
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
        }
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Scanner start error:', err)
      setError('Failed to start camera. Please ensure camera permissions are granted.')
    }
  }

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
      }
      setIsScanning(false)
    } catch (err) {
      console.error('Scanner stop error:', err)
    }
  }

  const handleQRScan = async (qrData) => {
    try {
      // Stop scanning once QR is detected
      await stopScanning()

      // Verify QR code with backend
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${ADMIN_API_URL}/verify-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrData })
      })

      const result = await res.json()
      setVerificationResult(result)

      if (result.status === 'valid' && onVerify) {
        onVerify(result.booking)
      }
    } catch (err) {
      console.error('QR verification error:', err)
      setError('Failed to verify QR code. Please try again.')
      setVerificationResult({
        status: 'error',
        message: 'Failed to verify QR code'
      })
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px',
      overflow: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '15px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '95vh',
        overflow: 'auto',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: '#0e2b64',
            fontSize: 'clamp(18px, 4vw, 24px)'
          }}>QR Code Scanner</h2>
          <button
            onClick={() => {
              stopScanning()
              onClose()
            }}
            style={{
              background: '#ff3b3b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 'clamp(14px, 3vw, 16px)',
              whiteSpace: 'nowrap'
            }}
          >
            ✕ Close
          </button>
        </div>

        {!isScanning && !verificationResult && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={startScanning}
              style={{
                background: '#2d72f0',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: 600,
                width: '100%',
                maxWidth: '400px'
              }}
            >
              📷 Open Camera & Start Scanning
            </button>
          </div>
        )}

        {isScanning && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={stopScanning}
              style={{
                background: '#ff3b3b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: 600,
                width: '100%',
                maxWidth: '400px'
              }}
            >
              ⏹ Stop Scanning
            </button>
          </div>
        )}

        <div
          id="qr-reader"
          style={{
            width: '100%',
            minHeight: qrBoxSize < 250 ? '250px' : '300px',
            marginBottom: '15px',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative'
          }}
        ></div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c00',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {verificationResult && (
          <div style={{
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: verificationResult.status === 'valid' ? '#d4edda' : '#f8d7da',
            border: `1px solid ${verificationResult.status === 'valid' ? '#c3e6cb' : '#f5c6cb'}`,
            color: verificationResult.status === 'valid' ? '#155724' : '#721c24'
          }}>
            <h3 style={{ marginTop: 0 }}>
              {verificationResult.status === 'valid' ? '✓ Ticket Verified' : '✗ Verification Failed'}
            </h3>
            <p>{verificationResult.message}</p>
            
            {verificationResult.status === 'valid' && verificationResult.booking && (
              <div style={{
                marginTop: '15px',
                padding: '12px',
                background: 'white',
                borderRadius: '6px',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                overflow: 'auto'
              }}>
                <p style={{ wordBreak: 'break-word' }}><strong>Serial Number:</strong> {verificationResult.booking.serialNumber}</p>
                <p style={{ wordBreak: 'break-word' }}><strong>Name:</strong> {verificationResult.booking.fullName}</p>
                <p style={{ wordBreak: 'break-word' }}><strong>Email:</strong> {verificationResult.booking.email}</p>
                <p style={{ wordBreak: 'break-word' }}><strong>Phone:</strong> {verificationResult.booking.phone}</p>
                <p><strong>Ticket Type:</strong> {verificationResult.booking.ticketType}</p>
                <p><strong>Quantity:</strong> {verificationResult.booking.quantity}</p>
                <p><strong>Amount:</strong> ₹{verificationResult.booking.totalAmount}</p>
                <p style={{ wordBreak: 'break-word' }}><strong>Payment ID:</strong> {verificationResult.booking.paymentId}</p>
                <p><strong>Booking Date:</strong> {new Date(verificationResult.booking.timestamp).toLocaleString()}</p>
              </div>
            )}

            <button
              onClick={() => {
                setVerificationResult(null)
                setError('')
                startScanning()
              }}
              style={{
                marginTop: '15px',
                background: '#2d72f0',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: 'clamp(13px, 2.5vw, 14px)',
                fontWeight: 600,
                width: '100%',
                maxWidth: '400px'
              }}
            >
              Scan Another QR Code
            </button>
          </div>
        )}

        <div style={{
          fontSize: 'clamp(11px, 2vw, 12px)',
          color: '#666',
          textAlign: 'center',
          marginTop: '15px',
          padding: '0 10px'
        }}>
          <p>Position the QR code within the camera view to scan</p>
        </div>
      </div>
    </div>
  )
}

export default QRScanner


