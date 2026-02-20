# Backend Authentication Service

A production-ready Node.js backend authentication service built with Express.js, featuring JWT-based authentication, OAuth2 integration (Google), refresh tokens, and Role-Based Access Control (RBAC).

## Features

- 🔐 **JWT Authentication**: Secure token-based authentication with access and refresh tokens
- 🔄 **Refresh Tokens**: Long-lived refresh tokens (7 days) for seamless session management
- 🌐 **OAuth2 Integration**: Google OAuth2 login support via Passport.js
- 👥 **Role-Based Access Control (RBAC)**: User and admin roles with permission-based access
- 🔒 **Security Features**: 
  - Bcrypt password hashing
  - Helmet security headers
  - Rate limiting for API protection
  - CORS configuration
- 📊 **MongoDB Integration**: Mongoose ODM for database operations
- ✅ **Input Validation**: Express-validator for request validation
- 🧪 **Testing**: Jest test suite included
- 🛡️ **Error Handling**: Global error handling middleware

## Project Structure

```
Backend-Auth-JWT-OAuth-Service/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── passport.js          # Passport OAuth configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication controllers
│   │   └── userController.js    # User management controllers
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── rbac.js              # Role-based access control
│   │   ├── errorHandler.js      # Global error handling
│   │   └── rateLimiter.js      # Rate limiting middleware
│   ├── models/
│   │   └── User.js              # User Mongoose model
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication routes
│   │   ├── userRoutes.js        # User management routes
│   │   └── index.js             # Route aggregator
│   ├── services/
│   │   └── authService.js       # Authentication business logic
│   └── utils/
│       └── jwt.js               # JWT token utilities
├── tests/
│   └── auth.test.js            # Jest test suite
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore file
├── package.json                 # Dependencies and scripts
├── server.js                    # Application entry point
└── README.md                    # This file
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd Backend-Auth-JWT-OAuth-Service
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and fill in your configuration:
     ```env
     PORT=3000
     NODE_ENV=development
     MONGODB_URI=mongodb://localhost:27017/auth-service
     JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
     JWT_ACCESS_TOKEN_EXPIRY=15m
     JWT_REFRESH_TOKEN_EXPIRY=7d
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/oauth/google/callback
     FRONTEND_URL=http://localhost:3001
     RATE_LIMIT_WINDOW_MS=900000
     RATE_LIMIT_MAX_REQUESTS=100
     ```

4. **Set up MongoDB**:
   - Ensure MongoDB is running locally, or
   - Use MongoDB Atlas (cloud) and update `MONGODB_URI` in `.env`

5. **Set up Google OAuth2** (optional, for OAuth functionality):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/oauth/google/callback`
   - Copy Client ID and Client Secret to `.env`

## Running the Server

### Development Mode
```bash
npm run dev
```
This uses `nodemon` for auto-restart on file changes.

### Production Mode
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "user"  // Optional, defaults to "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "role": "user",
      ...
    }
  }
}
```

#### Google OAuth Login
```http
GET /api/auth/oauth/google
```

Redirects to Google OAuth consent screen, then redirects to frontend with tokens.

#### Google OAuth Callback
```http
GET /api/auth/oauth/google/callback
```

Internal endpoint handled by Passport.js. Redirects to frontend with tokens.

### Protected Routes

#### Protected Route Example
```http
GET /api/protected
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "This is a protected route",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### User Management Endpoints (Admin Only)

#### Get All Users
```http
GET /api/users?page=1&limit=10
Authorization: Bearer <adminAccessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <accessToken>
```

#### Update User Role
```http
PATCH /api/users/:id/role
Authorization: Bearer <adminAccessToken>
Content-Type: application/json

{
  "role": "admin"
}
```

#### Deactivate User
```http
PATCH /api/users/:id/deactivate
Authorization: Bearer <adminAccessToken>
```

#### Activate User
```http
PATCH /api/users/:id/activate
Authorization: Bearer <adminAccessToken>
```

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Support

- Telegram: https://t.me/topBtek
- Twitter: https://x.com/topBtek
