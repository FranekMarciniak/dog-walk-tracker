import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
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

  // Theme colors
  const backgroundColor = useThemeColor({}, 'screenBackground');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({}, 'secondaryText');
  const tertiaryTextColor = useThemeColor({}, 'tertiaryText');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  const shadowColor = useThemeColor({}, 'shadow');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const iconColor = useThemeColor({}, 'icon');

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
        <View style={[styles.deleteBackground, { backgroundColor: errorColor }]}>
          <IconSymbol size={24} name="trash" color="#fff" />
          <ThemedText style={styles.deleteText}>Delete</ThemedText>
        </View>
        
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
                    <Animated.View style={[styles.walkItemAnimated, { backgroundColor: cardBackground, transform: [{ translateX }] }]}>
            <Pressable 
              style={({ pressed }) => [
                styles.walkItem,
                { backgroundColor: cardBackground, shadowColor },
                pressed && styles.walkItemPressed
              ]} 
              onPress={() => handleWalkPress(walk.id!)}
            >
              <View style={[styles.walkItemContent, { backgroundColor: cardBackground }]}>
                <View style={styles.walkHeader}>
                  <IconSymbol size={20} name="figure.walk" color={tintColor} />
                  <ThemedText style={[styles.walkDate, { color: textColor }]}>{formatDate(walk.createdAt)}</ThemedText>
                  <IconSymbol size={16} name="chevron.right" color={tertiaryTextColor} style={styles.chevron} />
                </View>
                
                <View style={styles.walkStats}>
                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Duration</ThemedText>
                    <ThemedText style={[styles.statValue, { color: textColor }]}>{formatDuration(walk.duration)}</ThemedText>
                  </View>
                  
                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Distance</ThemedText>
                    <ThemedText style={[styles.statValue, { color: textColor }]}>{formatDistance(walk.distance)}</ThemedText>
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
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.centerContent}>
          <ThemedText>Loading walk history...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <IconSymbol
          size={80}
          color={textColor}
          name="clock.fill"
          style={styles.headerIcon}
        />
        <ThemedText type="title" style={[styles.title, { color: textColor }]}>Walk History</ThemedText>
      </View>

      {/* Overall Statistics */}
      <ThemedView style={[styles.statsContainer, { backgroundColor: cardBackground, shadowColor }]}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>Overall Statistics</ThemedText>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.statNumber, { color: textColor }]}>{stats.totalWalks}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Total Walks</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.statNumber, { color: textColor }]}>{formatDuration(stats.totalDuration)}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Total Time</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.statNumber, { color: textColor }]}>{formatDistance(stats.totalDistance)}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Total Distance</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.statNumber, { color: textColor }]}>{formatDuration(Math.round(stats.averageDuration))}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Avg Duration</ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* Recent Walks */}
      <ThemedView style={[styles.section, { backgroundColor: cardBackground, shadowColor }]}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>Recent Walks</ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: secondaryTextColor }]}>Tap to view route • Swipe left to delete</ThemedText>
        
        {walks.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol size={60} name="figure.walk" color={placeholderColor} />
            <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>No walks recorded yet</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: tertiaryTextColor }]}>Start your first walk to see it here!</ThemedText>
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
  },
  statsContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
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
    borderRadius: 8,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
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
    borderRadius: 8,
  },
  walkItem: {
    borderRadius: 8,
    overflow: 'hidden',
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
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 