# 🚀 Quick Vercel Deployment Guide

## Step 1: Prepare Your Project

The project is already configured! You have:
- ✅ `vercel.json` - Vercel configuration
- ✅ `build:web` script in package.json
- ✅ `.env.example` - Environment variable template

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with GitHub
3. **Click "Add New Project"**
4. **Import your repository**: `manwelAC/RiCement`
5. **IMPORTANT - Set Root Directory**:
   - Since your project files are in the `RiCement-1` subfolder, you must set:
   - **Root Directory**: `RiCement-1`
   - This tells Vercel where your `package.json` and source code are located
6. **Configure Project**:
   - Root Directory: `RiCement-1` ⚠️ **IMPORTANT**
   - Framework Preset: **Other**
   - Build Command: `npm run build:web`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Add Environment Variables**:
   Click "Environment Variables" and add these:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBHfgEDnT4S0DbFeU49g9t8o6hnFEF4cfU
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=ricement-app.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=ricement-app
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=ricement-app.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=944185075287
   EXPO_PUBLIC_FIREBASE_APP_ID=1:944185075287:web:4a893c1ce274668eb26512
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-3DDS6D1WQ3
   ```

7. **Click "Deploy"**

### Option B: Deploy via Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Step 3: Update Firebase Settings

After deployment, you'll get a URL like `https://your-project.vercel.app`

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `ricement-app`
3. **Go to Authentication → Settings → Authorized domains**
4. **Add your Vercel domain**: `your-project.vercel.app`

## Step 4: Test Your Admin Panel

1. Visit your Vercel URL
2. You should see the admin login page
3. Login with your admin credentials
4. Test all features:
   - Dashboard
   - Projects management
   - Users management
   - Complaints management

## 🎉 You're Done!

Your admin panel is now live at: `https://your-project.vercel.app`

## Automatic Deployments

Every time you push to GitHub, Vercel will automatically:
- Build your project
- Deploy to production
- Give you a unique preview URL for each commit

## Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `admin.ricement.com`)
4. Follow DNS configuration instructions
5. Update Firebase authorized domains

## Troubleshooting

### Build Fails?
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Try building locally: `npm run build:web`

### Can't Login?
- Check Firebase authorized domains include your Vercel URL
- Verify environment variables are set correctly
- Check browser console for errors

### Assets Not Loading?
- Clear Vercel cache and redeploy
- Check asset paths in your code

## Need Help?

Check the detailed guide: `VERCEL_DEPLOYMENT.md`
