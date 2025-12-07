# EduCore Management - Deployment Guide

This guide will help you deploy the EduCore Management System to production using Vercel (Frontend) and Railway (Backend + Database).

## Prerequisites

- GitHub account
- Vercel account (free): https://vercel.com
- Railway account (free $5/month credit): https://railway.app

---

## Part 1: Deploy Backend + Database to Railway

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with your GitHub account
3. Verify your email

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy MySQL"
3. Wait for MySQL database to be created
4. Railway will provide a `DATABASE_URL` automatically

### Step 3: Add Backend Service
1. In the same project, click "New Service"
2. Select "GitHub Repo"
3. Choose your repository: `hoangquach243/educore-management`
4. Railway will auto-detect and deploy

### Step 4: Configure Environment Variables
1. Click on your backend service
2. Go to "Variables" tab
3. Add these variables:
   ```
   DATABASE_URL=${{MySQL.DATABASE_URL}}
   PORT=3001
   FRONTEND_URL=https://your-vercel-app.vercel.app
   NODE_ENV=production
   ```
4. Railway will auto-reference the MySQL DATABASE_URL

### Step 5: Setup Database Schema
1. In Railway, click on MySQL service
2. Click "Data" tab
3. Click "Query" and run the SQL from `database/educore_db.sql`
4. Or use a MySQL client with the provided connection string

### Step 6: Get Backend URL
1. Go to your backend service
2. Click "Settings" tab
3. Scroll to "Domains"
4. Click "Generate Domain"
5. Copy the URL (e.g., `https://your-app.up.railway.app`)

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with your GitHub account

### Step 2: Import Project
1. Click "Add New Project"
2. Import `hoangquach243/educore-management`
3. Vercel will auto-detect it's a Vite project

### Step 3: Configure Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Set Environment Variables
1. In "Environment Variables" section, add:
   ```
   VITE_API_URL=https://your-railway-backend.up.railway.app/api
   ```
   (Replace with your Railway backend URL from Part 1, Step 6)

2. Click "Deploy"

### Step 5: Get Frontend URL
1. After deployment completes
2. Vercel will provide a URL like `https://educore-management.vercel.app`
3. Copy this URL

### Step 6: Update Railway Backend
1. Go back to Railway
2. Update the `FRONTEND_URL` variable with your Vercel URL
3. Backend will automatically redeploy

---

## Part 3: Testing Deployment

### Test Backend
1. Visit: `https://your-railway-backend.up.railway.app/api/health`
2. Should return: `{"status":"OK","message":"Server is running"}`

### Test Frontend
1. Visit your Vercel URL
2. Try logging in with default credentials:
   - Admin: `admin@hcmut.edu.vn` / `admin123`
   - Teacher: `T0001@hcmut.edu.vn` / `123`
   - Student: `2211234@hcmut.edu.vn` / `123`

---

## Part 4: Database Seeding (Optional)

If you want sample data:

### Method 1: Using Railway Query Editor
1. Go to Railway → MySQL service → Data → Query
2. Copy and paste contents from `database/educore_db.sql`
3. Execute the query

### Method 2: Using MySQL Workbench/CLI
1. Get connection details from Railway MySQL service
2. Connect using MySQL Workbench or CLI:
   ```bash
   mysql -h <host> -P <port> -u <user> -p<password> <database>
   ```
3. Run: `source database/educore_db.sql`

---

## Environment Variables Reference

### Frontend (.env in Vercel)
```env
VITE_API_URL=https://your-backend.railway.app/api
```

### Backend (.env in Railway)
```env
DATABASE_URL=${{MySQL.DATABASE_URL}}
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

---

## Troubleshooting

### Frontend can't connect to backend
- Check CORS settings in `server/index.js`
- Verify `VITE_API_URL` is correct in Vercel
- Verify `FRONTEND_URL` is correct in Railway

### Database connection errors
- Check `DATABASE_URL` in Railway
- Ensure MySQL service is running
- Verify database schema is imported

### Build failures on Vercel
- Check build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Build failures on Railway
- Check that `server/package.json` has all dependencies
- Verify `railway.json` configuration
- Check Railway build logs

---

## Cost Estimate

- **Vercel**: Free tier (sufficient for small projects)
- **Railway**: $5/month credit (free tier)
  - MySQL: ~$1-2/month
  - Backend: ~$1-2/month
  - Total: ~$2-4/month (within free credit)

---

## Updating Your Deployment

### To update code:
1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. Both Vercel and Railway will auto-deploy from GitHub

### To rollback:
- Vercel: Go to "Deployments" → Select previous version → "Promote to Production"
- Railway: Go to "Deployments" → Click on previous deployment → "Redeploy"

---

## Custom Domain (Optional)

### For Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### For Railway (Backend)
1. Go to Service Settings → Domains
2. Add custom domain
3. Configure DNS CNAME record

---

## Security Recommendations

1. **Change default passwords** after deployment
2. **Enable HTTPS** (both platforms provide this automatically)
3. **Set strong MySQL password** in Railway
4. **Restrict CORS** to specific domains in production
5. **Add password hashing** (bcrypt) for production use
6. **Implement rate limiting** to prevent abuse

---

## Support

If you encounter issues:
- Check Railway logs: Service → Deployments → View Logs
- Check Vercel logs: Deployments → Select deployment → View Logs
- Review error messages carefully
- Ensure all environment variables are set correctly

---

## Next Steps

After successful deployment:
1. Change all default passwords
2. Add real user data
3. Configure backup strategy for database
4. Monitor usage and costs
5. Consider implementing password hashing
6. Set up monitoring/alerting

Happy deploying! 🚀
