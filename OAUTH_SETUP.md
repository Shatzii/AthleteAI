# OAuth Setup Guide for AthleteAI

This guide will help you set up OAuth authentication for the AthleteAI platform using Google, GitHub, and Facebook.

## Prerequisites

1. Node.js and npm installed
2. MongoDB database
3. OAuth applications created with the providers you want to use

## OAuth Provider Setup

### 1. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" > "OAuth 2.0 Client IDs"
6. Configure the OAuth consent screen
7. Set the application type to "Web application"
8. Add authorized redirect URIs:
   - `http://localhost:5000/api/v1/auth/google/callback` (for development)
   - `https://yourdomain.com/api/v1/auth/google/callback` (for production)
9. Copy the Client ID and Client Secret

### 2. GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: AthleteAI
   - Homepage URL: `http://localhost:3000` (or your production URL)
   - Authorization callback URL: `http://localhost:5000/api/v1/auth/github/callback`
4. Copy the Client ID and Client Secret

### 3. Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add the "Facebook Login" product
4. Go to Facebook Login > Settings
5. Add valid OAuth redirect URIs:
   - `http://localhost:5000/api/v1/auth/facebook/callback`
6. Copy the App ID and App Secret

## Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/athleteai
MONGODB_TEST_URI=mongodb://localhost:27017/athleteai_test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Session Configuration
SESSION_SECRET=your-session-secret-key-here

# OAuth Configuration
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/v1/auth/github/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/v1/auth/facebook/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Installation and Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up your environment variables in `.env`

3. Start the backend server:
```bash
npm run dev
```

4. Start the frontend:
```bash
cd ../frontend
npm install
npm start
```

## Features

### OAuth Authentication
- **Google OAuth**: Sign in with Google account
- **GitHub OAuth**: Sign in with GitHub account
- **Facebook OAuth**: Sign in with Facebook account
- **Account Linking**: Link OAuth accounts to existing local accounts
- **Profile Sync**: Automatically sync profile information from OAuth providers

### User Management
- **Unified User Model**: Single user model supporting both local and OAuth users
- **Profile Pictures**: Automatic profile picture import from OAuth providers
- **Username Generation**: Smart username generation for OAuth users
- **Role Management**: Support for user and admin roles

### Security Features
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Proper session handling for OAuth flows
- **CSRF Protection**: Built-in protection against cross-site request forgery
- **Rate Limiting**: API rate limiting to prevent abuse

## API Endpoints

### OAuth Routes
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - Google OAuth callback
- `GET /api/v1/auth/github` - Initiate GitHub OAuth
- `GET /api/v1/auth/github/callback` - GitHub OAuth callback
- `GET /api/v1/auth/facebook` - Initiate Facebook OAuth
- `GET /api/v1/auth/facebook/callback` - Facebook OAuth callback
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/logout` - Logout user

### Traditional Auth Routes (still available)
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `GET /api/v1/users/profile` - Get user profile

## Frontend Integration

The frontend includes:
- **Login Modal**: Beautiful modal with OAuth buttons
- **OAuth Callback Handler**: Automatic handling of OAuth redirects
- **Auth Context**: React context for authentication state management
- **Protected Routes**: Support for protecting routes based on authentication

## Database Schema Changes

The user model has been updated to support OAuth:

```javascript
{
  username: String,
  email: String,
  password: String, // Optional for OAuth users
  googleId: String, // OAuth provider IDs
  githubId: String,
  facebookId: String,
  oauthProvider: String, // 'local', 'google', 'github', 'facebook'
  profilePicture: String,
  firstName: String,
  lastName: String,
  role: String,
  // ... other fields
}
```

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure the redirect URIs in OAuth provider settings match exactly
2. **CORS Issues**: Make sure your frontend URL is in the allowed origins
3. **Session Issues**: Check that SESSION_SECRET is set and secure
4. **Token Issues**: Verify JWT_SECRET is set and tokens are being generated correctly

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=passport:*
```

## Production Deployment

For production deployment:

1. Update all OAuth redirect URIs to use HTTPS
2. Set secure session cookies: `SESSION_SECRET` should be a strong, random string
3. Use HTTPS for all OAuth callbacks
4. Set `NODE_ENV=production`
5. Configure proper CORS origins
6. Set up proper logging and monitoring

## Security Best Practices

1. **Environment Variables**: Never commit OAuth secrets to version control
2. **HTTPS Only**: Always use HTTPS in production
3. **Secure Cookies**: Use secure, httpOnly cookies for sessions
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Token Expiration**: Set appropriate token expiration times
6. **Input Validation**: Validate all user inputs and OAuth data

## Support

For issues or questions about OAuth setup, please check:
1. OAuth provider documentation
2. Console logs for error messages
3. Network tab for failed requests
4. Database for user creation issues
