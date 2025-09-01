# Go4It Sports Platform

## Overview
The Go4It Sports Platform is a full-stack web application designed to analyze and optimize athletic performance using artificial intelligence. The platform provides users with insights based on their performance metrics, training programs, and AI analysis.

## Features
- User registration and authentication
- Performance dashboard displaying key metrics
- Recommended training programs
- AI-powered performance insights
- **AI Football Coach**: Interactive voice and text coaching with video demonstrations
- Responsive design for various devices
- Production-ready deployment with Docker and PM2

## AI Football Coach
The platform includes an advanced AI Football Coach feature that provides:

- **Voice Interaction**: Ask questions about football strategies and techniques
- **Video Demonstrations**: Watch instructional videos for various plays and drills
- **Real-time Responses**: Get instant answers to football-related questions
- **Strategy Explanations**: Learn about defensive schemes, offensive plays, and training methods
- **Interactive Learning**: Click example questions or use voice commands

### Available Topics:
- Cover 2 Defense
- West Coast Offense
- Quarterback Footwork Drills
- Defensive Reading Techniques
- Man-to-Man Coverage
- And much more!

Access the AI Football Coach at `/ai-football-coach` route.

## Technologies Used
- **Frontend:** React, CSS
- **Backend:** Node.js, Express, MongoDB (with Mongoose)
- **Testing:** Jest, React Testing Library
- **Containerization:** Docker
- **Process Management:** PM2
- **Caching:** Redis

## Project Structure
```
Go4It
├── backend
│   ├── controllers         # Contains controllers for handling requests
│   ├── models              # Contains database models
│   ├── routes              # Contains route definitions
│   ├── middleware          # Contains authentication middleware
│   ├── config              # Contains database configuration
│   ├── app.js              # Main entry point for the backend
│   └── package.json        # Backend dependencies and scripts
├── frontend
│   ├── public              # Public assets (HTML, CSS)
│   ├── src                 # Source files for the React application
│   └── package.json        # Frontend dependencies and scripts
├── tests                   # Contains unit tests for backend and frontend
├── docker-compose.yml      # Development Docker configuration
├── docker-compose.prod.yml # Production Docker configuration
├── ecosystem.config.js     # PM2 configuration for production
├── .gitignore              # Git ignore file
├── README.md               # Project documentation
└── Site-code.md            # Deployment script and configurations
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (or a MongoDB Atlas account)
- Docker (optional, for containerization)
- PM2 (for production process management)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd Go4It
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

### Running the Application
- To run the backend server:
  ```
  cd backend
  npm start
  ```

- To run the frontend application:
  ```
  cd frontend
  npm start
  ```

### Running with Docker
1. Build and run the containers:
   ```
   docker-compose up --build
   ```

## Production Deployment
1. Set up environment variables in `.env` file
2. For production deployment:
   ```
   docker-compose -f docker-compose.prod.yml up --build
   ```

3. Or using PM2:
   ```
   cd backend
   npm run build
   pm2 start ecosystem.config.js --env production
   ```

4. Run database migrations:
   ```
   npm run db:migrate
   ```

5. Set up SSL certificates (handled automatically by Site-code.md)
6. Configure monitoring with New Relic
7. Set up automated backups using backup.sh

## Environment Variables
Copy `.env` file and update with your production values:
- `MONGO_URI`: MongoDB connection string
- `SESSION_SECRET`: Secret key for sessions
- `JWT_SECRET`: Secret key for JWT tokens
- `NEW_RELIC_LICENSE_KEY`: New Relic monitoring key
- `DOMAIN`: Your domain name for SSL

## Monitoring & Logging
- Health check endpoint: `/health`
- New Relic APM monitoring configured
- Winston logging with file rotation
- PM2 process management with clustering

## Security Features
- Rate limiting on API endpoints
- JWT authentication
- CORS configuration
- Input validation with Joi
- Secure headers middleware

## Testing
- To run backend tests:
  ```
  cd backend
  npm test
  ```

- To run frontend tests:
  ```
  cd frontend
  npm test
  ```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
