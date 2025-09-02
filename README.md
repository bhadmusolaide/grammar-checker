# AI Grammar Checker

A modern AI-powered grammar checking application that supports multiple AI providers including local Ollama models and cloud-based services.

## Features

- **AI-Powered Grammar Checking**: Uses advanced AI models for accurate grammar and style suggestions
- **Multiple Provider Support**: Supports Ollama (local), OpenAI, Groq, DeepSeek, Qwen, and OpenRouter
- **Flexible API Key Management**: Use your own API keys or fallback to environment-configured keys
- **Modern Web Interface**: Clean, responsive React frontend
- **Real-time Processing**: Fast grammar checking with detailed suggestions

## Architecture

The application consists of two main components:

- **Frontend** (`grammar-checker/`): React application with Vite
- **Backend** (`backend/`): Node.js Express API server

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Ollama (optional, for local AI models)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AI-grammar-web
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../grammar-checker
npm install
```

4. Configure environment variables:
```bash
cd ../backend
cp .env.example .env
# Edit .env with your API keys (optional)
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd grammar-checker
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Supported AI Providers

- **Ollama**: Local AI models (no API key required)
- **OpenAI**: GPT models (API key required)
- **Groq**: Fast inference models (API key required)
- **DeepSeek**: DeepSeek models (API key required)
- **Qwen**: Qwen models (API key required)
- **OpenRouter**: Multiple model access (API key required)

## API Usage

The main endpoint for grammar checking is:

```
POST /api/orchestrator/check
```

Example request:
```json
{
  "text": "This is a sample text with grammer errors.",
  "modelConfig": {
    "provider": "ollama",
    "model": "llama3.2:3b"
  },
  "userApiKey": "optional-api-key"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details