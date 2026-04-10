import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Person } from "@/utils/csvParser";

export interface AttendanceRecord {
  name: string;
  id: string;
  timestamp: number;
  sessionId: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  records: AttendanceRecord[];
}

interface AttendanceContextValue {
  people: Person[];
  sessions: Session[];
  currentSession: Session | null;
  setPeople: (people: Person[]) => void;
  createSession: (name: string) => void;
  markAttendance: (name: string, id: string) => "success" | "already_marked" | "not_found";
  clearCurrentSession: () => void;
  deleteSession: (sessionId: string) => void;
  isLoaded: boolean;
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

const STORAGE_KEYS = {
  PEOPLE: "@attendance:people",
  SESSIONS: "@attendance:sessions",
  CURRENT_SESSION: "@attendance:currentSession",
};

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeopleState] = useState<Person[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [peopleRaw, sessionsRaw, currentRaw] = await AsyncStorage.multiGet([
          STORAGE_KEYS.PEOPLE,
          STORAGE_KEYS.SESSIONS,
          STORAGE_KEYS.CURRENT_SESSION,
        ]);
        if (peopleRaw[1]) setPeopleState(JSON.parse(peopleRaw[1]));
        if (sessionsRaw[1]) setSessions(JSON.parse(sessionsRaw[1]));
        if (currentRaw[1]) setCurrentSession(JSON.parse(currentRaw[1]));
      } catch {}
      setIsLoaded(true);
    }
    load();
  }, []);

  const setPeople = useCallback(async (newPeople: Person[]) => {
    setPeopleState(newPeople);
    await AsyncStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(newPeople));
  }, []);

  const createSession = useCallback(async (name: string) => {
    const session: Session = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      createdAt: Date.now(),
      records: [],
    };
    setCurrentSession(session);
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  }, []);

  const markAttendance = useCallback(
    (name: string, id: string): "success" | "already_marked" | "not_found" => {
      if (!currentSession) return "not_found";

      const normalizedName = name.toLowerCase();
      const personExists = people.some(
        (p) => p.name.toLowerCase() === normalizedName || p.id === id
      );

      if (!personExists) return "not_found";

      const alreadyMarked = currentSession.records.some(
        (r) => r.name.toLowerCase() === normalizedName || r.id === id
      );
      if (alreadyMarked) return "already_marked";

      const record: AttendanceRecord = {
        name,
        id,
        timestamp: Date.now(),
        sessionId: currentSession.id,
      };

      const updatedSession = {
        ...currentSession,
        records: [...currentSession.records, record],
      };
      setCurrentSession(updatedSession);
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(updatedSession));

      const updatedSessions = sessions.filter((s) => s.id !== currentSession.id);
      const newSessions = [updatedSession, ...updatedSessions];
      setSessions(newSessions);
      AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(newSessions));

      return "success";
    },
    [currentSession, people, sessions]
  );

  const clearCurrentSession = useCallback(async () => {
    if (currentSession) {
      const updatedSessions = sessions.filter((s) => s.id !== currentSession.id);
      const finalSessions = [currentSession, ...updatedSessions];
      setSessions(finalSessions);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(finalSessions));
    }
    setCurrentSession(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }, [currentSession, sessions]);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const newSessions = sessions.filter((s) => s.id !== sessionId);
      setSessions(newSessions);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(newSessions));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      }
    },
    [sessions, currentSession]
  );

  return (
    <AttendanceContext.Provider
      value={{
        people,
        sessions,
        currentSession,
        setPeople,
        createSession,
        markAttendance,
        clearCurrentSession,
        deleteSession,
        isLoaded,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
  return ctx;
}
