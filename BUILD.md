# Building iOS App on Linux

This project uses Expo Application Services (EAS Build) to build iOS apps on Linux without needing a Mac.

## Prerequisites

1. **Expo Account**: Create a free account at [expo.dev](https://expo.dev)
2. **Apple Developer Account**: Required for iOS builds (can be free for development)

## Setup

### 1. Login to Expo
```bash
npx eas login
```

### 2. Configure the project
```bash
npx eas build:configure
```

## Build Commands

### iOS Builds

#### Development Build (for testing)
```bash
npm run build:ios:dev
```

#### Preview Build (for internal testing)
```bash
npm run build:ios:preview
```

#### Production Build (for App Store)
```bash
npm run build:ios
```

### Android Builds

#### Preview Build
```bash
npm run build:android:preview
```

#### Production Build
```bash
npm run build:android
```

### Build All Platforms
```bash
npm run build:all
```

## Build Profiles

The `eas.json` file defines three build profiles:

- **development**: Creates a development client for testing
- **preview**: Creates internal distribution builds (iOS Simulator compatible)
- **production**: Creates App Store/Play Store ready builds

## iOS Simulator Build

The preview profile includes iOS Simulator support, so you can test on iOS Simulator even on Linux:

```bash
npm run build:ios:preview
```

This will create a `.app` file that can be installed on iOS Simulator.

## Monitoring Builds

1. Visit [expo.dev/accounts/[username]/projects/dog-walk-tracker/builds](https://expo.dev)
2. Or use the CLI: `npx eas build:list`

## Notes

- **First build**: May take 10-20 minutes
- **Subsequent builds**: Usually 5-10 minutes
- **Free tier**: Limited build minutes per month
- **Paid tier**: Unlimited builds with faster queues

## Troubleshooting

### Bundle Identifier Issues
If you get bundle identifier errors, update the `bundleIdentifier` in `eas.json`:

```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.yourname.dogwalktracker"
      }
    }
  }
}
```

### Apple Developer Account
For production builds, you'll need to provide:
- Apple Developer Team ID
- Distribution Certificate
- Provisioning Profile

EAS can help generate these automatically with:
```bash
npx eas credentials
``` 