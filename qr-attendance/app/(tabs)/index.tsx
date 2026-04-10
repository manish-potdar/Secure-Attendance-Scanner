import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScanResultModal } from "@/components/ScanResultModal";
import { SessionModal } from "@/components/SessionModal";
import { useAttendance } from "@/context/AttendanceContext";
import { useColors } from "@/hooks/useColors";
import { verifyQRData } from "@/utils/qrSecurity";

type ResultType = "success" | "already_marked" | "not_found" | "invalid_qr" | null;

export default function ScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { people, currentSession, createSession, markAttendance, clearCurrentSession } = useAttendance();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [scanResult, setScanResult] = useState<ResultType>(null);
  const [scannedName, setScannedName] = useState<string | undefined>();
  const [scannedId, setScannedId] = useState<string | undefined>();
  const [scanReason, setScanReason] = useState<string | undefined>();
  const [showResultModal, setShowResultModal] = useState(false);
  const isProcessing = useRef(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 84 : insets.bottom + 49;

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (isProcessing.current || !currentSession) return;
    isProcessing.current = true;

    const verified = await verifyQRData(data);
    let result: ResultType;
    let reason: string | undefined;

    if (!verified.valid) {
      result = "invalid_qr";
      reason = verified.reason;
      setScannedName(undefined);
      setScannedId(undefined);
    } else {
      const markResult = markAttendance(verified.name!, verified.id!);
      result = markResult === "success" ? "success" : markResult === "already_marked" ? "already_marked" : "not_found";
      setScannedName(verified.name);
      setScannedId(verified.id);
    }

    setScanResult(result);
    setScanReason(reason);
    setShowResultModal(true);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function handleResultClose() {
    setShowResultModal(false);
    setTimeout(() => {
      isProcessing.current = false;
    }, 600);
  }

  function handleStartSession(name: string) {
    createSession(name);
    setShowSessionModal(false);
  }

  if (!permission) {
    return <View style={[styles.center, { backgroundColor: colors.navy }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.navy, paddingTop: topPad }]}>
        <Ionicons name="camera-outline" size={64} color={colors.green} />
        <Text style={[styles.permTitle, { color: "#fff" }]}>Camera Access Needed</Text>
        <Text style={[styles.permSub, { color: "#a0b4c8" }]}>
          To scan QR codes, allow camera access
        </Text>
        <TouchableOpacity
          style={[styles.permBtn, { backgroundColor: colors.green, borderRadius: colors.radius }]}
          onPress={requestPermission}
        >
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasData = people.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      {currentSession ? (
        Platform.OS === "web" ? (
          <View style={[styles.webCamera, { borderRadius: colors.radius }]}>
            <Ionicons name="qr-code" size={80} color={colors.green} />
            <Text style={[styles.webCameraText, { color: "#fff" }]}>
              Camera preview available on device
            </Text>
            <Text style={[styles.webCameraSubText, { color: "#a0b4c8" }]}>
              Scan the Expo Go QR code to test on your phone
            </Text>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleBarCodeScanned}
          />
        )
      ) : null}

      <View
        style={[
          styles.topBar,
          { paddingTop: topPad + 12, paddingHorizontal: 20 },
        ]}
      >
        <View>
          <Text style={styles.appTitle}>QR Attendance</Text>
          {currentSession ? (
            <Text style={styles.sessionName} numberOfLines={1}>
              {currentSession.name}
            </Text>
          ) : (
            <Text style={styles.sessionHint}>No active session</Text>
          )}
        </View>
        <View style={styles.topBarRight}>
          {currentSession && (
            <TouchableOpacity
              style={[styles.countBadge, { backgroundColor: colors.green + "33", borderRadius: 20 }]}
            >
              <Ionicons name="people" size={16} color={colors.green} />
              <Text style={[styles.countText, { color: colors.green }]}>
                {currentSession.records.length}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/generate")}
          >
            <Ionicons name="qr-code-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {currentSession ? (
        <>
          <View style={styles.scanFrame} pointerEvents="none">
            <View style={[styles.corner, styles.topLeft, { borderColor: colors.green }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: colors.green }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.green }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: colors.green }]} />
          </View>
          <Text style={styles.scanHint}>Point at a QR code to scan</Text>
        </>
      ) : (
        <View style={styles.noSessionContainer}>
          <View style={[styles.noSessionCard, { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: colors.radius * 1.5 }]}>
            <Ionicons name="scan-outline" size={72} color={colors.green} />
            <Text style={styles.noSessionTitle}>
              {!hasData ? "Upload Data First" : "Start a Session"}
            </Text>
            <Text style={styles.noSessionSub}>
              {!hasData
                ? "Go to Upload tab to import your student or employee list"
                : "Create a session to begin scanning attendance"}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.bottomBar, { paddingBottom: botPad + 16, paddingHorizontal: 20 }]}>
        {currentSession ? (
          <TouchableOpacity
            style={[styles.endBtn, { borderColor: colors.destructive, borderRadius: colors.radius }]}
            onPress={clearCurrentSession}
          >
            <Ionicons name="stop-circle-outline" size={20} color={colors.destructive} />
            <Text style={[styles.endBtnText, { color: colors.destructive }]}>End Session</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.startBtn,
              {
                backgroundColor: hasData ? colors.green : colors.muted,
                borderRadius: colors.radius,
              },
            ]}
            onPress={() => hasData && setShowSessionModal(true)}
            disabled={!hasData}
          >
            <Ionicons
              name="play-circle"
              size={22}
              color={hasData ? "#fff" : colors.mutedForeground}
            />
            <Text
              style={[
                styles.startBtnText,
                { color: hasData ? "#fff" : colors.mutedForeground },
              ]}
            >
              {hasData ? "Start Session" : "Upload Data to Begin"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <SessionModal
        visible={showSessionModal}
        onConfirm={handleStartSession}
        onCancel={() => setShowSessionModal(false)}
      />

      <ScanResultModal
        visible={showResultModal}
        result={scanResult}
        name={scannedName}
        id={scannedId}
        reason={scanReason}
        onClose={handleResultClose}
      />
    </View>
  );
}

const FRAME = 240;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 10,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  sessionName: {
    fontSize: 13,
    color: "#00c896",
    fontFamily: "Inter_500Medium",
    maxWidth: 200,
  },
  sessionHint: {
    fontSize: 13,
    color: "#a0b4c8",
    fontFamily: "Inter_400Regular",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  iconBtn: {
    padding: 4,
  },
  scanFrame: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: FRAME,
    height: FRAME,
    marginTop: -FRAME / 2,
    marginLeft: -FRAME / 2,
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint: {
    position: "absolute",
    bottom: "30%",
    alignSelf: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  noSessionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noSessionCard: {
    alignItems: "center",
    padding: 40,
    gap: 16,
    width: "100%",
  },
  noSessionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  noSessionSub: {
    fontSize: 15,
    color: "#a0b4c8",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  bottomBar: {
    zIndex: 10,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
  },
  endBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  permTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  permSub: {
    fontSize: 15,
    marginBottom: 32,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  permBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  permBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  webCamera: {
    position: "absolute",
    top: "20%",
    left: 40,
    right: 40,
    bottom: "30%",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  webCameraText: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  webCameraSubText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
