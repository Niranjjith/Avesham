import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { ADMIN_API_URL } from '../utils/api'

function QRScanner({ onClose, onVerify }) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

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
          qrbox: { width: 250, height: 250 }
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
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#0e2b64' }}>QR Code Scanner</h2>
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
              fontSize: '16px'
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
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600
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
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600
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
            minHeight: '300px',
            marginBottom: '20px',
            borderRadius: '8px',
            overflow: 'hidden'
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
                padding: '10px',
                background: 'white',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                <p><strong>Serial Number:</strong> {verificationResult.booking.serialNumber}</p>
                <p><strong>Name:</strong> {verificationResult.booking.fullName}</p>
                <p><strong>Email:</strong> {verificationResult.booking.email}</p>
                <p><strong>Phone:</strong> {verificationResult.booking.phone}</p>
                <p><strong>Ticket Type:</strong> {verificationResult.booking.ticketType}</p>
                <p><strong>Quantity:</strong> {verificationResult.booking.quantity}</p>
                <p><strong>Amount:</strong> ₹{verificationResult.booking.totalAmount}</p>
                <p><strong>Payment ID:</strong> {verificationResult.booking.paymentId}</p>
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
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Scan Another QR Code
            </button>
          </div>
        )}

        <div style={{
          fontSize: '12px',
          color: '#666',
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <p>Position the QR code within the camera view to scan</p>
        </div>
      </div>
    </div>
  )
}

export default QRScanner

