import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAttendance } from "@/context/AttendanceContext";
import { useColors } from "@/hooks/useColors";
import { parseCSV, Person } from "@/utils/csvParser";

export default function UploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { people, setPeople } = useAttendance();

  // Manual entry state
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [addError, setAddError] = useState("");
  const idInputRef = useRef<TextInput>(null);

  // CSV state
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 84 : insets.bottom + 49;

  // ── Manual entry ────────────────────────────────────────────────
  function handleAddPerson() {
    const name = newName.trim();
    if (!name) {
      setAddError("Name is required");
      return;
    }
    const duplicate = people.some(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      setAddError(`"${name}" already exists`);
      return;
    }
    const id = newId.trim() || `${Date.now()}`;
    const person: Person = { name, id, extra: {} };
    setPeople([...people, person]);
    setNewName("");
    setNewId("");
    setAddError("");
  }

  function handleDeletePerson(name: string) {
    Alert.alert("Remove Person", `Remove "${name}" from the list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setPeople(people.filter((p) => p.name !== name)),
      },
    ]);
  }

  function handleClearAll() {
    Alert.alert(
      "Clear All",
      `Remove all ${people.length} records? This won't affect active sessions.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: () => setPeople([]) },
      ]
    );
  }

  // ── CSV import ───────────────────────────────────────────────────
  async function handlePickCSV() {
    try {
      setLoading(true);
      setCsvErrors([]);
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) { setLoading(false); return; }

      const file = result.assets?.[0];
      if (!file) {
        setLoading(false);
        Alert.alert("No File", "No file was returned. Please try again.");
        return;
      }

      let text = "";
      const uri = file.uri;
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        text = await response.text();
      } else {
        // expo-file-system/legacy keeps readAsStringAsync working on SDK 54
        try {
          text = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        } catch {
          // If direct read fails, copy to cache first then read
          const ext = file.name?.split(".").pop()?.toLowerCase() ?? "csv";
          const dest = `${FileSystem.cacheDirectory ?? ""}import_${Date.now()}.${ext}`;
          await FileSystem.copyAsync({ from: uri, to: dest });
          text = await FileSystem.readAsStringAsync(dest, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        }
      }

      if (!text.trim()) {
        setLoading(false);
        Alert.alert("Empty File", "The selected file appears to be empty.");
        return;
      }

      const { people: parsed, errors: parseErrors } = parseCSV(text);

      if (parsed.length === 0 && parseErrors.length > 0) {
        setLoading(false);
        setCsvErrors(parseErrors);
        Alert.alert(
          "Could Not Parse CSV",
          parseErrors[0] +
            "\n\nMake sure the first row has a column named 'name'.\nExample:\nname,id\nAlice,1"
        );
        return;
      }

      // Merge: keep existing, add new non-duplicates
      const existingNames = new Set(people.map((p) => p.name.toLowerCase()));
      const toAdd = parsed.filter((p) => !existingNames.has(p.name.toLowerCase()));
      const skipped = parsed.length - toAdd.length;
      setPeople([...people, ...toAdd]);
      setCsvErrors(parseErrors);
      setLoading(false);
      Alert.alert(
        "CSV Imported",
        `Added ${toAdd.length} records.${skipped > 0 ? ` Skipped ${skipped} duplicates.` : ""}`
      );
    } catch (e: any) {
      setLoading(false);
      Alert.alert(
        "Could Not Read File",
        `${e?.message ?? "Unknown error"}\n\nMake sure the file is a plain .csv text file.`
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>People</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          Add people manually or import via CSV
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Add Person Form ─────────────────────────────────── */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderRadius: colors.radius,
              borderColor: colors.primary + "40",
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.formHeader}>
            <Ionicons name="person-add-outline" size={18} color={colors.primary} />
            <Text style={[styles.formTitle, { color: colors.foreground }]}>
              Add Person
            </Text>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.inputWrap, { flex: 2, borderColor: addError && !newName.trim() ? colors.destructive : colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Full name *"
                placeholderTextColor={colors.mutedForeground}
                value={newName}
                onChangeText={(t) => { setNewName(t); setAddError(""); }}
                returnKeyType="next"
                onSubmitEditing={() => idInputRef.current?.focus()}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.inputWrap, { flex: 1, borderColor: colors.border }]}>
              <TextInput
                ref={idInputRef}
                style={[styles.input, { color: colors.foreground }]}
                placeholder="ID (opt)"
                placeholderTextColor={colors.mutedForeground}
                value={newId}
                onChangeText={setNewId}
                returnKeyType="done"
                onSubmitEditing={handleAddPerson}
                autoCapitalize="none"
              />
            </View>
          </View>

          {addError ? (
            <Text style={[styles.addError, { color: colors.destructive }]}>{addError}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            onPress={handleAddPerson}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add to List</Text>
          </TouchableOpacity>
        </View>

        {/* ── CSV errors ──────────────────────────────────────── */}
        {csvErrors.length > 0 && (
          <View
            style={[
              styles.errCard,
              {
                backgroundColor: colors.destructive + "15",
                borderRadius: colors.radius,
                borderColor: colors.destructive + "40",
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons name="warning" size={18} color={colors.destructive} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.errTitle, { color: colors.destructive }]}>
                {csvErrors.length} CSV Warning{csvErrors.length > 1 ? "s" : ""}
              </Text>
              {csvErrors.slice(0, 3).map((e, i) => (
                <Text key={i} style={[styles.errText, { color: colors.destructive }]}>{e}</Text>
              ))}
            </View>
          </View>
        )}

        {/* ── People list ─────────────────────────────────────── */}
        {people.length > 0 ? (
          <>
            <View style={styles.listHeader}>
              <Text style={[styles.listCount, { color: colors.foreground }]}>
                {people.length} {people.length === 1 ? "person" : "people"} loaded
              </Text>
              <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              </TouchableOpacity>
            </View>
            {people.map((person, idx) => (
              <View
                key={`${person.name}-${idx}`}
                style={[
                  styles.personRow,
                  {
                    backgroundColor: colors.card,
                    borderRadius: colors.radius / 2,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.personAvatar,
                    { backgroundColor: colors.primary + "22", borderRadius: 20 },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {person.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.personName, { color: colors.foreground }]}>
                    {person.name}
                  </Text>
                  {person.id && (
                    <Text style={[styles.personId, { color: colors.mutedForeground }]}>
                      ID: {person.id}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDeletePerson(person.name)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle-outline" size={22} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            <Ionicons name="people-outline" size={52} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No People Yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Add people using the form above, or import a CSV file below
            </Text>
          </View>
        )}

        {/* ── CSV import (secondary option) ───────────────────── */}
        <TouchableOpacity
          style={[
            styles.csvBtn,
            {
              borderColor: colors.border,
              borderRadius: colors.radius,
              backgroundColor: colors.card,
            },
          ]}
          onPress={handlePickCSV}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Ionicons
            name={loading ? "hourglass-outline" : "document-text-outline"}
            size={20}
            color={colors.mutedForeground}
          />
          <Text style={[styles.csvBtnText, { color: colors.mutedForeground }]}>
            {loading ? "Reading file…" : "Import from CSV file"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 14,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  // Form card
  formCard: {
    padding: 16,
    gap: 12,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  addError: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: -4,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  // Errors
  errCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    alignItems: "flex-start",
  },
  errTitle: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  errText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  // List
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  listCount: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  personAvatar: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
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
  // Empty
  emptyState: {
    alignItems: "center",
    padding: 36,
    gap: 10,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  // CSV button
  csvBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  csvBtnText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
