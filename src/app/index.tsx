import { Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
} from "react-native";

const TOTAL_SECONDS = 25 * 60;
//const TOTAL_SECONDS = 10;

const STORAGE_KEY = "@focusforge/progress";
type FocusSession = {
  id: string;
  completedAt: string;
  durationMinutes: number;
  xpEarned: number;
};
type FocusStats = {
  day: string;
  todayFocusMinutes: number;
  completedSessions: number;
  totalXp: number;
  streak: number;
  lastCompletedDate: string | null;
  sessions: FocusSession[];
};

const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getYesterdayKey = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateKey(yesterday);
};

const safeNumber = (value: unknown): number => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const createEmptyStats = (): FocusStats => ({
  day: getDateKey(),
  todayFocusMinutes: 0,
  completedSessions: 0,
  totalXp: 0,
  streak: 0,
  lastCompletedDate: null,
  sessions: [],
});

export default function HomeScreen() {
  
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  const [stats, setStats] = useState<FocusStats>(createEmptyStats);
  const [statsLoaded, setStatsLoaded] = useState(false);
  // LOAD SAVED PROGRESS
useEffect(() => {
  let active = true;

  const loadStats = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FocusStats>;

        const today = getDateKey();
        const yesterday = getYesterdayKey();

        const lastCompletedDate =
          typeof parsed.lastCompletedDate === "string"
            ? parsed.lastCompletedDate
            : null;

        const restored: FocusStats = {
          day: today,

          todayFocusMinutes:
            parsed.day === today
              ? safeNumber(parsed.todayFocusMinutes)
              : 0,

          completedSessions: safeNumber(parsed.completedSessions),

          totalXp: safeNumber(parsed.totalXp),

          streak:
            lastCompletedDate === today ||
            lastCompletedDate === yesterday
              ? safeNumber(parsed.streak)
              : 0,

           lastCompletedDate,

            sessions: Array.isArray(parsed.sessions)
              ? parsed.sessions as FocusSession[]
              : [],
            };

        if (active) {
          setStats(restored);
        }
      }
    } catch (error) {
      console.warn("Error loading progress:", error);
    } finally {
      if (active) {
        setStatsLoaded(true);
      }
    }
  };

  loadStats();

  return () => {
    active = false;
  };
}, []);


// SAVE PROGRESS AUTOMATICALLY
useEffect(() => {
  if (!statsLoaded) return;

  AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(stats)
  ).catch((error) => {
    console.warn("Error saving progress:", error);
  });

}, [stats, statsLoaded]);
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  useEffect(() => {
  if (secondsLeft === 0 && isRunning) {
    setIsRunning(false);

    const today = getDateKey();
    const yesterday = getYesterdayKey();
    const completedSession: FocusSession = {
      id: `${Date.now()}`,
      completedAt: new Date().toISOString(),
      durationMinutes: 25,
      xpEarned: 50,
    };

    setStats((previous) => {
      const completedToday =
        previous.lastCompletedDate === today;

      const completedYesterday =
        previous.lastCompletedDate === yesterday;

      const nextStreak = completedToday
        ? previous.streak
        : completedYesterday
          ? previous.streak + 1
          : 1;

      return {
        ...previous,
        sessions: [
          completedSession,
           ...(previous.sessions ?? []),
        ].slice(0, 100),

        day: today,

        todayFocusMinutes:
          (previous.day === today
            ? previous.todayFocusMinutes
            : 0) + 25,

        completedSessions:
          previous.completedSessions + 1,

        totalXp: previous.totalXp + 50,

        streak: nextStreak,

        lastCompletedDate: today,
      };
    });
  }
}, [secondsLeft, isRunning]);

  const startPause = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(TOTAL_SECONDS);
    }
    setIsRunning((previous) => !previous);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(TOTAL_SECONDS);
  };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const progress = (1 - secondsLeft / TOTAL_SECONDS) * 100;

  const focusTime =
  stats.todayFocusMinutes >= 60
    ? `${Math.floor(stats.todayFocusMinutes / 60)}h ${stats.todayFocusMinutes % 60}m`
    : `${stats.todayFocusMinutes}m`;
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1020" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>✦ FOCUSFORGE</Text>
            <Text style={styles.greeting}>Hey, Champion 👋</Text>
            <Text style={styles.subtitle}>
              Ready to make today count?
            </Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>D</Text>
          </View>
        </View>

        {/* Daily stats */}
        <Text style={styles.sectionTitle}>YOUR PROGRESS</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statValue}>{focusTime}</Text>
            <Text style={styles.statLabel}>Focus time</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            
            <Text style={styles.statValue}>
  {stats.streak} {stats.streak === 1 ? "day" : "days"}
