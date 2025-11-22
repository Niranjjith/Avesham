import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPrices, createOrder, verifyPayment, RAZORPAY_KEY_ID } from '../utils/api'
import { openRazorpayCheckout } from '../utils/razorpay'
import '../styles/style.css'

function Home() {
  const navigate = useNavigate()
  const [prices, setPrices] = useState({ dayPass: 0, seasonPass: 0 })
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [selectedPrice, setSelectedPrice] = useState(0)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    quantity: ''
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeFaq, setActiveFaq] = useState(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [bookingData, setBookingData] = useState(null)
  const bookingRef = useRef(null)
  const priceRefreshInterval = useRef(null)

  // Load Razorpay script on mount
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
    }
  }, [])

  // Load prices on mount
  useEffect(() => {
    loadPrices()
    startPriceAutoRefresh()
    
    // Scroll listener
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300)
    }
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      if (priceRefreshInterval.current) {
        clearInterval(priceRefreshInterval.current)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Update selected price when prices change
  useEffect(() => {
    if (selectedTicket === 'day-pass') {
      setSelectedPrice(prices.dayPass)
    } else if (selectedTicket === 'season-pass') {
      setSelectedPrice(prices.seasonPass)
    }
  }, [prices, selectedTicket])

  const loadPrices = async () => {
    const data = await fetchPrices()
    setPrices(data)
  }

  const startPriceAutoRefresh = () => {
    priceRefreshInterval.current = setInterval(() => {
      loadPrices()
    }, 30000) // 30 seconds
  }

  const selectTicket = (type) => {
    setSelectedTicket(type)
    if (type === 'day-pass') {
      setSelectedPrice(prices.dayPass)
    } else if (type === 'season-pass') {
      setSelectedPrice(prices.seasonPass)
    }
  }

  const updatePrice = () => {
    // Price calculation happens in render
  }

  const totalAmount = selectedPrice * (parseInt(formData.quantity) || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedTicket) {
      alert('Please select a ticket type')
      return
    }

    if (!formData.fullName || !formData.email || !formData.phone || !formData.quantity) {
      alert('All fields are required')
      return
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      alert('Enter a valid 10-digit phone number')
      return
    }

    try {
      const order = await createOrder(totalAmount)
      
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Avesham Season 2',
        description: `${selectedTicket} - ${formData.quantity} ticket(s)`,
        order_id: order.id,
        handler: async (response) => {
          const result = await verifyPayment({
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            selectedTicketType: selectedTicket,
            quantity: parseInt(formData.quantity),
            totalAmount
          })

          if (result.status === 'success') {
            setBookingData({
              ...result.booking,
              downloadUrl: result.downloadUrl
            })
            setShowSuccess(true)
            
            // Reset form
            setFormData({ fullName: '', email: '', phone: '', quantity: '' })
            setSelectedTicket(null)
          } else {
            alert('Payment verification failed')
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        theme: { color: '#2563eb' }
      }

      const razorpay = await openRazorpayCheckout(options)
      razorpay.open()
    } catch (err) {
      console.error('Payment error:', err)
      alert('Failed to initiate payment. Please try again.')
    }
  }

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const ticketName = selectedTicket === 'day-pass' ? 'Day Pass' : selectedTicket === 'season-pass' ? 'Season Ticket' : ''

  return (
    <div className="app">
      {/* Navigation */}
      <nav>
        <div className="nav-container">
          <div className="logo">AVESHAM S2</div>
          <button className="nav-btn" onClick={scrollToBooking}>Book Now</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>AVESHAM SEASON - 2</h1>
          <p>TICKET BOOKING PORTAL</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container">
        <div className="two-column-layout">
          {/* Ticket Types */}
          <div className="ticket-types">
            <h2 className="section-title">Choose Your Ticket</h2>
            <div className="tickets-grid">
              {/* Day Pass Ticket */}
              <div
                className={`ticket-card ${selectedTicket === 'day-pass' ? 'selected' : ''}`}
                onClick={() => selectTicket('day-pass')}
              >
                <div className="ticket-header">
                  <h3>Day Pass</h3>
                  <div className="ticket-price">₹{prices.dayPass}</div>
                </div>
                <p className="ticket-description">Experience one day of thrilling football action</p>
                <ul className="ticket-features">
                  <li>Access to all matches on selected day</li>
                  <li>General seating area</li>
                  <li>Food court access</li>
                  <li>Digital ticket delivery</li>
                </ul>
                <button className="select-ticket-btn">Select Day Pass</button>
              </div>

              {/* Season Ticket */}
              <div
                className={`ticket-card ${selectedTicket === 'season-pass' ? 'selected' : ''}`}
                onClick={() => selectTicket('season-pass')}
              >
                <div className="ticket-header">
                  <h3>Season Ticket</h3>
                  <div className="ticket-price">₹{prices.seasonPass}</div>
                </div>
                <p className="ticket-description">Full tournament access with premium benefits</p>
                <ul className="ticket-features">
                  <li>Access to all tournament matches</li>
                  <li>Priority seating</li>
                  <li>Exclusive merchandise</li>
                  <li>Meet & greet opportunities</li>
                  <li>VIP parking access</li>
                </ul>
                <button className="select-ticket-btn">Select Season Ticket</button>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="booking-section" ref={bookingRef} id="booking">
            <h2>Complete Your Booking</h2>

            {selectedTicket && (
              <div className="selected-ticket-display" style={{ display: 'block' }}>
                Selected: <strong>{ticketName}</strong> - ₹{selectedPrice}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="full-name">Full Name *</label>
                <input
                  type="text"
                  id="full-name"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  pattern="[0-9]{10}"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Number of Tickets *</label>
                <select
                  id="quantity"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                >
                  <option value="">Select quantity</option>
                  <option value="1">1 Ticket</option>
                  <option value="2">2 Tickets</option>
                  <option value="3">3 Tickets</option>
                  <option value="4">4 Tickets</option>
                  <option value="5">5 Tickets</option>
                </select>
              </div>

              <div className="booking-summary">
                <h3>Booking Summary</h3>
                <div className="summary-row">
                  <span>Ticket Type:</span>
                  <span>{ticketName || '-'}</span>
                </div>
                <div className="summary-row">
                  <span>Quantity:</span>
                  <span>{formData.quantity || '-'}</span>
                </div>
                <div className="summary-row">
                  <span>Price per ticket:</span>
                  <span>₹{selectedPrice || 0}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              <button type="submit" className="confirm-btn">Confirm Booking</button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          {faqData.map((faq, index) => (
            <div key={index} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(index)}>
                <span>{faq.question}</span>
                <span className="faq-toggle">+</span>
              </div>
              <div className="faq-answer">{faq.answer}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <p>&copy; 2025 Avesham Season 2. All rights reserved.</p>
          <div className="media-partner">
            <h4>Media Partner</h4>
            <div className="partner-logo">
              <img src="/rawd-logoo.png" alt="Rawd Logo" />
            </div>
          </div>
        </div>
      </footer>

      {/* Success Popup */}
      {showSuccess && bookingData && (
        <>
          <div className="overlay show" onClick={() => setShowSuccess(false)}></div>
          <div className="success-popup show">
            <div className="success-icon">✓</div>
            <h3>Booking Confirmed!</h3>
            <p>Thank you for your booking!</p>
            <div style={{ margin: '15px 0', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #2563eb' }}>
              <p style={{ margin: '5px 0', fontWeight: 'bold', fontSize: '16px' }}>Serial Number: {bookingData.serialNumber}</p>
              <p style={{ margin: '10px 0', fontSize: '14px' }}>Download your ticket PDF using the link below:</p>
              {bookingData.downloadUrl && (
                <a
                  href={bookingData.downloadUrl}
                  download
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    marginTop: '10px',
                    transition: '0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
                  onMouseOut={(e) => e.target.style.background = '#2563eb'}
                >
                  📥 Download Ticket PDF
                </a>
              )}
              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#666' }}>A confirmation email with download link has been sent to your email address.</p>
            </div>
            <button className="close-popup-btn" onClick={() => {
              setShowSuccess(false)
              setBookingData(null)
            }}>Close</button>
          </div>
        </>
      )}

      {/* Admin Button */}
      <div className="admin-access">
        <button className="admin-btn" onClick={() => navigate('/admin/login')}>📊 Admin Panel</button>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <div className="scroll-top show" onClick={scrollToTop}>
          ↑
        </div>
      )}
    </div>
  )
}

const faqData = [
  {
    question: 'When does the tournament take place?',
    answer: 'The Avesham Season 2 tournament will be held across multiple weekends starting from next month. Specific dates will be communicated via email after booking.'
  },
  {
    question: 'Can I get a refund if I can\'t attend?',
    answer: 'Yes, refunds are available up to 7 days before the event. After that, tickets can be transferred to another person with prior notification.'
  },
  {
    question: 'What facilities are available at the venue?',
    answer: 'The venue features food courts, restrooms, first aid stations, parking facilities, and designated seating areas. Season ticket holders get access to VIP lounges.'
  },
  {
    question: 'How will I receive my tickets?',
    answer: 'All tickets are delivered digitally via email within 24 hours of booking. You can print them or show the digital version on your phone at the venue.'
  },
  {
    question: 'Is there an age restriction for entry?',
    answer: 'Children under 5 years get free entry but must be accompanied by an adult. All other attendees require a valid ticket regardless of age.'
  }
]

export default Home

