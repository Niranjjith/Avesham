# How to Run the Avesham Project

## Quick Start Guide

### Prerequisites
- Node.js (v16 or higher) - [Download](https://nodejs.org/)
- npm (comes with Node.js)
- MongoDB database (local or MongoDB Atlas)
- Razorpay account (for payments)

---

## Step-by-Step Setup

### 1. Backend Setup

#### Navigate to backend folder:
```bash
cd backend
```

#### Install dependencies:
```bash
npm install
```

#### Create `.env` file:
Create a file named `.env` in the `backend/` folder with:

```env
MONGO_URI=mongodb://localhost:27017/avesham
JWT_SECRET=your_super_secret_jwt_key_here
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_SECRET=your_razorpay_secret
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
BASE_URL=http://localhost:5000
PORT=5000
```

**For Production:**
```env
BASE_URL=https://your-domain.com
```

**For MongoDB Atlas (Cloud):**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/avesham
```

#### Start backend server:
```bash
# Development mode (auto-reload on changes)
npm run dev

# OR Production mode
npm start
```

✅ Backend runs on: `http://localhost:5000`

---

### 2. Frontend Setup

#### Open a NEW terminal window and navigate to frontend:
```bash
cd frontend
```

#### Install dependencies:
```bash
npm install
```

#### (Optional) Create `.env` file:
Create a file named `.env` in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:5000/api
```

If you skip this, it will use the production API URL.

#### Start frontend development server:
```bash
npm run dev
```

✅ Frontend runs on: `http://localhost:3000`

---

## Running Both Servers

You need **TWO terminal windows**:

### Terminal 1 - Backend:
```bash
cd backend
npm install          # First time only
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm install          # First time only
npm run dev
```

Then open your browser: `http://localhost:3000`

---

## Production Build

### Build React app:
```bash
cd frontend
npm run build
```

This creates a `dist/` folder with the production build.

### Run backend (serves React build):
```bash
cd backend
npm start
```

Now the backend serves both:
- API at `/api/*`
- React app for all other routes

Visit: `http://localhost:5000`

---

## Environment Variables

### Backend `.env` Required:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for admin JWT tokens
- `RAZORPAY_KEY_ID` - Your Razorpay key
- `RAZORPAY_SECRET` - Your Razorpay secret
- `PORT` - Server port (default: 5000)

### Frontend `.env` (Optional):
- `VITE_API_URL` - Backend API URL (default: production URL)

---

## Testing

1. **Backend Health**: `http://localhost:5000/`
2. **Frontend**: `http://localhost:3000`
3. **API Test**: `http://localhost:5000/api/public/prices`

---

## Admin Login

- URL: `http://localhost:3000/admin/login`
- Username: `avesham`
- Password: `avesham1234`

---

## Troubleshooting

### Port already in use?
- Change `PORT` in backend `.env`
- Or kill process using port 5000/3000

### MongoDB connection failed?
- Check if MongoDB is running (if local)
- Verify connection string in `.env`
- Check network/firewall for Atlas

### Module not found errors?
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Frontend can't connect to backend?
- Make sure backend is running
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS settings

### "Server returned HTML instead of JSON" error?
This error means the backend route doesn't exist or the backend isn't running.

**For Local Development:**
1. **Check if backend is running:**
   ```bash
   # In backend folder
   npm start
   # Should see: "Backend running on port 5000"
   ```

2. **Verify backend is accessible:**
   - Open: `http://localhost:5000/`
   - Should see JSON: `{"message": "Avesham Season 2 Backend Running Successfully"}`
   - Test route: `http://localhost:5000/api/admin/test`
   - Should see JSON: `{"status": "success", "message": "Admin routes are working"}`

3. **Check API URL in browser console:**
   - Open browser DevTools (F12)
   - Check Console tab
   - Look for: `API Configuration: { API_BASE_URL: "http://localhost:5000/api", ... }`
   - If it shows `https://avesham.onrender.com/api`, the frontend is using production URL

4. **Fix API URL:**
   - Create `frontend/.env` file:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```
   - Restart frontend dev server (Ctrl+C, then `npm run dev`)

**For Production/Deployment:**
1. Ensure backend code is deployed to Render
2. Verify route exists: `/api/admin/update-prices`
3. Check Render logs for errors
4. Ensure environment variables are set in Render dashboard

---

## Project Structure

```
Avesham/
├── backend/          # Node.js API server
│   ├── .env         # Environment variables (create this)
│   ├── server.js    # Main server file
│   └── ...
├── frontend/         # React app
│   ├── .env         # Frontend env (optional)
│   ├── src/         # React source code
│   └── ...
└── dist/            # React build output (after npm run build)
```

---

## Common Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev          # Development mode
npm start            # Production mode

# Frontend
cd frontend
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## Next Steps

1. ✅ Install dependencies in both folders
2. ✅ Create `.env` files with your credentials
3. ✅ Start both servers
4. ✅ Visit `http://localhost:3000`
5. ✅ Test booking flow
6. ✅ Login to admin panel

For more details, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

