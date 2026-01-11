# Internal Distribution Guide for iPhone

This guide explains how to build and install the OOTD AI app on your iPhone for internal testing.

## Prerequisites

1. **Apple Developer Account** (Free or Paid)
   - Free account works for personal testing
   - Paid account ($99/year) required for TestFlight and App Store distribution

2. **EAS CLI** (already installed)
3. **Expo Account** (already logged in)

## Option 1: Development Build (Recommended for Testing)

This creates a development build that connects to your Expo dev server.

### Step 1: Build for iOS Device

```bash
npx eas-cli@latest build --profile development --platform ios
```

### Step 2: Install on iPhone

After the build completes:

1. **Via EAS Dashboard:**
   - Go to https://expo.dev/accounts/abpocnio/projects/ootd-ai/builds
   - Find your build and click "Download"
   - Open the `.ipa` file on your Mac
   - Connect your iPhone via USB
   - Drag the `.ipa` to your iPhone in Finder (or use Xcode)

2. **Via QR Code:**
   - EAS will provide a QR code after build
   - Scan with your iPhone camera
   - Follow the installation prompts

### Step 3: Trust the Developer Certificate

On your iPhone:
1. Go to **Settings** → **General** → **VPN & Device Management**
2. Tap on your developer certificate
3. Tap **Trust** → **Trust**

### Step 4: Run Development Server

```bash
npx expo start --dev-client
```

The app will connect to your dev server for hot reloading.

## Option 2: Preview Build (Standalone App)

This creates a standalone app that doesn't need a dev server.

### Step 1: Build Preview Version

```bash
npx eas-cli@latest build --profile preview --platform ios
```

### Step 2: Install on iPhone

Same as Option 1, Step 2.

## Option 3: TestFlight (Requires Paid Apple Developer Account)

For easier distribution to multiple testers:

### Step 1: Build Production Version

```bash
npx eas-cli@latest build --profile production --platform ios
```

### Step 2: Submit to TestFlight

```bash
npx eas-cli@latest submit --platform ios --profile production
```

### Step 3: Distribute via TestFlight

1. Go to App Store Connect
2. Add internal testers
3. They'll receive an email invitation
4. Install TestFlight app on iPhone
5. Accept invitation and install app

## Quick Start (Fastest Method)

For quick internal testing on your own iPhone:

```bash
# 1. Build development version
npx eas-cli@latest build --profile development --platform ios

# 2. Wait for build to complete (check dashboard or email)

# 3. Download and install on iPhone (see Option 1, Step 2)

# 4. Start dev server
npx expo start --dev-client
```

## Troubleshooting

### "Unable to install app"
- Make sure you've trusted the developer certificate (Settings → General → VPN & Device Management)
- Ensure your iPhone is connected and unlocked

### "Build failed"
- Check build logs in EAS dashboard
- Ensure all environment variables are set in `.env`
- Verify Apple Developer account is linked: `npx eas-cli@latest device:create`

### "App won't connect to dev server"
- Make sure iPhone and computer are on same WiFi network
- Check firewall settings
- Try using tunnel: `npx expo start --dev-client --tunnel`

## Notes

- **Development builds** require a dev server running for the app to work
- **Preview builds** are standalone and don't need a dev server
- **Production builds** are for App Store/TestFlight distribution
- First build may take 15-20 minutes, subsequent builds are faster

## Need Help?

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- EAS Dashboard: https://expo.dev/accounts/abpocnio/projects/ootd-ai/builds
