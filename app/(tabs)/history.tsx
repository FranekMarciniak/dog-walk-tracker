import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { databaseService, Walk } from '@/services/database';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

export default function HistoryScreen() {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [stats, setStats] = useState({
    totalWalks: 0,
    totalDuration: 0,
    totalDistance: 0,
    averageDuration: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();

  const loadWalks = useCallback(async () => {
    try {
      const [walkData, statsData] = await Promise.all([
        databaseService.getAllWalks(),
        databaseService.getWalkStats(),
      ]);
      setWalks(walkData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load walks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWalks();
  }, [loadWalks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWalks();
  }, [loadWalks]);

  const deleteWalk = useCallback(async (walkId: number) => {
    try {
      await databaseService.deleteWalk(walkId);
      await loadWalks(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete walk:', error);
      Alert.alert('Error', 'Failed to delete walk. Please try again.');
    }
  }, [loadWalks]);

  const confirmDelete = useCallback((walk: Walk) => {
    Alert.alert(
      'Delete Walk',
      `Are you sure you want to delete this walk from ${formatDate(walk.createdAt)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteWalk(walk.id!)
        }
      ]
    );
  }, [deleteWalk]);

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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleWalkPress = (walkId: number) => {
    router.push(`/walk-detail?id=${walkId}`);
  };

  const SwipeableWalkItem = ({ walk }: { walk: Walk }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true }
    );

    const onHandlerStateChange = (event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX } = event.nativeEvent;
        
        if (translationX < -100) {
          // Swipe left to delete
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -300,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start(() => {
            confirmDelete(walk);
            // Reset animation
            translateX.setValue(0);
            opacity.setValue(1);
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      }
    };

    return (
      <Animated.View style={[styles.walkItemContainer, { opacity }]}>
        <View style={styles.deleteBackground}>
          <IconSymbol size={24} name="trash" color="#fff" />
          <ThemedText style={styles.deleteText}>Delete</ThemedText>
        </View>
        
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View style={[styles.walkItemAnimated, { transform: [{ translateX }] }]}>
            <Pressable 
              style={({ pressed }) => [
                styles.walkItem,
                pressed && styles.walkItemPressed
              ]} 
              onPress={() => handleWalkPress(walk.id!)}
            >
              <View style={styles.walkItemContent}>
                <View style={styles.walkHeader}>
                  <IconSymbol size={20} name="figure.walk" color={Colors[colorScheme ?? 'light'].tint} />
                  <ThemedText style={styles.walkDate}>{formatDate(walk.createdAt)}</ThemedText>
                  <IconSymbol size={16} name="chevron.right" color="#999" style={styles.chevron} />
                </View>
                
                <View style={styles.walkStats}>
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statLabel}>Duration</ThemedText>
                    <ThemedText style={styles.statValue}>{formatDuration(walk.duration)}</ThemedText>
                  </View>
                  
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statLabel}>Distance</ThemedText>
                    <ThemedText style={styles.statValue}>{formatDistance(walk.distance)}</ThemedText>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ThemedText>Loading walk history...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <IconSymbol
          size={80}
          color="black"
          name="clock.fill"
          style={styles.headerIcon}
        />
        <ThemedText type="title" style={styles.title}>Walk History</ThemedText>
      </View>

      {/* Overall Statistics */}
      <ThemedView style={styles.statsContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Overall Statistics</ThemedText>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{stats.totalWalks}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Walks</ThemedText>
          </View>
          
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{formatDuration(stats.totalDuration)}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Time</ThemedText>
          </View>
          
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{formatDistance(stats.totalDistance)}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Distance</ThemedText>
          </View>
          
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{formatDuration(Math.round(stats.averageDuration))}</ThemedText>
            <ThemedText style={styles.statLabel}>Avg Duration</ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* Recent Walks */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Walks</ThemedText>
        <ThemedText style={styles.sectionSubtitle}>Tap to view route • Swipe left to delete</ThemedText>
        
        {walks.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol size={60} name="figure.walk" color="#ccc" />
            <ThemedText style={styles.emptyText}>No walks recorded yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Start your first walk to see it here!</ThemedText>
          </View>
        ) : (
          walks.map((walk) => <SwipeableWalkItem key={walk.id} walk={walk} />)
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerIcon: {
    marginBottom: 10,
  },
  title: {
    textAlign: 'center',
    color: '#333',
  },
  statsContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  walkItemContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 8,
  },
  deleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  walkItemAnimated: {
    backgroundColor: 'white',
    borderRadius: 8,
  },
  walkItem: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  walkItemPressed: {
    opacity: 0.8,
  },
  walkItemContent: {
    padding: 15,
    backgroundColor: 'white',
  },
  walkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  walkDate: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  chevron: {
    marginLeft: 10,
  },
  walkStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
}); 