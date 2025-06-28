# Writing Agents - AI-Powered Text Rewriting Tool

A sophisticated React application that allows you to create and train personalized AI writing agents to rewrite text in different styles and tones.

## Features

- **Multiple AI Agents**: Create and manage different writing agents with unique personalities
- **Supabase + OpenAI Integration**: Secure server-side AI processing via Supabase Edge Functions
- **Agent Training**: Train agents with writing samples and style preferences
- **Real-time Chat**: Interactive chat interface with agent mentions
- **Feedback System**: Rate agent responses to improve their accuracy
- **Responsive Design**: Beautiful, production-ready interface

## Setup

### Prerequisites

- Node.js 18+ 
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Click "Connect to Supabase" in the app header to configure your connection
   - In your Supabase project dashboard, go to Settings > API to find your project URL and anon key

4. Configure OpenAI in Supabase:
   - In your Supabase dashboard, go to Settings > Edge Functions
   - Add a new secret called `OPENAI_API_KEY` with your OpenAI API key
   - Deploy the Edge Function (this happens automatically when you use the app)

5. Start the development server:
   ```bash
   npm run dev
   ```

### Getting an OpenAI API Key

1. Go to [OpenAI's website](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to the API section
4. Generate a new API key
5. Add the key as a secret in your Supabase project settings

## Usage

1. **Connect to Supabase**: Click the "Connect to Supabase" button in the header
2. **Select Agents**: Choose which writing agents you want to use
3. **Write Text**: Enter your text in the editor or chat interface
4. **Get Rewrites**: Agents will rewrite your text using OpenAI's GPT models
5. **Train Agents**: Add writing samples to improve agent performance
6. **Provide Feedback**: Rate responses to help agents learn your preferences

## Agent Types

The app comes with several pre-configured agents:

- **Sophia**: Professional business writing
- **Marcus**: Casual and friendly communication
- **Victoria**: Persuasive sales copy
- **Professor Chen**: Academic and scholarly writing
- **Luna**: Creative and imaginative content
- **Alex**: Technical documentation

## Architecture

- **Frontend**: React 18 with TypeScript
- **Backend**: Supabase Edge Functions (Deno runtime)
- **AI**: OpenAI GPT-4o-mini via secure server-side calls
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite

## Security

- OpenAI API keys are stored securely in Supabase secrets
- All AI processing happens server-side via Edge Functions
- No sensitive credentials are exposed to the client

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details