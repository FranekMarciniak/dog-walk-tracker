import { AntDesign } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useWalk } from '@/contexts/WalkContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AddScreen() {
  const { isWalking, startWalk, stopWalk, walkStartTime } = useWalk();
  const [walkDuration, setWalkDuration] = useState(0);
  const colorScheme = useColorScheme();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'screenBackground');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({}, 'secondaryText');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  const shadowColor = useThemeColor({}, 'shadow');
  const placeholderColor = useThemeColor({}, 'placeholder');

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
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.walkingContainer}>
          <IconSymbol
            size={120}
            color={tintColor}
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
            style={[styles.actionButton, { backgroundColor: errorColor, shadowColor }]}
            onPress={handlePress}
          >
            <AntDesign name="pause" size={32} color="white" />
            <ThemedText style={styles.buttonText}>Stop Walk</ThemedText>
          </Pressable>

          <ThemedView style={styles.infoContainer}>
            <ThemedText style={[styles.infoText, { color: secondaryTextColor }]}>
              Your walk is being tracked. Tap the button above to stop recording.
            </ThemedText>
          </ThemedView>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.centerContent}>
        <IconSymbol
          size={120}
          color={placeholderColor}
          name="plus.circle.fill"
          style={styles.headerImage}
        />
        
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Start New Walk</ThemedText>
        </ThemedView>
        
        <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>Ready to take your dog for a walk?</ThemedText>
        
        <Pressable
          style={[styles.actionButton, { backgroundColor: tintColor, shadowColor }]}
          onPress={handlePress}
        >
          <AntDesign name="plus" size={32} color="white" />
          <ThemedText style={styles.buttonText}>Start Walk</ThemedText>
        </Pressable>

        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">What we'll track:</ThemedText>
          <ThemedText style={[styles.featureText, { color: secondaryTextColor }]}>• Route and distance</ThemedText>
          <ThemedText style={[styles.featureText, { color: secondaryTextColor }]}>• Duration</ThemedText>
          <ThemedText style={[styles.featureText, { color: secondaryTextColor }]}>• Average pace</ThemedText>
        </ThemedView>
      </View>
    </View>
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
    paddingHorizontal: 20,
  },
  walkingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerImage: {
    marginBottom: 30,
  },
  walkingIcon: {
    marginBottom: 30,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  walkingTitle: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  durationText: {
    textAlign: 'center',
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 30,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  stepContainer: {
    alignItems: 'center',
    marginTop: 30,
    padding: 20,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 16,
    marginVertical: 4,
    textAlign: 'center',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  infoContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 