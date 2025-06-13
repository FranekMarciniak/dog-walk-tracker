import { AntDesign } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useWalk } from '@/contexts/WalkContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function AddScreen() {
  const { isWalking, startWalk, stopWalk, walkStartTime } = useWalk();
  const [walkDuration, setWalkDuration] = useState(0);
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePress = () => {
    if (isWalking) {
      stopWalk();
    } else {
      startWalk();
    }
  };

  if (isWalking) {
    return (
      <View style={styles.container}>
        <View style={styles.walkingContainer}>
          <IconSymbol
            size={120}
            color={Colors[colorScheme ?? 'light'].tint}
            name="figure.walk"
            style={styles.walkingIcon}
          />
          
          <ThemedView style={styles.statsContainer}>
            <ThemedText type="title" style={styles.walkingTitle}>Walk in Progress</ThemedText>
            <ThemedText type="subtitle" style={styles.durationText}>
              {formatDuration(walkDuration)}
            </ThemedText>
          </ThemedView>

          <Pressable
            style={[styles.actionButton, { backgroundColor: '#ff4444' }]}
            onPress={handlePress}
          >
            <AntDesign name="pause" size={32} color="white" />
            <ThemedText style={styles.buttonText}>Stop Walk</ThemedText>
          </Pressable>

          <ThemedView style={styles.infoContainer}>
            <ThemedText style={styles.infoText}>
              Your walk is being tracked. Tap the button above to stop recording.
            </ThemedText>
          </ThemedView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <IconSymbol
          size={120}
          color="#808080"
          name="plus.circle.fill"
          style={styles.headerImage}
        />
        
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Start New Walk</ThemedText>
        </ThemedView>
        
        <ThemedText style={styles.subtitle}>Ready to take your dog for a walk?</ThemedText>
        
        <Pressable
          style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={handlePress}
        >
          <AntDesign name="plus" size={32} color="white" />
          <ThemedText style={styles.buttonText}>Start Walk</ThemedText>
        </Pressable>

        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">What we'll track:</ThemedText>
          <ThemedText style={styles.featureText}>• Route and distance</ThemedText>
          <ThemedText style={styles.featureText}>• Duration</ThemedText>
          <ThemedText style={styles.featureText}>• Average pace</ThemedText>
        </ThemedView>
      </View>
    </View>
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
    padding: 20,
  },
  walkingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerImage: {
    marginBottom: 20,
  },
  walkingIcon: {
    marginBottom: 30,
  },
  titleContainer: {
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  walkingTitle: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  durationText: {
    textAlign: 'center',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  infoText: {
    textAlign: 'center',
    color: '#666',
  },
  stepContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  featureText: {
    color: '#666',
    marginLeft: 10,
    marginVertical: 2,
  },
}); 