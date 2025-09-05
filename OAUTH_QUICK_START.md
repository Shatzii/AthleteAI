# AthleteAI OAuth Setup - Automated

## 🚀 Quick Start

Your AthleteAI platform is now ready with OAuth authentication! Here's how to get started:

### Step 1: Automated Setup ✅ (Already Done)
- ✅ Environment configuration created
- ✅ Dependencies installed
- ✅ Secure secrets generated
- ✅ Development scripts created

### Step 2: Configure OAuth Applications

Run the setup helper for detailed instructions:
```bash
./setup_oauth.sh
```

This will guide you through creating OAuth apps on:
- 🌐 **Google Cloud Console**
- 🐙 **GitHub Developer Settings**
- 📘 **Facebook Developers**

### Step 3: Update Environment Variables

After creating OAuth applications, update `backend/.env` with your credentials:
```bash
# Edit backend/.env and replace the placeholder values:
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
GITHUB_CLIENT_ID=your_actual_github_client_id
GITHUB_CLIENT_SECRET=your_actual_github_client_secret
FACEBOOK_APP_ID=your_actual_facebook_app_id
FACEBOOK_APP_SECRET=your_actual_facebook_app_secret
```

### Step 4: Start Development Servers

```bash
./start_dev.sh
```

This will start both backend (port 5000) and frontend (port 3000).

### Step 5: Test OAuth Login

1. Open http://localhost:3000
2. Click "Login" in the header
3. Choose your preferred OAuth provider
4. Complete the OAuth flow
5. You'll be redirected to the dashboard

## 📋 Available Scripts

- `./check_setup.sh` - Verify your setup status
- `./setup_oauth.sh` - Get OAuth configuration instructions
- `./start_dev.sh` - Start development servers
- `./setup_oauth_automated.sh` - Re-run automated setup (if needed)

## 🔧 Manual OAuth Setup Links

- **Google**: https://console.cloud.google.com/
- **GitHub**: https://github.com/settings/developers
- **Facebook**: https://developers.facebook.com/

## 📖 Documentation

- `OAUTH_SETUP.md` - Complete setup guide
- `backend/.env.example` - Environment template
- `README.md` - General project documentation

## 🎉 What's Been Automated

✅ Environment file creation
✅ Secure JWT and session secrets generation
✅ Backend and frontend dependency installation
✅ Development startup scripts
✅ Setup verification tools
✅ Comprehensive documentation

## 🚨 Important Notes

- **OAuth Apps**: Must be created manually on each platform
- **Redirect URIs**: Use `http://localhost:5000/api/v1/auth/{provider}/callback`
- **HTTPS**: Required for production OAuth
- **Environment**: Update `backend/.env` with real OAuth credentials

## 🆘 Need Help?

1. Run `./check_setup.sh` to verify your configuration
2. Check `OAUTH_SETUP.md` for detailed instructions
3. Ensure MongoDB is running for the backend
4. Verify all OAuth credentials are properly set

---

**Ready to authenticate users with modern OAuth! 🔐**
