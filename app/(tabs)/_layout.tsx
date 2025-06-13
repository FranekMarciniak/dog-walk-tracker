import { AntDesign } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useWalk } from '@/contexts/WalkContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isWalking, startWalk, stopWalk } = useWalk();

  const handleWalkToggle = () => {
    if (isWalking) {
      stopWalk();
    } else {
      startWalk();
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            height: 88,
          },
          default: {
            height: 70,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.addButtonContainer}>
              <View style={[
                styles.addButton, 
                { backgroundColor: isWalking ? '#ff4444' : Colors[colorScheme ?? 'light'].tint }
              ]}>
                <AntDesign 
                  name={isWalking ? "pause" : "plus"} 
                  size={28} 
                  color="black" 
                />
              </View>
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              onPress={handleWalkToggle}
              onLongPress={props.onLongPress || undefined}
              testID={props.testID}
              accessibilityLabel={props.accessibilityLabel}
              style={[props.style, styles.addButtonTab]}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="clock.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  addButtonTab: {
    top: -10,
  },
});
