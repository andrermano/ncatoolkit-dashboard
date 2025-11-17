# No-Code Architects Toolkit - Dashboard

A modern, secure web dashboard for the [No-Code Architects Toolkit API](https://github.com/Davidb-2107/no-code-architects-toolkit). Built with Next.js 14, TypeScript, and Tailwind CSS.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/toolkit-dashboard&env=TOOLKIT_API_URL,TOOLKIT_API_KEY&envDescription=Configure%20your%20Toolkit%20API%20connection&envLink=https://github.com/YOUR_USERNAME/toolkit-dashboard%23environment-variables)

## Features

- 🎬 **Media Converter** - Convert audio and video files to different formats
- 🎤 **Media Transcription** - Transcribe and translate audio/video using OpenAI Whisper
- 🔒 **Secure Backend Proxy** - API keys stored securely on the server
- 🎨 **Modern UI** - Clean, responsive interface built with Tailwind CSS
- ⚡ **Real-time Processing** - Track job progress and view results instantly
- 📱 **Mobile Friendly** - Works seamlessly on all devices

## Architecture

This dashboard uses a **secure proxy backend pattern**:

```
Browser → Next.js API Routes (Server) → Toolkit API
          (API_KEY stored here)
```

Your API key is never exposed to the browser, keeping it completely secure.

## Prerequisites

- Node.js 18.0 or higher
- A running instance of [No-Code Architects Toolkit API](https://github.com/Davidb-2107/no-code-architects-toolkit)
- API key for the Toolkit API

## Quick Start

### 1. Clone or navigate to this directory

```bash
cd /home/user/no-code-architects-toolkit-ui
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and configure it:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your settings:

```env
# URL of your Toolkit API
TOOLKIT_API_URL=http://localhost:8080

# Your API Key
TOOLKIT_API_KEY=your_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
no-code-architects-toolkit-ui/
├── app/
│   ├── api/toolkit/          # Secure proxy API routes
│   │   ├── convert/
│   │   ├── transcribe/
│   │   └── download/
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Main dashboard page
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── ConvertForm.tsx       # Media conversion form
│   └── TranscribeForm.tsx    # Transcription form
├── lib/
│   ├── api-client.ts         # Client for calling proxy API
│   ├── types.ts              # TypeScript type definitions
│   └── utils.ts              # Utility functions
├── .env.local.example        # Example environment variables
└── README.md                 # This file
```

## Supported Endpoints

### Media Convert (`/v1/media/convert`)
Convert audio and video files between formats:
- MP4, MP3, WAV, WebM, MKV, AVI, MOV
- FLAC, AAC, OGG

### Media Transcribe (`/v1/media/transcribe`)
Transcribe or translate audio/video using OpenAI Whisper:
- Multiple model sizes (tiny to large)
- Auto-detect language or specify
- Transcribe or translate to English
- View segments with timestamps

### Coming Soon
- Media Download
- Video Captioning
- Image to Video
- And more...

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `TOOLKIT_API_URL`
   - `TOOLKIT_API_KEY`
4. Deploy!

### Docker

```bash
# Build
docker build -t toolkit-ui .

# Run
docker run -p 3000:3000 \
  -e TOOLKIT_API_URL=http://your-api:8080 \
  -e TOOLKIT_API_KEY=your_key \
  toolkit-ui
```

### Traditional Hosting

```bash
# Build
npm run build

# Start
npm start
```

Make sure to set environment variables on your hosting platform.

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `TOOLKIT_API_URL` | Yes | URL of your Toolkit API | `http://localhost:8080` |
| `TOOLKIT_API_KEY` | Yes | Your API key for authentication | `your_secret_key` |

## Security Notes

- API keys are **never** sent to the client browser
- All API requests are proxied through Next.js API routes
- Environment variables are only accessible on the server
- CORS issues are eliminated by the proxy pattern

## Customization

### Adding New Endpoints

1. Create a new API route in `app/api/toolkit/[endpoint]/route.ts`
2. Add TypeScript types in `lib/types.ts`
3. Add client function in `lib/api-client.ts`
4. Create UI component in `components/`
5. Add to dashboard in `app/page.tsx`

### Styling

This project uses Tailwind CSS. Customize by editing:
- `tailwind.config.ts` - Tailwind configuration
- `app/globals.css` - Global styles
- Component files - Component-specific styles

## Troubleshooting

### API Connection Issues

**Problem:** "Server configuration error: Missing API credentials"

**Solution:** Make sure `.env.local` exists and contains both `TOOLKIT_API_URL` and `TOOLKIT_API_KEY`.

**Problem:** "Request failed" or timeout errors

**Solution:**
- Verify your Toolkit API is running
- Check that `TOOLKIT_API_URL` is correct
- Ensure API key is valid

### Development Issues

**Problem:** Module not found errors

**Solution:** Delete `node_modules` and reinstall:
```bash
rm -rf node_modules
npm install
```

**Problem:** TypeScript errors

**Solution:** Rebuild TypeScript:
```bash
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

GPL-2.0 - Same as the No-Code Architects Toolkit API

## Links

- [Toolkit API Repository](https://github.com/Davidb-2107/no-code-architects-toolkit)
- [API Documentation](https://github.com/Davidb-2107/no-code-architects-toolkit/tree/main/docs)
- [Community Support](https://skool.com/no-code-architects)

## Credits

Built with:
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
