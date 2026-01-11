# OOTD AI - AI-Powered Wardrobe App

A full-stack mobile application built with Expo (React Native) that uses AI to help you organize your wardrobe and generate stylish outfit combinations.

## Features

- **Wardrobe Upload**: Capture photos of clothing items using your device camera
- **AI Processing**: Automatically identifies clothing items using Google's Gemini 1.5 API, extracting:
  - Category (e.g., "Top", "Bottom", "Shoes")
  - Sub-category (e.g., "T-Shirt", "Jeans", "Sneakers")
  - Color
  - Material
  - Attributes (tags like "casual", "formal", "vintage", etc.)
- **Background Removal**: Automatically removes backgrounds using Photoroom API, creating clean transparent PNGs
- **Virtual Closet**: Browse your wardrobe in a beautiful grid view with all items organized
- **OOTD Generator**: Get AI-powered outfit suggestions based on your wardrobe, weather, and occasion

## Tech Stack

- **Framework**: Expo (React Native) with TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Icons**: Lucide React Native
- **Backend**: Supabase (PostgreSQL database + Storage)
- **AI**: Google Gemini 1.5 API
- **Image Processing**: Photoroom API
- **Validation**: Zod

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** app on your iOS/Android device (for testing)

### Required API Accounts

You'll need accounts and API keys for:

1. **Google Gemini API**: [Get API Key](https://makersuite.google.com/app/apikey)
2. **Supabase**: [Create Project](https://supabase.com)
3. **Photoroom API**: [Get API Key](https://www.photoroom.com/api/)

## Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd OOTD-AI
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
   - Fill in your API keys in `.env` (see [Environment Variables](#environment-variables) below)

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Run on your device**:
   - Scan the QR code with Expo Go (iOS) or the Expo Go app (Android)
   - Or press `i` for iOS simulator, `a` for Android emulator

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_PHOTOROOM_API_KEY=your_photoroom_api_key
```

### Getting Your API Keys

#### Supabase
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Settings → API
3. Copy your Project URL and `anon` public key

#### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

#### Photoroom
1. Visit [Photoroom API](https://www.photoroom.com/api/)
2. Sign up for an account
3. Navigate to your dashboard to get your API key

## Project Structure

```
OOTD-AI/
├── app/                    # Expo Router app directory
│   └── (tabs)/            # Tab navigation screens
├── components/            # Reusable React components
│   └── ui/               # UI components (buttons, cards, etc.)
├── services/             # API service integrations
│   ├── supabase.ts      # Supabase client configuration
│   ├── gemini.ts        # Gemini AI service
│   └── photoroom.ts     # Photoroom API service
├── types/                # TypeScript type definitions
│   ├── wardrobe.ts      # Wardrobe item types
│   └── database.ts      # Database schema types
├── lib/                  # Utility functions
│   └── validations.ts   # Zod validation schemas
├── hooks/                # Custom React hooks
│   └── useUploadItem.ts # Item upload hook
└── assets/              # Images, fonts, etc.
```

## Development Workflow

### Adding a New Wardrobe Item

1. User captures/selects a photo
2. Image is sent to Gemini API for analysis
3. AI returns structured JSON with item details
4. Image is processed through Photoroom for background removal
5. Both images (original + isolated) are uploaded to Supabase Storage
6. Metadata is saved to the `items` table

### Generating an OOTD

1. User selects occasion and weather preferences
2. App fetches all wardrobe items from Supabase
3. Item metadata is sent to Gemini with context
4. Gemini suggests 3 items that work together
5. Outfit is displayed with item images

## Database Setup

See `technical-spec.md` for detailed database schema. You'll need to:

1. Create the following tables in Supabase:
   - `items` - Stores wardrobe item metadata
   - `outfits` - Stores saved outfit combinations

2. Set up Storage buckets:
   - `wardrobe-images` - Original photos
   - `isolated-images` - Background-removed PNGs

3. Configure Row Level Security (RLS) policies for user data isolation

## Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## Troubleshooting

### Common Issues

**"Module not found" errors**
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Environment variables not loading**
- Ensure variables are prefixed with `EXPO_PUBLIC_`
- Restart the Expo development server after changing `.env`

**Supabase connection issues**
- Verify your Supabase URL and anon key
- Check that your Supabase project is active
- Ensure RLS policies are configured correctly

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT License - feel free to use this project for learning or as a starting point for your own apps.

## Next Steps

After initial setup, follow these implementation phases:

1. **Skeleton**: Build basic UI with ItemCard component
2. **Brain**: Implement Gemini integration service
3. **Magic**: Add background removal and upload functionality
4. **OOTD Logic**: Create outfit generation service

See `technical-spec.md` for detailed architecture and implementation details.
