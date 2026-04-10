import * as Crypto from "expo-crypto";

const HMAC_SECRET = "QR_ATTENDANCE_SECRET_v1_2024";
const QR_VERSION = "1";

export interface QRPayload {
  n: string;
  id: string;
  ts: number;
  v: string;
  sig: string;
}

async function hmacSign(message: string): Promise<string> {
  const msgBytes = new TextEncoder().encode(message);
  const keyBytes = new TextEncoder().encode(HMAC_SECRET);
  const combined = new Uint8Array(keyBytes.length + msgBytes.length);
  combined.set(keyBytes);
  combined.set(msgBytes, keyBytes.length);
  const hashHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    HMAC_SECRET + message
  );
  return hashHex.slice(0, 16);
}

export async function generateQRData(name: string, id: string): Promise<string> {
  const ts = Date.now();
  const message = `${QR_VERSION}|${name}|${id}|${ts}`;
  const sig = await hmacSign(message);
  const payload: QRPayload = { n: name, id, ts, v: QR_VERSION, sig };
  return JSON.stringify(payload);
}

export async function verifyQRData(rawData: string): Promise<{
  valid: boolean;
  name?: string;
  id?: string;
  reason?: string;
}> {
  try {
    const payload: QRPayload = JSON.parse(rawData);
    if (!payload.n || !payload.id || !payload.ts || !payload.v || !payload.sig) {
      return { valid: false, reason: "Invalid QR format" };
    }
    if (payload.v !== QR_VERSION) {
      return { valid: false, reason: "Unsupported QR version" };
    }
    const message = `${payload.v}|${payload.n}|${payload.id}|${payload.ts}`;
    const expectedSig = await hmacSign(message);
    if (expectedSig !== payload.sig) {
      return { valid: false, reason: "Invalid QR signature — possible fake" };
    }
    return { valid: true, name: payload.n, id: payload.id };
  } catch {
    return { valid: false, reason: "Unrecognized QR format" };
  }
}
