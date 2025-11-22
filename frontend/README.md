# Avesham Frontend - React App

This is the React frontend for the Avesham Season 2 ticket booking portal.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```
VITE_API_URL=https://avesham.onrender.com/api
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

The build output will be in the `dist` folder at the root level (configured in vite.config.js).

## Project Structure

```
frontend/
├── src/
│   ├── pages/          # Page components
│   ├── components/     # Reusable components
│   ├── utils/          # Utility functions
│   ├── styles/         # CSS files
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Features

- React Router for navigation
- Same design as original HTML version
- Razorpay payment integration
- Admin dashboard
- Real-time price updates

