# 🐕 Dog Walk Tracker

A React Native mobile app built with Expo for tracking dog walks with GPS, route visualization, and walk history management.

## 📱 Features

### Core Functionality
- **Real-time GPS Tracking**: Track your dog walks with live location updates
- **Interactive Maps**: Full-screen map view with user location and route visualization
- **Walk Recording**: Start/stop walk recording with visual feedback and live timer
- **Route Visualization**: View complete walking routes with polylines on maps
- **Walk History**: Browse all previous walks with duration and distance
- **Detailed Statistics**: View walk details including average speed and route points
- **Swipe to Delete**: Remove walks from history with swipe gestures

### User Interface
- **Tab Navigation**: Clean 3-tab interface (Home, Record, History)
- **Prominent Record Button**: Center floating action button for easy walk recording
- **Dark/Light Theme**: Automatic theme switching based on system preferences
- **Native iOS/Android Feel**: Platform-specific styling and interactions

## 🚀 Quick Start

### Prerequisites
- Node.js (v20 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Emulator (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dog-walk-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device testing

## 🏗️ Architecture

### Tech Stack
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Maps**: React Native Maps
- **Database**: Expo SQLite
- **Location Services**: Expo Location
- **State Management**: React Context API
- **Styling**: StyleSheet with theme support
- **Icons**: Expo Vector Icons (@expo/vector-icons)

### Project Structure
```
app/
├── (tabs)/                 # Tab navigation screens
│   ├── _layout.tsx        # Tab navigator configuration
│   ├── index.tsx          # Home screen (map view)
│   ├── add.tsx            # Walk recording screen
│   └── history.tsx        # Walk history screen
├── walk-detail.tsx        # Individual walk detail screen
├── _layout.tsx            # Root navigation layout
└── +not-found.tsx         # 404 screen

components/
├── ui/                    # Reusable UI components
├── ThemedText.tsx         # Themed text component
├── ThemedView.tsx         # Themed view component
└── HapticTab.tsx          # Tab with haptic feedback

contexts/
└── WalkContext.tsx        # Walk state management

services/
└── database.ts            # SQLite database operations

constants/
└── Colors.ts              # Theme color definitions
```

### Database Schema

#### Walks Table
```sql
CREATE TABLE walks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  duration INTEGER NOT NULL,
  distance REAL,
  startLatitude REAL NOT NULL,
  startLongitude REAL NOT NULL,
  endLatitude REAL,
  endLongitude REAL,
  createdAt TEXT NOT NULL
);
```

#### Route Points Table
```sql
CREATE TABLE route_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  walkId INTEGER NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (walkId) REFERENCES walks (id)
);
```

## 📖 Usage Guide

### Starting a Walk
1. Open the app and ensure location permissions are granted
2. Tap the blue **+** button in the center of the tab bar
3. The button turns red and shows a pause icon
4. A timer appears showing the current walk duration
5. Your route is tracked automatically with GPS

### Stopping a Walk
1. Tap the red **pause** button to stop recording
2. The walk is automatically saved to the database
3. Button returns to blue **+** state

### Viewing Walk History
1. Navigate to the **History** tab
2. See overall statistics at the top (total walks, time, distance)
3. Browse individual walks in the list below
4. Tap any walk to view detailed route visualization
5. Swipe left on any walk item to delete it

### Walk Details
- View the complete route on an interactive map
- See start (green) and end (red) markers
- Route is displayed as a colored polyline
- Statistics include duration, distance, route points, and average speed

## 🔧 Development

### Available Scripts
- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint
- `npm run build:android` - Build Android APK
- `npm run build:ios` - Build iOS app

### Building for Production

#### Android
```bash
npm run build:android
```

#### iOS
```bash
npm run build:ios
```

#### Both Platforms
```bash
npm run build:all
```

### Key Dependencies
- **expo**: ~53.0.11 - Expo SDK
- **react-native-maps**: 1.20.1 - Map integration
- **expo-location**: ~18.1.5 - GPS location services
- **expo-sqlite**: ~15.2.12 - Local database
- **expo-router**: ~5.1.0 - File-based navigation
- **react-native-gesture-handler**: ~2.24.0 - Touch gestures

## 🎯 Features in Detail

### GPS Tracking
- Requests location permissions on first use
- Updates location every 5 seconds or 10 meters during walks
- Calculates distance using Haversine formula
- Stores route points for detailed visualization

### Map Integration
- Full-screen map view on home screen
- Shows user's current location
- Displays walking routes with polylines
- Auto-fits map region to show complete routes
- Platform-specific map styling

### Data Persistence
- SQLite database for offline storage
- Automatic database initialization
- CRUD operations for walks and route points
- Statistics calculations (totals, averages)

### User Experience
- Haptic feedback on tab interactions
- Loading states for async operations
- Error handling for location and database operations
- Responsive design for different screen sizes

## 🔒 Permissions

The app requires the following permissions:
- **Location (Always)**: For GPS tracking during walks
- **Location (When in Use)**: Alternative permission level

## 🐛 Troubleshooting

### Common Issues

**Location not working**
- Ensure location permissions are granted
- Check that location services are enabled on device
- Try restarting the app

**Maps not displaying**
- Verify internet connection for map tiles
- Check that react-native-maps is properly configured
- Ensure Google Maps API key is set (if required)

**Database errors**
- Clear app data and restart
- Check SQLite initialization in database service

## 📄 License

This project is licensed under the MIT License.
