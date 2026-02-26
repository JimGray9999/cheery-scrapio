# 🚀 Railway Deployment Guide

This guide walks you through deploying Cheery Scrapio to Railway using GitHub Actions.

## 📖 Table of Contents

1. [How It Works](#how-it-works)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Understanding the Files](#understanding-the-files)
5. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## How It Works

### The Deployment Pipeline

```
┌─────────────┐
│  Git Push   │  You push code to GitHub
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CI Tests   │  GitHub Actions runs tests
└──────┬──────┘
       │
       ▼ (if tests pass)
┌─────────────┐
│Build Docker │  Creates Docker image from Dockerfile
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Railway   │  Deploys to Railway's infrastructure
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Health Check │  Verifies app is running
└─────────────┘
```

### Why This Setup?

1. **Docker** - Packages your app with all dependencies
2. **GitHub Actions** - Automates the deployment process
3. **Railway** - Provides hosting infrastructure
4. **Health Checks** - Ensures deployments are successful

---

## Prerequisites

- GitHub account with this repository
- Railway account (sign up at https://railway.app)
- Basic understanding of environment variables

---

## Step-by-Step Setup

### 1. Create a Railway Account

Go to https://railway.app and sign up:

- Click "Login with GitHub"
- Authorize Railway to access your GitHub
- You'll get $5 free credit per month

### 2. Create a New Railway Project

**Option A: Through Railway Dashboard**

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `cheery-scrapio`
4. Railway will automatically detect it's a Node.js/Docker app

**Option B: Using Railway CLI** (recommended for learning)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Link to this directory
railway link
```

### 3. Add MongoDB to Your Railway Project

Railway makes this super easy:

1. In your Railway project dashboard, click **"New"**
2. Select **"Database"**
3. Choose **"MongoDB"**
4. Railway will provision a MongoDB instance and give you a connection string

**Why separate database?**

- Persistent storage (data survives deployments)
- Automatic backups
- Better performance
- Scales independently

### 4. Configure Environment Variables in Railway

In your Railway project dashboard:

1. Click on your **web service** (not the database)
2. Go to **"Variables"** tab
3. Add these variables:

```bash
NODE_ENV=production
PORT=5000

# Railway provides MONGODB_URI automatically when you add MongoDB
# But you can override it or use an external MongoDB:
# MONGODB_URI=mongodb://user:pass@host:port/database

# Scraping URLs (optional - defaults are in config)
SCRAPE_URL_LEFT=https://www.democraticunderground.com/?com=forum&id=1014
SCRAPE_URL_RIGHT=http://www.freerepublic.com/tag/breaking-news/index?tab=articles
SCRAPE_URL_CENTER=http://www.bbc.com/news/world/us_and_canada
```

**Pro Tip:** Railway automatically connects your MongoDB service to your app by setting the `MONGODB_URI` variable.

### 5. Get Your Railway Token

This token allows GitHub Actions to deploy to Railway:

1. Go to https://railway.app/account/tokens
2. Click **"Create New Token"**
3. Give it a name like "GitHub Actions Deploy"
4. Copy the token (you'll only see it once!)

**What is a token?**
Think of it like a password that only has permission to deploy your app. It's safer than using your actual Railway password.

### 6. Add Secrets to GitHub

Secrets are encrypted environment variables that GitHub Actions can use:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these two secrets:

**Secret 1: RAILWAY_TOKEN**

```
Name: RAILWAY_TOKEN
Value: [paste the token from step 5]
```

**Secret 2: RAILWAY_APP_URL**

```
Name: RAILWAY_APP_URL
Value: https://your-app.up.railway.app
```

To find your Railway app URL:

- Go to your Railway project
- Click on your web service
- Look for "Domains" section
- Copy the `.railway.app` URL

**Why secrets?**

- Keeps sensitive data (tokens, URLs) out of your code
- Prevents unauthorized access
- Can be rotated without changing code

### 7. Enable GitHub Actions

Your workflow files are already in `.github/workflows/`. To enable them:

1. Go to your GitHub repository
2. Click the **"Actions"** tab
3. If prompted, click **"I understand my workflows, go ahead and enable them"**

### 8. Test the Deployment

Now let's trigger a deployment:

**Method 1: Push to main/master**

```bash
git checkout main  # or master
git pull origin main
git merge your-feature-branch
git push origin main
```

**Method 2: Manual trigger**

1. Go to **Actions** tab in GitHub
2. Click **"Deploy to Railway"** workflow
3. Click **"Run workflow"**
4. Select branch and click **"Run workflow"**

### 9. Monitor the Deployment

**In GitHub:**

1. Go to **Actions** tab
2. Click on the running workflow
3. Watch each step execute in real-time

**In Railway:**

1. Go to your project dashboard
2. Click on your web service
3. Go to **"Deployments"** tab
4. Watch logs in real-time

---

## Understanding the Files

### `.github/workflows/deploy.yml`

This is the GitHub Actions workflow that automates deployment:

```yaml
workflow_run:
  workflows: ['CI/CD Pipeline']
  # ↑ Waits for CI tests to pass before deploying
```

**Key sections:**

1. **Triggers** - When to run (after CI passes, or manually)
2. **Install Railway CLI** - Downloads the deployment tool
3. **Deploy** - `railway up` builds and deploys your Docker image
4. **Health Check** - Verifies the app is running

### `railway.json`

Tells Railway how to build and run your app:

```json
{
  "build": {
    "builder": "DOCKERFILE" // Use your Dockerfile
  },
  "deploy": {
    "startCommand": "node server.js", // How to start the app
    "healthcheckPath": "/health" // Where to check if it's alive
  }
}
```

### `Dockerfile`

Instructions for building your app's container:

1. **Builder stage** - Installs dependencies
2. **Production stage** - Copies app, runs as non-root user
3. **Health check** - Tests if the app is responding
4. **Start command** - Runs `node server.js`

---

## Monitoring & Troubleshooting

### Viewing Logs

**Railway Dashboard:**

```
Project → Service → Logs
```

**Railway CLI:**

```bash
railway logs
```

### Common Issues

**❌ "Health check failed"**

Check that:

- Your `/health` endpoint returns 200 status
- App is listening on the correct PORT
- MongoDB connection is successful

**❌ "Railway token invalid"**

- Regenerate token in Railway dashboard
- Update `RAILWAY_TOKEN` secret in GitHub

**❌ "Build failed"**

- Check Docker build logs in Railway
- Ensure all dependencies are in `package.json`
- Verify Dockerfile syntax

**❌ "MongoDB connection failed"**

- Check `MONGODB_URI` is set correctly in Railway
- Verify MongoDB service is running
- Check MongoDB connection string format

### Debugging Commands

```bash
# View Railway project info
railway status

# View environment variables
railway variables

# SSH into your running container
railway run bash

# View real-time logs
railway logs --follow

# Restart service
railway restart
```

### Cost Monitoring

Railway provides $5 free credit per month:

- **Web service** ~$5-10/month (depends on usage)
- **MongoDB** ~$5-10/month (depends on storage)

Check usage:

```
Project Dashboard → Usage
```

---

## What Happens on Each Deploy

1. **Code pushed to GitHub**
   - Your changes are in version control

2. **CI Pipeline runs**
   - Linting (code style check)
   - Tests (19 unit tests)
   - Docker build test

3. **If CI passes, Deploy Pipeline runs**
   - Builds production Docker image
   - Uploads to Railway
   - Railway runs new container
   - Old container kept running until new one is healthy

4. **Health Check**
   - Calls `/health` endpoint
   - If successful: new container takes over
   - If fails: rolls back to old container

5. **Done!**
   - Your app is live
   - Zero downtime deployment

---

## Best Practices

### Before Deploying

- ✅ Run tests locally: `npm test`
- ✅ Build Docker image: `docker build -t test .`
- ✅ Test Docker container: `docker run -p 5000:5000 test`
- ✅ Commit and push to feature branch first
- ✅ Create PR and review changes

### Environment Variables

- 🔒 Never commit `.env` file
- 🔒 Always use Railway Variables for secrets
- ✅ Document all required variables
- ✅ Use different values for dev/prod

### Monitoring

- 📊 Check Railway logs regularly
- 📊 Set up error tracking (Sentry, etc.)
- 📊 Monitor resource usage
- 📊 Set up alerts for errors

---

## Useful Railway Commands

```bash
# Link local project to Railway
railway link

# View all environment variables
railway variables

# Set a variable
railway variables --set KEY=value

# Deploy from local machine
railway up

# Open app in browser
railway open

# View logs
railway logs --tail 100

# SSH into container
railway shell

# View project info
railway status

# Disconnect project
railway unlink
```

---

## Next Steps

Now that deployment is automated, consider:

1. **Staging Environment** - Create a separate Railway project for testing
2. **Database Backups** - Set up automated MongoDB backups
3. **Custom Domain** - Add your own domain in Railway settings
4. **Monitoring** - Set up error tracking and analytics
5. **Cron Jobs** - Schedule automatic article scraping

---

## Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## Questions?

If something isn't working:

1. Check Railway logs: `railway logs`
2. Check GitHub Actions logs: GitHub → Actions tab
3. Review this guide's troubleshooting section
4. Check Railway's status page: https://status.railway.app/

Happy deploying! 🚀
