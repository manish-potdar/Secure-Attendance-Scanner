import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAttendance } from "@/context/AttendanceContext";
import { useColors } from "@/hooks/useColors";
import { generateQRData } from "@/utils/qrSecurity";

export default function GenerateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { people } = useAttendance();
  const [selectedPerson, setSelectedPerson] = useState<{ name: string; id: string } | null>(null);
  const [customName, setCustomName] = useState("");
  const [customId, setCustomId] = useState("");
  const [qrData, setQrData] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<"list" | "custom">("list");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleGenerate() {
    const name = mode === "list" ? selectedPerson?.name : customName.trim();
    const id = mode === "list" ? (selectedPerson?.id ?? "") : customId.trim();
    if (!name) {
      Alert.alert("Missing Name", "Please enter or select a name.");
      return;
    }
    setGenerating(true);
    try {
      const data = await generateQRData(name, id);
      setQrData(data);
    } catch {
      Alert.alert("Error", "Could not generate QR code.");
    }
    setGenerating(false);
  }

  function handleReset() {
    setQrData(null);
    setSelectedPerson(null);
    setCustomName("");
    setCustomId("");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Generate QR</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Create signed attendance QR codes
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {qrData ? (
          <View style={styles.qrContainer}>
            <View style={[styles.qrCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <Text style={[styles.qrName, { color: colors.foreground }]}>
                {mode === "list" ? selectedPerson?.name : customName}
              </Text>
              {(mode === "list" ? selectedPerson?.id : customId) ? (
                <Text style={[styles.qrId, { color: colors.mutedForeground }]}>
                  ID: {mode === "list" ? selectedPerson?.id : customId}
                </Text>
              ) : null}
              <View style={[styles.qrBox, { backgroundColor: "#fff", borderRadius: 12, padding: 20, marginTop: 16 }]}>
                <QRCode value={qrData} size={220} color={colors.navy} />
              </View>
              <View style={[styles.sigBadge, { backgroundColor: colors.primary + "20", borderRadius: 20, marginTop: 20 }]}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                <Text style={[styles.sigText, { color: colors.primary }]}>Cryptographically Signed</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: colors.border, borderRadius: colors.radius }]}
              onPress={handleReset}
            >
              <Ionicons name="refresh" size={20} color={colors.foreground} />
              <Text style={[styles.resetBtnText, { color: colors.foreground }]}>Generate Another</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.securityNote, { backgroundColor: colors.navyMid + "15", borderRadius: colors.radius, borderColor: colors.navyMid + "40", borderWidth: 1 }]}>
              <Ionicons name="shield-checkmark" size={18} color={colors.navyMid} />
              <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
                QR codes include a cryptographic signature. Only codes generated here will pass verification.
              </Text>
            </View>

            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  {
                    backgroundColor: mode === "list" ? colors.navy : colors.card,
                    borderRadius: colors.radius / 2,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setMode("list")}
              >
                <Text style={[styles.modeBtnText, { color: mode === "list" ? "#fff" : colors.mutedForeground }]}>
                  From List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  {
                    backgroundColor: mode === "custom" ? colors.navy : colors.card,
                    borderRadius: colors.radius / 2,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setMode("custom")}
              >
                <Text style={[styles.modeBtnText, { color: mode === "custom" ? "#fff" : colors.mutedForeground }]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {mode === "list" ? (
              people.length === 0 ? (
                <View style={[styles.emptyList, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
                  <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
                  <Text style={[styles.emptyListText, { color: colors.mutedForeground }]}>
                    No data loaded. Go to Upload tab first.
                  </Text>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  <Text style={[styles.listLabel, { color: colors.mutedForeground }]}>
                    Select a person
                  </Text>
                  {people.map((p) => (
                    <TouchableOpacity
                      key={p.name}
                      style={[
                        styles.personItem,
                        {
                          backgroundColor: selectedPerson?.name === p.name ? colors.primary + "15" : colors.card,
                          borderColor: selectedPerson?.name === p.name ? colors.primary : colors.border,
                          borderRadius: colors.radius / 2,
                        },
                      ]}
                      onPress={() => setSelectedPerson({ name: p.name, id: p.id })}
                    >
                      <View style={[styles.personAvatar, { backgroundColor: colors.primary + "20", borderRadius: 16 }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                          {p.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.personName, { color: colors.foreground }]}>{p.name}</Text>
                        {p.id && <Text style={[styles.personId, { color: colors.mutedForeground }]}>ID: {p.id}</Text>}
                      </View>
                      {selectedPerson?.name === p.name && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )
            ) : (
              <View style={styles.customForm}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>Name *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: colors.radius / 2,
                    },
                  ]}
                  placeholder="Full name"
                  placeholderTextColor={colors.mutedForeground}
                  value={customName}
                  onChangeText={setCustomName}
                />
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>ID (optional)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: colors.radius / 2,
                    },
                  ]}
                  placeholder="Student ID / Employee ID"
                  placeholderTextColor={colors.mutedForeground}
                  value={customId}
                  onChangeText={setCustomId}
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.generateBtn,
                {
                  backgroundColor:
                    (mode === "list" && !selectedPerson) || (mode === "custom" && !customName.trim())
                      ? colors.muted
                      : colors.primary,
                  borderRadius: colors.radius,
                },
              ]}
              onPress={handleGenerate}
              disabled={
                generating ||
                (mode === "list" && !selectedPerson) ||
                (mode === "custom" && !customName.trim())
              }
            >
              <Ionicons name="qr-code" size={22} color="#fff" />
              <Text style={styles.generateBtnText}>
                {generating ? "Generating..." : "Generate QR Code"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 13,
    marginTop: 1,
    fontFamily: "Inter_400Regular",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  securityNote: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    alignItems: "flex-start",
  },
  securityText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    flex: 1,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  listContainer: {
    gap: 8,
  },
  listLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  emptyList: {
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyListText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  personItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
  },
  personAvatar: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  personName: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  personId: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  customForm: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  qrContainer: {
    alignItems: "center",
    gap: 16,
  },
  qrCard: {
    alignItems: "center",
    padding: 28,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  qrName: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  qrId: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  qrBox: {},
  sigBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  sigText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderWidth: 1,
    width: "100%",
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
