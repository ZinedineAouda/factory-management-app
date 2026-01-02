# Git Setup & GitHub Deployment Guide

## ✅ Step 1: Verify Git Configuration

Your Git is already configured:
- **Name:** GizmoBytes
- **Email:** 94705828+ZinedineAouda@users.noreply.github.com

## 📝 Step 2: Create GitHub Repository

1. **Go to GitHub**: Open [github.com](https://github.com) in your browser
2. **Sign in** to your account
3. **Create New Repository**:
   - Click the **"+"** icon in the top right
   - Select **"New repository"**
   - **Repository name**: `factory-management-app` (or any name you like)
   - **Description**: "Factory Management System with React Web App and Node.js Backend"
   - **Visibility**: Choose **Public** (required for free hosting)
   - **DO NOT** check "Initialize with README" (we already have one)
   - Click **"Create repository"**

4. **Copy the repository URL** - You'll see something like:
   ```
   https://github.com/YOUR_USERNAME/factory-management-app.git
   ```

## 🚀 Step 3: Push Your Code to GitHub

Run these commands in your terminal (in the project folder):

```bash
# 1. Add all files
git add .

# 2. Create your first commit
git commit -m "Initial commit: Factory Management System v1.0.0"

# 3. Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/factory-management-app.git

# 4. Rename branch to main (if needed)
git branch -M main

# 5. Push to GitHub
git push -u origin main
```

### If you get authentication errors:

**Option 1: Use Personal Access Token (Recommended)**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "Factory Management App"
4. Select scopes: Check **"repo"** (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. When Git asks for password, **paste the token** instead of your password

**Option 2: Use GitHub CLI**
```bash
# Install GitHub CLI if you don't have it
# Then authenticate
gh auth login
```

## ✅ Step 4: Verify Upload

1. Go to your GitHub repository page
2. You should see all your files there
3. Check that these files are present:
   - README.md
   - DEPLOYMENT.md
   - package.json
   - backend/
   - packages/

## 🎯 Step 5: Deploy (Follow DEPLOYMENT.md)

Once your code is on GitHub, follow the **[DEPLOYMENT.md](./DEPLOYMENT.md)** guide to:
1. Host backend on Railway or Render
2. Host frontend on Vercel
3. Connect everything together

## 🔄 Updating Your Code

Every time you make changes:

```bash
git add .
git commit -m "Description of your changes"
git push
```

The hosting platforms will automatically redeploy!

## ❓ Troubleshooting

### "Repository not found"
- Check the repository URL is correct
- Make sure the repository exists on GitHub
- Verify you have access to it

### "Authentication failed"
- Use Personal Access Token instead of password
- Make sure token has "repo" permissions

### "Permission denied"
- Check your GitHub username is correct
- Verify repository name matches

---

**Need Help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting instructions after you push to GitHub!

