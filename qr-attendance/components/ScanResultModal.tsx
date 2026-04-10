import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

type ResultType = "success" | "already_marked" | "not_found" | "invalid_qr" | null;

interface Props {
  visible: boolean;
  result: ResultType;
  name?: string;
  id?: string;
  reason?: string;
  onClose: () => void;
}

export function ScanResultModal({ visible, result, name, id, reason, onClose }: Props) {
  const colors = useColors();
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 14, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 200 });
      if (result === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      scale.value = withTiming(0.7, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, result]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const config = getConfig(result, colors);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }, animStyle]}
        >
          <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon as any} size={40} color={config.color} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{config.title}</Text>
          {name && (
            <Text style={[styles.name, { color: colors.primary }]}>{name}</Text>
          )}
          {id && (
            <Text style={[styles.id, { color: colors.mutedForeground }]}>ID: {id}</Text>
          )}
          {reason && (
            <Text style={[styles.reason, { color: colors.destructive }]}>{reason}</Text>
          )}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: config.color, borderRadius: colors.radius }]}
            onPress={onClose}
          >
            <Text style={[styles.btnText, { color: "#fff" }]}>Continue Scanning</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function getConfig(result: ResultType, colors: ReturnType<typeof useColors>) {
  switch (result) {
    case "success":
      return {
        icon: "checkmark-circle",
        color: colors.primary,
        bg: colors.primary + "22",
        title: "Attendance Marked",
      };
    case "already_marked":
      return {
        icon: "warning",
        color: colors.warning,
        bg: colors.warning + "22",
        title: "Already Marked",
      };
    case "not_found":
      return {
        icon: "person-remove",
        color: colors.destructive,
        bg: colors.destructive + "22",
        title: "Not in List",
      };
    case "invalid_qr":
    default:
      return {
        icon: "close-circle",
        color: colors.destructive,
        bg: colors.destructive + "22",
        title: "Invalid QR Code",
      };
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
  },
  id: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: "Inter_400Regular",
  },
  reason: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Inter_400Regular",
  },
  btn: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