</Text>
          </View>
        </View>

        {/* Focus timer */}
        <View style={styles.focusCard}>
          <Text style={styles.focusLabel}>YOUR FOCUS ZONE</Text>

          <Text style={styles.focusHeading}>
            {secondsLeft === 0
              ? "Session completed! 🎉"
              : isRunning
              ? "Stay in the zone."
              : "Time to focus."}
          </Text>

          <Text style={styles.focusSubtitle}>
            {isRunning
              ? "One task. One goal. No distractions."
              : "25 minutes of distraction-free work."}
          </Text>

          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>
              {minutes}:{seconds}
            </Text>
            <Text style={styles.timerCaption}>
              {secondsLeft === 0 ? "COMPLETED" : "MINUTES LEFT"}
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%` },
              ]}
            />
          </View>

          <Pressable
            style={styles.startButton}
            onPress={startPause}
          >
            <Text style={styles.startButtonText}>
              {secondsLeft === 0
                ? "↻  Start New Session"
                : isRunning
                ? "Ⅱ  Pause Session"
                : "▶  Start Focus Session"}
            </Text>
          </Pressable>

          <Pressable onPress={resetTimer} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset timer</Text>
          </Pressable>
        </View>

        {/* Rewards */}
        <Text style={styles.sectionTitle}>YOUR ACHIEVEMENTS</Text>

        <View style={styles.statsRow}>
          <View style={styles.rewardCard}>
            <Text style={styles.rewardIcon}>⚡</Text>
            <Text style={styles.rewardValue}>
              {stats.totalXp} XP
            </Text>
            <Text style={styles.statLabel}>Total earned</Text>
          </View>

          <View style={styles.rewardCard}>
            <Text style={styles.rewardValue}>
              Level {Math.floor(stats.totalXp / 250) + 1}
            </Text>
            
            <Text style={styles.statLabel}>Your level</Text>
          </View>
        </View>

        {/* Weekly goal */}
        <Text style={styles.sectionTitle}>DAILY GOAL</Text>

        <View style={styles.weeklyCard}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.weeklyTitle}>🎯 Study consistently</Text>
            <Text style={styles.weeklyCount}>
              {stats.todayFocusMinutes}/120 min
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                   width: `${Math.min(
                      (stats.todayFocusMinutes / 120) * 100,
                      100
                    )}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.weeklySubtitle}>
            Your daily target is 2 focused hours.
          </Text>
        </View>
      <Link href="/analytics" asChild>
  <Pressable style={styles.analyticsButton}>
    <Text style={styles.analyticsButtonText}>
      📊 View Weekly Analytics →
    </Text>
  </Pressable>
</Link>
<Text style={styles.sectionTitle}>
  FOCUS HISTORY
</Text>

<View style={styles.historyCard}>

  {stats.sessions.length === 0 ? (

    <Text style={styles.historyEmpty}>
      No completed sessions yet.
      Complete a focus session to see it here.
    </Text>

  ) : (

    stats.sessions.slice(0, 5).map((session) => (

      <View key={session.id} style={styles.historyRow}>

        <View style={{ flex: 1 }}>

          <Text style={styles.historyDate}>
            {new Date(session.completedAt).toLocaleDateString()}
          </Text>

          <Text style={styles.historyDetail}>
            {session.durationMinutes} min focus session
          </Text>

        </View>

        <Text style={styles.historyXp}>
          +{session.xpEarned} XP
        </Text>

      </View>

    ))

  )}

