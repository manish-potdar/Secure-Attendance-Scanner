import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAttendance, Session } from "@/context/AttendanceContext";
import { useColors } from "@/hooks/useColors";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, currentSession, deleteSession } = useAttendance();
  const [expanded, setExpanded] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 84 : insets.bottom + 49;

  const allSessions = [
    ...(currentSession ? [{ ...currentSession, isActive: true }] : []),
    ...sessions
      .filter((s) => s.id !== currentSession?.id)
      .map((s) => ({ ...s, isActive: false })),
  ];

  function handleDelete(session: Session) {
    Alert.alert(
      "Delete Session",
      `Delete "${session.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteSession(session.id);
            if (expanded === session.id) setExpanded(null);
          },
        },
      ]
    );
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>History</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {allSessions.length} session{allSessions.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {allSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Ionicons name="time-outline" size={56} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Sessions Yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Start scanning attendance to see history here
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {allSessions.map((session) => {
            const isExpanded = expanded === session.id;
            const isActive = (session as any).isActive;
            return (
              <View
                key={session.id}
                style={[
                  styles.sessionCard,
                  {
                    backgroundColor: colors.card,
                    borderRadius: colors.radius,
                    borderColor: isActive ? colors.primary + "60" : colors.border,
                    borderWidth: isActive ? 1.5 : 1,
                  },
                ]}
              >
                <View style={styles.sessionHeader}>
                  {/* Left: tap to expand/collapse */}
                  <TouchableOpacity
                    style={styles.sessionInfoTouchable}
                    onPress={() => setExpanded(isExpanded ? null : session.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sessionInfo}>
                      <View style={styles.sessionTitleRow}>
                        {isActive && (
                          <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                        )}
                        <Text
                          style={[styles.sessionName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {session.name}
                        </Text>
                      </View>
                      <Text style={[styles.sessionMeta, { color: colors.mutedForeground }]}>
                        {formatTime(session.createdAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {/* Right: count + delete + chevron — NOT nested inside expand touchable */}
                  <View style={styles.sessionRight}>
                    <View style={[styles.countChip, { backgroundColor: colors.primary + "20", borderRadius: 12 }]}>
                      <Text style={[styles.countChipText, { color: colors.primary }]}>
                        {session.records.length}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(session)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setExpanded(isExpanded ? null : session.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {isExpanded && session.records.length > 0 && (
                  <View style={[styles.recordsList, { borderTopColor: colors.border }]}>
                    {session.records.map((record, idx) => (
                      <View
                        key={`${record.name}-${record.timestamp}`}
                        style={[
                          styles.recordRow,
                          {
                            borderBottomColor: colors.border,
                            borderBottomWidth: idx < session.records.length - 1 ? StyleSheet.hairlineWidth : 0,
                          },
                        ]}
                      >
                        <View style={[styles.recordAvatar, { backgroundColor: colors.primary + "20", borderRadius: 16 }]}>
                          <Text style={[styles.recordAvatarText, { color: colors.primary }]}>
                            {record.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.recordName, { color: colors.foreground }]}>
                            {record.name}
                          </Text>
                          {record.id && (
                            <Text style={[styles.recordId, { color: colors.mutedForeground }]}>
                              ID: {record.id}
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.recordTime, { color: colors.mutedForeground }]}>
                          {new Date(record.timestamp).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {isExpanded && session.records.length === 0 && (
                  <View style={[styles.emptyRecords, { borderTopColor: colors.border }]}>
                    <Text style={[styles.emptyRecordsText, { color: colors.mutedForeground }]}>
                      No attendance marked yet
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyCard: {
    alignItems: "center",
    padding: 40,
    gap: 12,
    width: "100%",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sessionCard: {
    overflow: "hidden",
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  sessionInfoTouchable: {
    flex: 1,
  },
  sessionInfo: {
    flex: 1,
    gap: 3,
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  sessionMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  sessionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countChipText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  deleteBtn: {
    padding: 2,
  },
  recordsList: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  recordAvatar: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  recordAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  recordName: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  recordId: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  recordTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  emptyRecords: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyRecordsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
