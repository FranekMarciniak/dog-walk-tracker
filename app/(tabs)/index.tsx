import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useWalk } from '@/contexts/WalkContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width, height } = Dimensions.get('window');

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function HomeScreen() {
  const { isWalking, startWalk, stopWalk, walkStartTime, routePoints, startLocation } = useWalk();
  const [walkDuration, setWalkDuration] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const colorScheme = useColorScheme();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({}, 'secondaryText');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  const shadowColor = useThemeColor({}, 'shadow');
  const cardBackground = useThemeColor({}, 'cardBackground');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isWalking && walkStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - walkStartTime.getTime()) / 1000);
        setWalkDuration(duration);
      }, 1000);
    } else {
      setWalkDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isWalking, walkStartTime]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      // First check if we already have permission
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      


      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Permission to access location was denied. The app needs location access to track your walks.',
          [{ text: 'OK' }]
        );
        setLocationPermission(false);
        return;
      }

      setLocationPermission(true);
      getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      // Fallback to default location (New York City)
      setCurrentLocation({
        latitude: 40.7128,
        longitude: -74.0060,
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const defaultRegion = {
    latitude: currentLocation?.latitude || 40.7128,
    longitude: currentLocation?.longitude || -74.0060,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={defaultRegion}
        region={currentLocation ? {
          ...defaultRegion,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        } : undefined}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={isWalking}
        showsCompass={true}
        showsScale={true}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="You are here"
          />
        )}
        
        {/* Show start marker during walk */}
        {isWalking && startLocation && (
          <Marker
            coordinate={startLocation}
            title="Walk Start"
            description="Started here"
            pinColor="green"
          />
        )}
        
        {/* Show real-time route during walk */}
        {isWalking && routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints}
            strokeColor={tintColor}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>
      

      {isWalking && (
        <View style={styles.recordingOverlay}>
          <ThemedView style={[styles.recordingContainer, { backgroundColor: cardBackground, shadowColor }]}>
            <View style={styles.recordingRow}>
              <View style={styles.recordingIndicator}>
                <View style={[styles.redDot, { backgroundColor: errorColor }]} />
                <ThemedText style={[styles.recordingText, { color: errorColor }]}>Recording Walk</ThemedText>
              </View>
              
              <ThemedText style={[styles.timerText, { color: textColor }]}>
                {formatDuration(walkDuration)}
              </ThemedText>
            </View>
          </ThemedView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  overlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  welcomeContainer: {
    borderRadius: 12,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleText: {
    textAlign: 'center',
    fontSize: 14,
  },
  recordingOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  recordingContainer: {
    borderRadius: 12,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  recordingText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
  },
  stopButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  startButtonContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
}); 