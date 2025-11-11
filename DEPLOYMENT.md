# Deployment Guide

This guide covers deploying The Café employee management system to free hosting platforms.

## 🌟 Option 1: Render (Recommended for SQLite)

Render is the best option because it provides **persistent disk storage** for your SQLite database.

### Prerequisites
- GitHub account
- Render account (sign up at https://render.com)

### Steps

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically

3. **Deploy**
   - Click "Apply"
   - Wait 5-10 minutes for build
   - Your app will be live at `https://your-app-name.onrender.com`

### Important Notes
- Free tier sleeps after 15 minutes of inactivity (first request takes 30-50 seconds to wake up)
- Database persists on the mounted disk
- SSL certificates are automatic

---

## 🔄 Option 2: Railway (Alternative)

Railway also supports SQLite with persistent volumes.

### Steps

1. **Sign up at https://railway.app**

2. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Configure Settings**
   ```
   Build Command: npm install && npm run build
   Start Command: npm run start
   ```

4. **Add Environment Variables**
   - `NODE_ENV=production`
   - `SESSION_SECRET=<generate-random-string>`

5. **Add Volume** (for SQLite persistence)
   - Go to "Settings" → "Volumes"
   - Mount path: `/app`

### Free Tier
- $5 credit/month (no credit card required)
- Sleeps after inactivity
- 1 GB storage

---

## ⚡ Option 3: Vercel + Separate Backend (Split Deployment)

If you want the frontend on Vercel (best React hosting), you'll need to deploy the backend separately.

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend only
cd client
vercel --prod
```

### Backend (Render/Railway)
Deploy the Express server separately using Option 1 or 2 above.

### Update API URLs
In `client/src/lib/queryClient.ts`, update the API base URL to your backend URL.

---

## 🐳 Option 4: Fly.io (Docker-based)

Best for production-grade deployments with global edge network.

### Steps

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login and Initialize**
   ```bash
   fly auth login
   fly launch
   ```

3. **Deploy**
   ```bash
   fly deploy
   ```

### Free Tier
- 3 shared-cpu VMs
- 256 MB RAM each
- 1 GB persistent volume
- No sleep/cold starts

---

## 📦 Option 5: Netlify (Frontend) + Render (Backend)

Similar to Vercel option - split frontend and backend.

---

## 🎯 Comparison Table

| Platform | Best For | SQLite Support | Free Tier | Cold Starts |
|----------|----------|----------------|-----------|-------------|
| **Render** | Full-stack SQLite apps | ✅ Yes (1GB disk) | 750 hrs/month | 30-50s |
| **Railway** | Simple deployment | ✅ Yes (volume) | $5 credit/month | ~20s |
| **Fly.io** | Production apps | ✅ Yes (volume) | 3 VMs, 1GB disk | None |
| **Vercel** | Frontend only | ❌ No | Unlimited | None |
| **Netlify** | Frontend only | ❌ No | Unlimited | None |

---

## ⚙️ Environment Variables Required

For any deployment, set these environment variables:

```env
NODE_ENV=production
PORT=10000  # Or whatever the platform provides
SESSION_SECRET=<generate-a-random-secure-string>
```

To generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔒 Security Checklist Before Deploying

- [ ] Change default passwords in sample data
- [ ] Set strong `SESSION_SECRET`
- [ ] Review CORS settings in `server/routes.ts`
- [ ] Enable HTTPS only cookies in production
- [ ] Consider adding rate limiting
- [ ] Review authentication logic

---

## 🐛 Troubleshooting

### "Cannot find module" errors
Make sure all dependencies are in `dependencies`, not `devDependencies`:
```bash
npm install --save <package-name>
```

### Database not persisting
- Ensure persistent disk/volume is mounted
- Check the database path matches the mount point

### Port binding errors
Most platforms set `PORT` env variable automatically. Your app already handles this:
```javascript
const port = parseInt(process.env.PORT || '5000', 10);
```

---

## 📚 Post-Deployment

After deployment:

1. **Test the app** - Visit your deployed URL
2. **Complete setup** - Run the initial setup wizard
3. **Create your first manager account**
4. **Share employee login URLs** with your team

---

## 💡 Recommended: Render

For this app, **Render** is the best choice because:
- ✅ One-click deployment with `render.yaml`
- ✅ Persistent SQLite database included
- ✅ No complex configuration needed
- ✅ Free SSL certificates
- ✅ GitHub auto-deploy on push

**Start here:** https://render.com

---

Need help? Check the [Render documentation](https://render.com/docs) or ask in their community forum.
