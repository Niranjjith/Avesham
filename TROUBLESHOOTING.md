# Troubleshooting 404 Error for Update Prices

## Quick Diagnosis Steps

### 1. Test if Backend is Running
Visit: `https://avesham.onrender.com/`
- ✅ Should return: `{"message":"Avesham Season 2 Backend Running Successfully",...}`
- ❌ If HTML/404: Server not running or wrong URL

### 2. Test Admin Routes
Visit: `https://avesham.onrender.com/api/admin/test`
- ✅ Should return: `{"status":"success","message":"Admin routes are working",...}`
- ❌ If 404: Routes not deployed or server needs restart

### 3. Check Render Logs
1. Go to Render Dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for:
   - `Backend running on port XXXX` ✅
   - `Database Connected` ✅
   - Any error messages ❌

### 4. Verify Deployment
- Check if latest code is pushed to Git
- Check if Render auto-deployed (look for recent deployments)
- Check deployment status (should be "Live")

## Common Causes & Solutions

### Cause 1: Code Not Deployed
**Solution:**
```bash
# 1. Commit and push your changes
git add .
git commit -m "Add update-prices route"
git push origin main

# 2. Check Render dashboard for deployment
# 3. Wait for deployment to complete
```

### Cause 2: Server Crashed
**Solution:**
1. Check Render logs for errors
2. Common issues:
   - Missing environment variables (JWT_SECRET, MONGO_URI)
   - Database connection failed
   - Import errors
3. Fix the error and redeploy

### Cause 3: Wrong Start Command
**Solution:**
In Render dashboard, check:
- **Start Command:** Should be `node backend/server.js` or `npm start`
- **Root Directory:** Should be set if backend is in subfolder
- **Build Command:** May need `npm install` if using dependencies

### Cause 4: Route Not Registered
**Solution:**
Verify in `backend/server.js`:
```javascript
app.use("/api/admin", adminRoutes);  // Must be present
```

And in `backend/routes/adminRoutes.js`:
```javascript
router.post("/update-prices", verifyAdmin, async (req, res) => {
  // Route handler
});
```

## Testing the Route Manually

### Using Browser Console:
```javascript
fetch('https://avesham.onrender.com/api/admin/update-prices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
  body: JSON.stringify({
    dayPass: 199,
    seasonPass: 699
  })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
```

### Using curl:
```bash
curl -X POST https://avesham.onrender.com/api/admin/update-prices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"dayPass":199,"seasonPass":699}'
```

## Expected Behavior

### ✅ Working Response:
```json
{
  "status": "success",
  "message": "Prices updated successfully",
  "prices": {
    "dayPass": 199,
    "seasonPass": 699
  }
}
```

### ❌ 404 HTML Response:
```html
<!DOCTYPE html>
<html>
  <head><title>404 Not Found</title></head>
  <body>404 Not Found</body>
</html>
```
This means the route doesn't exist on the server.

## Render-Specific Issues

### Issue: Render serves static files first
If you have a `public` folder, Render might serve it before API routes.

**Solution:** Ensure API routes are registered before static file serving, or use a different path structure.

### Issue: Render health checks
Render might be hitting your root path. Ensure `/` route returns JSON, not HTML.

### Issue: Environment Variables
Check Render dashboard → Environment:
- `JWT_SECRET` - Required for admin auth
- `MONGO_URI` - Required for database
- `RAZORPAY_KEY_ID` - Optional (for payments)
- `RAZORPAY_SECRET` - Optional (for payments)

## Quick Fix Checklist

- [ ] Code is committed and pushed to Git
- [ ] Render deployment completed successfully
- [ ] Server logs show "Backend running on port XXXX"
- [ ] Database connection successful
- [ ] Environment variables are set
- [ ] `/api/admin/test` returns JSON (not 404)
- [ ] Admin token is valid (not expired)
- [ ] Route is registered in server.js
- [ ] Route handler exists in adminRoutes.js

## Still Not Working?

1. **Check Network Tab:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try updating prices
   - Check the request URL and response

2. **Check Console:**
   - Look for JavaScript errors
   - Check the detailed logs we added

3. **Verify Token:**
   - Make sure you're logged in
   - Token might be expired (try logging out and back in)

4. **Contact Support:**
   - Share Render logs
   - Share browser console errors
   - Share Network tab request/response




