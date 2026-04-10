import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Scanner",
          tabBarIcon: ({ color }) => (
            <Ionicons name="scan-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Upload",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cloud-upload-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <Ionicons name="time-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
