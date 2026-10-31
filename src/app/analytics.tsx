
import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";

type FocusSession = {
  id: string;
  completedAt: string;
  durationMinutes: number;
  xpEarned: number;
};

type SavedProgress = {
  sessions?: FocusSession[];
  totalXp?: number;
  completedSessions?: number;
};

const STORAGE_KEY = "@focusforge/progress";
const WEEKLY_TARGET = 600;

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function AnalyticsScreen() {
  
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [totalXp, setTotalXp] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  // LOAD SAVED DATA
  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved) {
          const parsed = JSON.parse(saved) as SavedProgress;

          if (active) {
            setSessions(
              Array.isArray(parsed.sessions) ? parsed.sessions : []
            );
            setTotalXp(Number(parsed.totalXp) || 0);
            setTotalCompleted(Number(parsed.completedSessions) || 0);
          }
        }
      } catch (error) {
        console.warn("Analytics loading error:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      active = false;
    };
  }, []);

  // CREATE LAST 7 DAYS DATA
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    const key = getDateKey(date);

    const daySessions = sessions.filter((session) => {
      const sessionDate = new Date(session.completedAt);

      return (
        !Number.isNaN(sessionDate.getTime()) &&
        getDateKey(sessionDate) === key
      );
    });

    const minutes = daySessions.reduce(
      (sum, session) =>
        sum + Math.max(0, Number(session.durationMinutes) || 0),
      0
    );

    return {
      key,
      label: date.toLocaleDateString("en", { weekday: "short" }),
      minutes,
      count: daySessions.length,
    };
  });

  const weeklyMinutes = weekDays.reduce(
    (sum, day) => sum + day.minutes,
    0
  );

  const weeklySessions = weekDays.reduce(
    (sum, day) => sum + day.count,
    0
  );

  const maxMinutes = Math.max(
    1,
    ...weekDays.map((day) => day.minutes)
  );

  const bestDay = weekDays.reduce(
    (best, day) => (day.minutes > best.minutes ? day : best),
    weekDays[0]
  );

  const weeklyProgress = Math.min(
    (weeklyMinutes / WEEKLY_TARGET) * 100,
    100
  );

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return hours > 0
      ? `${hours}h ${remaining}m`
      : `${remaining}m`;
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B1020"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* BACK BUTTON */}

        <Link href="/" asChild>
            <Pressable style={styles.backButton}>
                <Text style={styles.backText}>
            ‹  Back to Dashboard
                </Text>
            </Pressable>
        </Link>

        {/* HEADER */}

        <Text style={styles.logo}>✦ FOCUSFORGE</Text>

        <Text style={styles.heading}>
          Your Analytics 📊
        </Text>

        <Text style={styles.subtitle}>
          Understand your progress. Improve your focus.
        </Text>

        {/* STATISTICS */}

        <Text style={styles.sectionTitle}>
          YOUR OVERVIEW
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.cardIcon}>⏱</Text>
            <Text style={styles.statValue}>
              {loading ? "..." : formatTime(weeklyMinutes)}
            </Text>
            <Text style={styles.statLabel}>
              Focus this week
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.cardIcon}>🎯</Text>
            <Text style={styles.statValue}>
              {loading ? "..." : weeklySessions}
            </Text>
            <Text style={styles.statLabel}>
              Weekly sessions
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.cardIcon}>🏆</Text>
            <Text style={styles.statValue}>{totalXp}</Text>
            <Text style={styles.statLabel}>
              Total XP
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.cardIcon}>📚</Text>
            <Text style={styles.statValue}>
              {totalCompleted}
            </Text>
            <Text style={styles.statLabel}>
              All-time sessions
            </Text>
          </View>
        </View>

        {/* WEEKLY CHART */}

        <Text style={styles.sectionTitle}>
          WEEKLY FOCUS ACTIVITY
        </Text>

        <View style={styles.chartCard}>
          <Text style={styles.chartHeading}>
            Last 7 days
          </Text>

          <Text style={styles.chartSubtitle}>
            Focus minutes per day
          </Text>

          {loading ? (
            <Text style={styles.emptyText}>
              Loading analytics...
            </Text>
          ) : (
            <View style={styles.chartRow}>
              {weekDays.map((day) => {
                const barHeight =
                  day.minutes === 0
                    ? "2%"
                    : `${Math.max(
                        (day.minutes / maxMinutes) * 100,
                        6
                      )}%`;

                return (
                  <View
                    key={day.key}
                    style={styles.chartColumn}
                  >
                    <Text style={styles.barValue}>
                      {day.minutes > 0 ? day.minutes : ""}
                    </Text>

                    <View style={styles.chartTrack}>
                      <View
                        style={[
                          styles.chartBar,
                          { height: barHeight },
                        ]}
                      />
                    </View>

                    <Text style={styles.dayLabel}>
                      {day.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* WEEKLY GOAL */}

        <Text style={styles.sectionTitle}>
          WEEKLY GOAL
        </Text>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>
              🚀 Study consistently
            </Text>

            <Text style={styles.goalPercentage}>
              {loading ? "..." : `${Math.round(weeklyProgress)}%`}
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: `${weeklyProgress}%` },
              ]}
            />
          </View>

          <Text style={styles.goalDetail}>
            {formatTime(weeklyMinutes)} / 10 hours completed
          </Text>
        </View>

        {/* BEST DAY */}

        <Text style={styles.sectionTitle}>
          YOUR BEST DAY
        </Text>

        <View style={styles.bestDayCard}>
          <Text style={styles.cardIcon}>⭐</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.bestDayTitle}>
              {bestDay.minutes > 0
                ? bestDay.label
                : "Not available yet"}
            </Text>

            <Text style={styles.bestDaySubtitle}>
              {bestDay.minutes > 0
                ? `${formatTime(bestDay.minutes)} of focused study`
                : "Complete a session to discover your best day."}
            </Text>
          </View>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Every focused minute counts. ✨
          </Text>
          <Text style={styles.footerBrand}>
            FOCUSFORGE © 2026
          </Text>
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

  backButton: {
    marginBottom: 24,
  },

  backText: {
    color: "#A78BFA",
    fontSize: 14,
    fontWeight: "700",
  },

  logo: {
    color: "#A78BFA",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 15,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    color: "#929BB2",
    fontSize: 13,
    marginTop: 8,
  },

  sectionTitle: {
    color: "#AAB3C8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 28,
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#151E34",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#26324A",
  },

  cardIcon: {
    fontSize: 24,
    marginBottom: 12,
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  statLabel: {
    color: "#929BB2",
    fontSize: 11,
    marginTop: 6,
  },

  chartCard: {
    backgroundColor: "#151E34",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#26324A",
    padding: 18,
  },

  chartHeading: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  chartSubtitle: {
    color: "#929BB2",
    fontSize: 11,
    marginTop: 5,
  },

  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 25,
  },

  chartColumn: {
    flex: 1,
    alignItems: "center",
  },

  barValue: {
    color: "#C4B5FD",
    fontSize: 9,
    marginBottom: 7,
  },

  chartTrack: {
    height: 125,
    width: 19,
    backgroundColor: "#252D48",
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  chartBar: {
    width: "100%",
    backgroundColor: "#A78BFA",
    borderRadius: 8,
  },

  dayLabel: {
    color: "#929BB2",
    fontSize: 10,
    marginTop: 10,
  },

  emptyText: {
    color: "#929BB2",
    marginTop: 20,
  },

  goalCard: {
    backgroundColor: "#151E34",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26324A",
    padding: 19,
  },

  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 17,
  },

  goalTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  goalPercentage: {
    color: "#A78BFA",
    fontWeight: "800",
    fontSize: 15,
  },

  progressBackground: {
    width: "100%",
    height: 8,
    backgroundColor: "#303453",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#A78BFA",
    borderRadius: 10,
  },

  goalDetail: {
    color: "#929BB2",
    fontSize: 11,
    marginTop: 12,
  },

  bestDayCard: {
    backgroundColor: "#191B3A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#414078",
    padding: 19,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  bestDayTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  bestDaySubtitle: {
    color: "#929BB2",
    fontSize: 11,
    marginTop: 6,
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