</View>
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Small steps. Big achievements. ✨
          </Text>
          <Text style={styles.footerBrand}>FOCUSFORGE © 2026</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1020",
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 55,
    paddingBottom: 35,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    color: "#A78BFA",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 16,
  },
  greeting: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },
  subtitle: {
    color: "#929BB2",
    fontSize: 13,
    marginTop: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#31245B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#8061D8",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  sectionTitle: {
    color: "#AAB3C8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 14,
    marginTop: 26,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#151E34",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#26324A",
  },
  statIcon: {
    fontSize: 23,
    marginBottom: 13,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },
  statLabel: {
    color: "#8E9BB4",
    fontSize: 12,
    marginTop: 6,
  },
  focusCard: {
    backgroundColor: "#191B3A",
    padding: 22,
    borderRadius: 24,
    marginTop: 28,
    borderWidth: 1,
    borderColor: "#414078",
    alignItems: "center",
  },
  focusLabel: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },
  focusHeading: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
    marginTop: 14,
  },
  focusSubtitle: {
    color: "#A8AAC7",
    fontSize: 12,
    marginTop: 7,
    textAlign: "center",
  },
  timerCircle: {
    width: 205,
    height: 205,
    borderRadius: 110,
    borderWidth: 7,
    borderColor: "#7961D9",
    backgroundColor: "#202249",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 28,
  },
  timerText: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  timerCaption: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 6,
  },
  progressBackground: {
    width: "100%",
    height: 7,
    backgroundColor: "#303453",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#A78BFA",
    borderRadius: 10,
  },
  startButton: {
    width: "100%",
    padding: 17,
    backgroundColor: "#8764E8",
    borderRadius: 15,
    alignItems: "center",
    marginTop: 24,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  resetButton: {
    padding: 12,
    marginTop: 3,
  },
  resetText: {
    color: "#A8AAC7",
    fontSize: 12,
  },
  rewardCard: {
    flex: 1,
    backgroundColor: "#151E34",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26324A",
  },
  rewardIcon: {
    fontSize: 25,
    marginBottom: 12,
  },
  rewardValue: {
    color: "#C4B5FD",
    fontSize: 21,
    fontWeight: "800",
  },
  weeklyCard: {
    backgroundColor: "#151E34",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26324A",
    padding: 19,
  },
  weeklyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 17,
    gap: 8,
  },
  weeklyTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  weeklyCount: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "800",
  },
  weeklySubtitle: {
    color: "#929BB2",
    fontSize: 11,
    marginTop: 13,
  },
analyticsButton: {
  backgroundColor: "#31245B",
  borderWidth: 1,
  borderColor: "#8061D8",
  padding: 17,
  borderRadius: 15,
  alignItems: "center",
  marginTop: 24,
},

analyticsButtonText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "800",
},
  
historyCard: {
  backgroundColor: "#151E34",
  borderRadius: 18,
  borderWidth: 1,
  borderColor: "#26324A",
  padding: 17,
  gap: 12,
},

historyRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#26324A",
},

historyDate: {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "700",
},

historyDetail: {
  color: "#929BB2",
  fontSize: 11,
  marginTop: 5,
},

historyXp: {
  color: "#A78BFA",
  fontSize: 13,
  fontWeight: "800",
},

historyEmpty: {
  color: "#929BB2",
  fontSize: 12,
  lineHeight: 20,
},

  footer: {
    alignItems: "center",
    marginTop: 35,
  },
  footerText: {
    color: "#C5BEDD",
    fontSize: 13,
    fontWeight: "600",
  },
  footerBrand: {
    color: "#69738B",
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 14,
  },
});
