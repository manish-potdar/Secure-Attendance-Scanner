import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function SessionModal({ visible, onConfirm, onCancel }: Props) {
  const colors = useColors();
  const [name, setName] = useState("");

  function handleConfirm() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setName("");
  }

  function handleCancel() {
    setName("");
    onCancel();
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>New Session</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Give this attendance session a name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: colors.radius / 2,
              },
            ]}
            placeholder="e.g. Morning Class, Day 1..."
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { borderColor: colors.border, borderRadius: colors.radius / 2 }]}
              onPress={handleCancel}
            >
              <Text style={[styles.btnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.confirmBtn,
                { backgroundColor: name.trim() ? colors.primary : colors.muted, borderRadius: colors.radius / 2 },
              ]}
              onPress={handleConfirm}
              disabled={!name.trim()}
            >
              <Text style={[styles.btnText, { color: name.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                Start
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    fontFamily: "Inter_700Bold",
  },
  sub: {
    fontSize: 14,
    marginBottom: 20,
    fontFamily: "Inter_400Regular",
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {},
  btnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
