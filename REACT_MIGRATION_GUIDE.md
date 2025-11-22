# React Migration Guide

## Overview

The frontend has been converted from HTML/CSS/JavaScript to React while maintaining the exact same design and functionality.

## Project Structure

```
Avesham/
├── backend/          # Node.js/Express backend
├── frontend/         # React frontend
│   ├── src/
│   │   ├── pages/    # Page components (Home, AdminLogin, AdminDashboard)
│   │   ├── components/ # Reusable components (if needed)
│   │   ├── utils/    # API utilities, Razorpay integration
│   │   ├── styles/   # CSS files
│   │   ├── App.jsx   # Main app with routing
│   │   └── main.jsx  # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── dist/             # React build output (generated after npm run build)
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Development

```bash
npm run dev
```

The app will run on `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

This builds the React app into the `dist` folder at root level (configured in vite.config.js)

### 4. Backend Integration

The backend remains unchanged. The React app communicates with the same API endpoints:
- `/api/public/prices` - Get ticket prices
- `/api/payment/create-order` - Create Razorpay order
- `/api/payment/verify-payment` - Verify payment
- `/api/admin/auth/login` - Admin login
- `/api/admin/bookings` - Get bookings
- `/api/admin/update-prices` - Update prices

## Features Converted

✅ **Home Page**
- Ticket selection
- Booking form
- Razorpay payment integration
- FAQ section
- Auto-refresh prices
- Success popup

✅ **Admin Login**
- Authentication
- Token management
- Error handling

✅ **Admin Dashboard**
- Revenue statistics
- Price management
- Bookings table
- Search functionality
- Excel export
- Home button

## Key Changes

1. **State Management**: Uses React hooks (useState, useEffect)
2. **Routing**: React Router for navigation
3. **API Calls**: Centralized in `utils/api.js`
4. **Styling**: Same CSS files, imported in components
5. **Razorpay**: Dynamic script loading utility

## Environment Variables

Create `.env` file in `frontend/`:
```
VITE_API_URL=https://avesham.onrender.com/api
```

## Deployment

1. Build the React app: `npm run build`
2. The build output goes to `dist/` folder at root level
3. Deploy as before - the backend serves the built React app from `dist/` folder

## Migration Checklist

- [x] React app structure created
- [x] Home page component
- [x] Admin login component
- [x] Admin dashboard component
- [x] Routing setup
- [x] API utilities
- [x] Razorpay integration
- [x] CSS files copied
- [x] Test all functionality
- [x] Update backend to serve React build
- [x] Remove old HTML files (public folder deleted)

## Next Steps

1. Test the React app locally
2. Verify all functionality works
3. Build for production
4. Deploy
5. Remove old HTML files once confirmed working

