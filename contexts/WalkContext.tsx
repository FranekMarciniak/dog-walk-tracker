import { databaseService, RoutePoint, Walk } from '@/services/database';
import * as Location from 'expo-location';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface WalkContextType {
  isWalking: boolean;
  startWalk: () => void;
  stopWalk: () => void;
  walkStartTime: Date | null;
  startLocation: LocationCoords | null;
  currentLocation: LocationCoords | null;
  routePoints: LocationCoords[];
}

const WalkContext = createContext<WalkContextType | undefined>(undefined);

export function WalkProvider({ children }: { children: ReactNode }) {
  const [isWalking, setIsWalking] = useState(false);
  const [walkStartTime, setWalkStartTime] = useState<Date | null>(null);
  const [startLocation, setStartLocation] = useState<LocationCoords | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [routePoints, setRoutePoints] = useState<LocationCoords[]>([]);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    // Initialize database when provider mounts
    databaseService.init();
  }, []);

  useEffect(() => {
    // Cleanup location subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  const getCurrentLocation = async (): Promise<LocationCoords | null> => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  const startLocationTracking = async () => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const newPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          setCurrentLocation(newPoint);
          setRoutePoints(prev => [...prev, newPoint]);
          
          console.log('New location point:', newPoint);
        }
      );
      
      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Failed to start location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  const startWalk = async () => {
    try {
      const location = await getCurrentLocation();
      if (!location) {
        console.error('Could not get current location to start walk');
        return;
      }

      setIsWalking(true);
      setWalkStartTime(new Date());
      setStartLocation(location);
      setCurrentLocation(location);
      setRoutePoints([location]); // Start with the initial location
      
      // Start continuous location tracking
      await startLocationTracking();
      
      console.log('Walk started at:', location);
    } catch (error) {
      console.error('Failed to start walk:', error);
    }
  };

  const stopWalk = async () => {
    if (!walkStartTime || !startLocation) {
      console.error('Cannot stop walk: missing start data');
      return;
    }

    try {
      // Stop location tracking
      stopLocationTracking();
      
      const endLocation = await getCurrentLocation();
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - walkStartTime.getTime()) / 1000);

      // Calculate total distance from route points
      const totalDistance = calculateRouteDistance(routePoints);

      // Save walk to database
      const walkData: Omit<Walk, 'id'> = {
        startTime: walkStartTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        startLatitude: startLocation.latitude,
        startLongitude: startLocation.longitude,
        endLatitude: endLocation?.latitude,
        endLongitude: endLocation?.longitude,
        distance: totalDistance,
        createdAt: endTime.toISOString(),
      };

      const walkId = await databaseService.saveWalk(walkData);
      if (walkId) {
        console.log('Walk saved successfully with ID:', walkId);
        
        // Save route points
        const routePointsData: Omit<RoutePoint, 'id'>[] = routePoints.map((point, index) => ({
          walkId,
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: new Date(walkStartTime.getTime() + (index * 5000)).toISOString(),
          accuracy: undefined,
        }));
        
        const routeSaved = await databaseService.saveRoutePoints(routePointsData);
        if (routeSaved) {
          console.log('Route points saved successfully');
        }
      } else {
        console.error('Failed to save walk to database');
      }

      // Reset state
      setIsWalking(false);
      setWalkStartTime(null);
      setStartLocation(null);
      setRoutePoints([]);
      
      console.log('Walk stopped. Duration:', duration, 'seconds. Distance:', totalDistance, 'meters');
    } catch (error) {
      console.error('Failed to stop walk:', error);
      // Reset state even if save failed
      stopLocationTracking();
      setIsWalking(false);
      setWalkStartTime(null);
      setStartLocation(null);
      setRoutePoints([]);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (start: LocationCoords, end: LocationCoords): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (start.latitude * Math.PI) / 180;
    const φ2 = (end.latitude * Math.PI) / 180;
    const Δφ = ((end.latitude - start.latitude) * Math.PI) / 180;
    const Δλ = ((end.longitude - start.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Calculate total distance for a route with multiple points
  const calculateRouteDistance = (points: LocationCoords[]): number => {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += calculateDistance(points[i - 1], points[i]);
    }
    
    return totalDistance;
  };

  return (
    <WalkContext.Provider value={{ 
      isWalking, 
      startWalk, 
      stopWalk, 
      walkStartTime, 
      startLocation,
      currentLocation,
      routePoints
    }}>
      {children}
    </WalkContext.Provider>
  );
}

export function useWalk() {
  const context = useContext(WalkContext);
  if (context === undefined) {
    throw new Error('useWalk must be used within a WalkProvider');
  }
  return context;
} 