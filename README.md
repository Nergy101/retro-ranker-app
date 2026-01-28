# Retro Ranker App

A mobile application for browsing, comparing, and ranking retro gaming handheld devices. Built with Expo and React Native, featuring a dark theme optimized for mobile devices.

## Features

- 📱 **Device Browsing**: Browse a comprehensive catalog of retro gaming handhelds
- 🔍 **Search & Filter**: Find devices by name, brand, or specifications
- ⚖️ **Device Comparison**: Compare multiple devices side-by-side
- 📊 **Rankings**: View device rankings and performance metrics
- 🏆 **Achievements**: Unlock achievements as you explore devices
- 💾 **Collections**: Create and manage personal device collections
- 👤 **User Profiles**: Sign in with Google or Discord, manage your profile
- 🌙 **Dark Theme**: Beautiful dark UI optimized for mobile viewing

## Tech Stack

- **Framework**: Expo SDK 54, React Native 0.81.5, React 19.1.0
- **Language**: TypeScript 5.9.2 (strict mode)
- **Routing**: Expo Router 6.0.22 (file-based routing)
- **UI Library**: NativeBase 3.4.28
- **Icons**: Feather Icons (via `@expo/vector-icons`)
- **Backend**: PocketBase 0.26.6
- **State Management**: React Context API
- **Storage**: AsyncStorage for local data persistence

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **EAS CLI** (`npm install -g eas-cli`) - Required for building and publishing
- **iOS Development** (macOS only): Xcode and iOS Simulator
- **Android Development**: Android Studio and Android SDK

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd retro-ranker-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `POCKETBASE_URL`: Your PocketBase backend URL
   - `EXPO_PUBLIC_POCKETBASE_URL`: Public PocketBase URL (same as above)

4. **Start the development server**
   ```bash
   npm start
   ```

## Development

### Running the App

- **Start Expo dev server**: `npm start`
- **Run on iOS simulator**: `npm run ios`
- **Run on Android emulator**: `npm run android`
- **Run on web**: `npm run web`

### Project Structure

```
app/                    # Routes (file-based routing)
  (tabs)/              # Tab navigation group
  auth/                # Authentication routes
  devices/             # Device detail pages
  collections/         # Collection pages
components/            # Reusable UI components
  achievements/        # Achievement components
  cards/              # Card components
  comparisons/        # Device comparison components
  devices/            # Device-specific components
  forms/              # Form components
  shared/             # Shared utilities
  specifications/     # Device spec components
contexts/              # React Context providers
services/              # Business logic layer
  achievements/       # Achievement services
  auth/               # Authentication services
  devices/            # Device-related services
  pocketbase/         # PocketBase client
theme/                 # Theme configuration
types/                 # TypeScript type definitions
utils/                 # Utility functions
```

### Code Style

- **TypeScript**: Strict mode enabled, all code must be typed
- **Components**: Functional components with hooks
- **Icons**: Use Feather icons exclusively from `@expo/vector-icons`
- **Styling**: Use NativeBase components and theme colors from `theme/colors.ts`
- **Naming**: PascalCase for components, kebab-case for utilities/services

See `AGENT.md` for detailed architectural guidelines and design decisions.

## Building and Publishing

### Prerequisites for Building

Before building and publishing, ensure you have:

1. **EAS CLI installed globally**

   ```bash
   npm install -g eas-cli
   ```

2. **EAS configuration file** (`eas.json`)

   If you don't have one, create it by running:

   ```bash
   eas build:configure
   ```

   This will create an `eas.json` file with build profiles for development, preview, and production.

3. **Expo account and login**

   You must be logged in to your Expo account:

   ```bash
   eas login
   ```

   If you don't have an account, create one at [expo.dev](https://expo.dev).

### Build Scripts

- **Build Android APK**: `npm run build:android:apk`
- **Build Android (interactive)**: `npm run build:android`
- **Build iOS**: `npm run build:ios`

### Publishing Scripts

- **Publish to Google Play Store**: `npm run publish:android`
- **Publish to Apple App Store**: `npm run publish:ios`

### Build Process

1. **Configure EAS** (first time only):

   ```bash
   eas build:configure
   ```

2. **Build for Android**:

   ```bash
   npm run build:android:apk
   ```

   This will:
   - Upload your code to Expo's build servers
   - Build an Android APK with the production profile
   - Provide a download link when complete

3. **Build for iOS**:

   ```bash
   npm run build:ios
   ```

   This will:
   - Upload your code to Expo's build servers
   - Build an iOS app bundle
   - Require Apple Developer account credentials
   - Provide a download link when complete

4. **Submit to Stores**:

   After building, submit your app:

   ```bash
   npm run publish:android  # For Google Play
   npm run publish:ios      # For App Store
   ```

### Additional Notes

- **Android Bundle ID**: `com.retroranker.app`
- **iOS Bundle Identifier**: `com.retroranker.app`
- **App Scheme**: `retroranker://`
- **Associated Domains**: `applinks:retroranker.site`

For more information on EAS Build, visit the [Expo documentation](https://docs.expo.dev/build/introduction/).

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
POCKETBASE_URL=https://pocketbase.retroranker.site
EXPO_PUBLIC_POCKETBASE_URL=https://pocketbase.retroranker.site
```

### App Configuration

App settings are configured in `app.json`:

- App name: "Retro Ranker"
- Version: 1.0.0
- Orientation: Portrait
- UI Style: Dark mode only
- iOS: Tablet support enabled
- Android: Edge-to-edge enabled

## Platform Support

- ✅ **iOS**: Full support with tablet optimization
- ✅ **Android**: Full support with edge-to-edge UI
- ✅ **Web**: Supported via Expo web (limited functionality)

## Authentication

The app supports OAuth authentication via:

- **Google**: Sign in with Google account
- **Discord**: Sign in with Discord account

Authentication uses PKCE (Proof Key for Code Exchange) flow for secure OAuth.

## Contributing

When contributing to this project:

1. Follow the TypeScript strict mode guidelines
2. Use Feather icons exclusively (no other icon libraries)
3. Maintain the dark theme color system
4. Place business logic in service files, not components
5. Use NativeBase components over raw React Native components
6. Follow the established directory structure
7. Ensure all props and data structures are properly typed

See `AGENT.md` for detailed development guidelines.

## License

[Add your license information here]

## Support

For issues, questions, or contributions, please [open an issue](<repository-url>/issues) or contact the maintainers.
