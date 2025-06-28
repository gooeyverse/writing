# Writing Agents - AI-Powered Text Rewriting Tool

A sophisticated React application that allows you to create and train personalized AI writing agents to rewrite text in different styles and tones.

## Features

- **Multiple AI Agents**: Create and manage different writing agents with unique personalities
- **OpenAI Integration**: Powered by OpenAI's GPT models for intelligent text rewriting
- **Agent Training**: Train agents with writing samples and style preferences
- **Real-time Chat**: Interactive chat interface with agent mentions
- **Feedback System**: Rate agent responses to improve their accuracy
- **Responsive Design**: Beautiful, production-ready interface

## Setup

### Prerequisites

- Node.js 18+ 
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Getting an OpenAI API Key

1. Go to [OpenAI's website](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to the API section
4. Generate a new API key
5. Add the key to your `.env` file as shown above

## Usage

1. **Select Agents**: Choose which writing agents you want to use
2. **Write Text**: Enter your text in the editor or chat interface
3. **Get Rewrites**: Agents will rewrite your text according to their personalities
4. **Train Agents**: Add writing samples to improve agent performance
5. **Provide Feedback**: Rate responses to help agents learn your preferences

## Agent Types

The app comes with several pre-configured agents:

- **Sophia**: Professional business writing
- **Marcus**: Casual and friendly communication
- **Victoria**: Persuasive sales copy
- **Professor Chen**: Academic and scholarly writing
- **Luna**: Creative and imaginative content
- **Alex**: Technical documentation

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o-mini
- **Icons**: Lucide React
- **Build Tool**: Vite

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details