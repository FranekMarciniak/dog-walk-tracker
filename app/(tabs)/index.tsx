import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useWalk } from '@/contexts/WalkContext';
import { useColorScheme } from '@/hooks/useColorScheme';

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
            strokeColor="#007AFF"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>
      

      {isWalking && (
        <View style={styles.recordingOverlay}>
          <ThemedView style={styles.recordingContainer}>
            <View style={styles.recordingRow}>
              <View style={styles.recordingIndicator}>
                <View style={styles.redDot} />
                <ThemedText style={styles.recordingText}>Recording Walk</ThemedText>
              </View>
              
              <ThemedText style={styles.timerText}>
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
  overlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  welcomeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
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
    color: '#333',
    marginBottom: 4,
  },
  subtitleText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  recordingOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  recordingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
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
    backgroundColor: '#ff4444',
    marginRight: 8,
  },
  recordingText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    shadowColor: '#000',
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