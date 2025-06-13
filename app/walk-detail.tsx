import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { databaseService, RoutePoint, Walk } from '@/services/database';

const { width } = Dimensions.get('window');

export default function WalkDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [walk, setWalk] = useState<Walk | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'screenBackground');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({}, 'secondaryText');
  const tintColor = useThemeColor({}, 'tint');
  const shadowColor = useThemeColor({}, 'shadow');

  useEffect(() => {
    if (id) {
      loadWalkData(parseInt(id));
    }
  }, [id]);

  const loadWalkData = async (walkId: number) => {
    try {
      const [walkData, routeData] = await Promise.all([
        databaseService.getWalkById(walkId),
        databaseService.getRoutePoints(walkId),
      ]);
      
      setWalk(walkData);
      setRoutePoints(routeData);
    } catch (error) {
      console.error('Failed to load walk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDistance = (meters?: number): string => {
    if (!meters) return 'N/A';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText type="title">Loading...</ThemedText>
        </View>
      </View>
    );
  }

  if (!walk) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText type="title">Walk not found</ThemedText>
        </View>
      </View>
    );
  }

  // Calculate map region to fit the route
  const getMapRegion = () => {
    if (routePoints.length === 0) {
      return {
        latitude: walk.startLatitude,
        longitude: walk.startLongitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const latitudes = routePoints.map(point => point.latitude);
    const longitudes = routePoints.map(point => point.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const latDelta = (maxLat - minLat) * 1.2; // Add 20% padding
    const lngDelta = (maxLng - minLng) * 1.2;
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.005), // Minimum zoom level
      longitudeDelta: Math.max(lngDelta, 0.005),
    };
  };

  const polylineCoordinates = routePoints.map(point => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <MapView
        style={styles.map}
        region={getMapRegion()}
        showsUserLocation={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Start marker */}
        <Marker
          coordinate={{
            latitude: walk.startLatitude,
            longitude: walk.startLongitude,
          }}
          title="Start"
          description="Walk started here"
          pinColor="green"
        />
        
        {/* End marker */}
        {walk.endLatitude && walk.endLongitude && (
          <Marker
            coordinate={{
              latitude: walk.endLatitude,
              longitude: walk.endLongitude,
            }}
            title="End"
            description="Walk ended here"
            pinColor="red"
          />
        )}
        
        {/* Route polyline */}
        {polylineCoordinates.length > 1 && (
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor={tintColor}
            strokeWidth={4}
            lineJoin="round"
            lineCap="round"
          />
        )}
      </MapView>

      <ScrollView style={[styles.infoPanel, { backgroundColor }]}>
        <ThemedView style={[styles.walkInfo, { backgroundColor: cardBackground, shadowColor }]}>
          <ThemedText type="subtitle" style={[styles.walkDate, { color: textColor }]}>
            {formatDate(walk.createdAt)}
          </ThemedText>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Duration</ThemedText>
              <ThemedText style={[styles.statValue, { color: textColor }]}>{formatDuration(walk.duration)}</ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Distance</ThemedText>
              <ThemedText style={[styles.statValue, { color: textColor }]}>{formatDistance(walk.distance)}</ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Route Points</ThemedText>
              <ThemedText style={[styles.statValue, { color: textColor }]}>{routePoints.length}</ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Avg Speed</ThemedText>
              <ThemedText style={[styles.statValue, { color: textColor }]}>
                {walk.distance && walk.duration > 0 
                  ? `${((walk.distance / 1000) / (walk.duration / 3600)).toFixed(1)} km/h`
                  : 'N/A'
                }
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  map: {
    width: width,
    height: '60%',
  },
  infoPanel: {
    flex: 1,
    padding: 20,
  },
  walkInfo: {
    borderRadius: 12,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walkDate: {
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 