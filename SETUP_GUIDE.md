# Avesham Project Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)
- MongoDB database (local or cloud like MongoDB Atlas)
- Razorpay account (for payments)

## Project Structure

```
Avesham/
├── backend/     # Node.js/Express API server
└── frontend/    # React frontend application
```

## Step 1: Backend Setup

### 1.1 Navigate to backend directory
```bash
cd backend
```

### 1.2 Install dependencies
```bash
npm install
```

### 1.3 Create `.env` file
Create a `.env` file in the `backend/` directory with the following variables:

```env
# MongoDB Connection
MONGO_URI=your_mongodb_connection_string

# JWT Secret for Admin Authentication
JWT_SECRET=your_secret_key_here_make_it_long_and_random

# Razorpay Credentials
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret

# Server Port (optional, defaults to 5000)
PORT=5000
```

### 1.4 Start the backend server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The backend will run on `http://localhost:5000`

## Step 2: Frontend Setup

### 2.1 Navigate to frontend directory
Open a new terminal and navigate to frontend:
```bash
cd frontend
```

### 2.2 Install dependencies
```bash
npm install
```

### 2.3 Create `.env` file (Optional)
Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

If you don't create this, it will default to `https://avesham.onrender.com/api`

### 2.4 Start the development server
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Step 3: Build for Production

### 3.1 Build the React app
```bash
cd frontend
npm run build
```

This creates a `dist/` folder with the production build.

### 3.2 Run backend (which serves the React build)
```bash
cd backend
npm start
```

The backend will serve both:
- API routes at `/api/*`
- React app for all other routes

## Quick Start (Both Servers)

### Terminal 1 - Backend:
```bash
cd backend
npm install
# Create .env file with your credentials
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables Explained

### Backend `.env`:
- **MONGO_URI**: Your MongoDB connection string
  - Local: `mongodb://localhost:27017/avesham`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/avesham`
  
- **JWT_SECRET**: A random secret string for signing JWT tokens
  - Generate one: `openssl rand -base64 32`
  
- **RAZORPAY_KEY_ID**: Your Razorpay Key ID from dashboard
- **RAZORPAY_SECRET**: Your Razorpay Secret from dashboard
- **PORT**: Server port (default: 5000)

### Frontend `.env`:
- **VITE_API_URL**: Backend API URL
  - Development: `http://localhost:5000/api`
  - Production: `https://avesham.onrender.com/api`

## Testing the Setup

1. **Backend Health Check:**
   - Visit: `http://localhost:5000/`
   - Should see: `{"message":"Avesham Season 2 Backend Running Successfully"}`

2. **Frontend:**
   - Visit: `http://localhost:3000`
   - Should see the booking page

3. **API Test:**
   - Visit: `http://localhost:5000/api/public/prices`
   - Should see: `{"dayPass":199,"seasonPass":699}`

## Admin Access

- **URL**: `http://localhost:3000/admin/login`
- **Username**: `avesham`
- **Password**: `avesham1234`

## Troubleshooting

### Backend won't start:
- Check if MongoDB is running
- Verify `.env` file exists and has correct values
- Check if port 5000 is available
- Look at console for error messages

### Frontend won't start:
- Make sure Node.js version is 16+
- Delete `node_modules` and `package-lock.json`, then `npm install` again
- Check if port 3000 is available

### API calls failing:
- Make sure backend is running
- Check CORS settings in `backend/server.js`
- Verify API URL in frontend `.env` file

### Database connection issues:
- Verify MongoDB URI is correct
- Check if MongoDB service is running (if local)
- For Atlas: Check IP whitelist and credentials

## Production Deployment

1. Build frontend: `cd frontend && npm run build`
2. Deploy backend to your hosting (Render, Heroku, etc.)
3. Set environment variables in hosting platform
4. Backend will serve the React app from `dist/` folder

## Development Workflow

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Make changes to code
4. Frontend auto-reloads, backend auto-restarts (with nodemon)
5. Test changes in browser




