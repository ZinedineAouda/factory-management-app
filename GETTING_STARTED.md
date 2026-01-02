# 🚀 Getting Started - Quick Reference

This is a quick reference guide. For detailed instructions, see [README.md](./README.md).

## ⚡ Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Shared Package
```bash
npm run build:shared
```

### 3. Start Backend
```bash
npm run dev:backend
```
Backend runs on: `http://localhost:3000`

### 4. Start Web App (New Terminal)
```bash
npm run dev:web
```
Web app runs on: `http://localhost:3001`

### 5. Login
- Username: `admin`
- Password: `admin1234`

## 📚 Documentation

- **[README.md](./README.md)** - Complete project documentation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - How to host your website (FREE)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical details
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history

## 🆘 Common Issues

### Port 3000 Already in Use
```bash
cd backend
npm run kill-port
npm run dev
```

### Build Errors
```bash
# Clean install
rm -rf node_modules
npm install
npm run build:shared
```

### Can't Login
- Make sure backend is running
- Check browser console for errors
- Verify database exists: `backend/factory_management.db`

## 🎯 Next Steps

1. ✅ Get it running locally
2. ✅ Explore the features
3. ✅ Read [DEPLOYMENT.md](./DEPLOYMENT.md) to host it online
4. ✅ Customize for your needs

---

**Need Help?** Check the full [README.md](./README.md) or [DEPLOYMENT.md](./DEPLOYMENT.md)

