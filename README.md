# Grammar Checker

A modern, AI-powered grammar checking application that provides accurate grammar, style, and writing enhancement suggestions using advanced language models.

## Project Structure

This project is structured as a monorepo with two main components:

- **Frontend**: React/TypeScript application with Vite in the `grammar-checker/` directory
- **Backend**: Node.js/Express API server in the `backend/` directory

## Deployment Instructions

This application requires separate deployments for the frontend and backend:

### Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect the project structure using the `vercel.json` configuration
4. Make sure to set the `VITE_API_URL` environment variable to point to your deployed backend URL

### Backend Deployment (Render, Railway, or similar)

1. Create an account on Render.com (or similar platform)
2. Create a new Web Service and connect your GitHub repository
3. Configure the service:
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Set up any required environment variables (API keys, etc.)

## Local Development

To run the project locally:

1. Clone the repository
2. Install dependencies:
   ```
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../grammar-checker
   npm install
   ```
3. Start the backend server:
   ```
   cd backend
   npm start
   ```
4. Start the frontend development server:
   ```
   cd grammar-checker
   npm run dev
   ```
5. Access the application at `http://localhost:5173`

## Features

- Grammar and style checking via AI models
- Support for multiple AI providers (Ollama, OpenAI, Groq, DeepSeek, Qwen, OpenRouter)
- Real-time text processing and suggestion rendering
- Model configuration and provider switching
- API key management (user-provided or environment fallback)
- Writing score evaluation and enhancement recommendations
- Chat interface for interactive writing assistance
- Career tools (e.g., resume optimization, job application assistant)

## Technologies Used

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, JavaScript
- **AI Integration**: Various AI providers with unified interface