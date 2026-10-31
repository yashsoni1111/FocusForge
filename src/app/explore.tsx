
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

const PROGRESS_KEY = "@focusforge/progress";
const COMMUNITY_KEY = "@focusforge/community";
const WEEKLY_TARGET = 600;

type FocusSession = {
  id: string;
  completedAt: string;
  durationMinutes: number;
  xpEarned: number;
};

type CommunityData = {
  joinedChallenge: boolean;
  cheers: Record<string, number>;
};

type Friend = {
  id: string;
  name: string;
  initial: string;
  focusMinutes: number;
  streak: number;
  isYou?: boolean;
};

// DEMO FRIENDS - BACKEND WILL REPLACE THESE LATER
const FRIENDS: Friend[] = [
  {
    id: "aarav",
    name: "Aarav Sharma",
    initial: "A",
    focusMinutes: 420,
    streak: 7,
  },
  {
    id: "riya",
    name: "Riya Verma",
    initial: "R",
    focusMinutes: 360,
    streak: 5,
  },
  {
    id: "kabir",
    name: "Kabir Singh",
    initial: "K",
    focusMinutes: 290,
    streak: 4,
  },
];

export default function ExploreScreen() {
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [weeklySessions, setWeeklySessions] = useState(0);

  const [joinedChallenge, setJoinedChallenge] = useState(false);

  const [cheers, setCheers] = useState<Record<string, number>>({});

  const [loaded, setLoaded] = useState(false);

  // LOAD SAVED COMMUNITY AND FOCUS DATA
  useEffect(() => {
    let active = true;

    const loadCommunity = async () => {
      try {
        const [savedProgress, savedCommunity] = await Promise.all([
          AsyncStorage.getItem(PROGRESS_KEY),
          AsyncStorage.getItem(COMMUNITY_KEY),
        ]);

        let sessions: FocusSession[] = [];

        if (savedProgress) {
          const progress = JSON.parse(savedProgress);

          if (Array.isArray(progress.sessions)) {
            sessions = progress.sessions;
          }
        }

        const now = new Date();

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - 6);

        const recentSessions = sessions.filter((session) => {
          const date = new Date(session.completedAt);

          return (
            !Number.isNaN(date.getTime()) &&
            date >= startDate &&
            date <= now
          );
        });

        const minutes = recentSessions.reduce(
          (sum, session) =>
            sum + Math.max(
              0,
              Number(session.durationMinutes) || 0
            ),
          0
        );

        if (active) {
          setWeeklyMinutes(minutes);
          setWeeklySessions(recentSessions.length);
        }

        if (savedCommunity) {
          const community = JSON.parse(savedCommunity);

          if (active) {
            setJoinedChallenge(
              community.joinedChallenge === true
            );

            if (
              community.cheers &&
              typeof community.cheers === "object"
            ) {
              setCheers(community.cheers);
            }
          }
        }
      } catch (error) {
        console.warn("Community loading error:", error);
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    };

    loadCommunity();

    return () => {
      active = false;
    };
  }, []);

  // SAVE COMMUNITY SETTINGS
  useEffect(() => {
    if (!loaded) return;

    const data: CommunityData = {
      joinedChallenge,
      cheers,
    };

    AsyncStorage.setItem(
      COMMUNITY_KEY,
      JSON.stringify(data)
    ).catch((error) => {
      console.warn("Community saving error:", error);
    });
  }, [joinedChallenge, cheers, loaded]);

  // JOIN OR LEAVE CHALLENGE
  const toggleChallenge = () => {
    setJoinedChallenge((previous) => !previous);
  };

  // CHEER FRIENDS
  const cheerFriend = (friendId: string) => {
    setCheers((previous) => ({
      ...previous,
      [friendId]: (previous[friendId] || 0) + 1,
    }));
  };

  // ADD THE CURRENT USER TO THE LEADERBOARD
  const leaderboard: Friend[] = [
    ...FRIENDS,
    {
      id: "you",
      name: "You",
      initial: "Y",
      focusMinutes: weeklyMinutes,
      streak: 0,
      isYou: true,
    },
  ].sort((a, b) => b.focusMinutes - a.focusMinutes);

  const progress = Math.min(
    (weeklyMinutes / WEEKLY_TARGET) * 100,
    100
  );

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

        {/* HEADER */}

        <Text style={styles.logo}>
          ✦ FOCUSFORGE
        </Text>

        <Text style={styles.heading}>
          Focus Circle 👥
        </Text>

        <Text style={styles.subtitle}>
          Stay focused. Grow together.
        </Text>

        <View style={styles.demoBadge}>
          <Text style={styles.demoText}>
            COMMUNITY PREVIEW
          </Text>
        </View>

        {/* PERSONAL PROGRESS */}

        <Text style={styles.sectionTitle}>
          YOUR WEEKLY PROGRESS
        </Text>

        <View style={styles.personalCard}>
          <Text style={styles.cardTitle}>
            Your contribution
          </Text>

          <View style={styles.personalStats}>
            <View>
              <Text style={styles.bigNumber}>
                {loaded ? weeklyMinutes : "..."}
              </Text>

              <Text style={styles.smallLabel}>
                Focus minutes
              </Text>
            </View>

            <View>
              <Text style={styles.bigNumber}>
                {loaded ? weeklySessions : "..."}
              </Text>

              <Text style={styles.smallLabel}>
                Sessions
              </Text>
            </View>
          </View>
        </View>

        {/* WEEKLY CHALLENGE */}

        <Text style={styles.sectionTitle}>
          WEEKLY CHALLENGE
        </Text>

        <View style={styles.challengeCard}>
          <Text style={styles.challengeEmoji}>
            🏆
          </Text>

          <Text style={styles.challengeHeading}>
            The 10-Hour Challenge
          </Text>

          <Text style={styles.challengeSubtitle}>
            Complete 10 focused study hours this week.
            Build consistency, one session at a time.
          </Text>

          <View style={styles.challengeProgressHeader}>
            <Text style={styles.progressLabel}>
              Your progress
            </Text>

            <Text style={styles.progressValue}>
              {loaded ? weeklyMinutes : "..."}/600 min
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
            style={[
              styles.joinButton,
              joinedChallenge && styles.joinedButton,
            ]}
            onPress={toggleChallenge}
          >
            <Text style={styles.joinButtonText}>
              {joinedChallenge
                ? "✓  Challenge Joined"
                : "Join Weekly Challenge"}
            </Text>
          </Pressable>
        </View>

        {/* FRIENDS LEADERBOARD */}

        <Text style={styles.sectionTitle}>
          FRIENDS LEADERBOARD
        </Text>

        <View style={styles.leaderboardCard}>
          <Text style={styles.leaderboardSubtitle}>
            SAMPLE MEMBERS · DEMO DATA
          </Text>

          {leaderboard.map((friend, index) => (
            <View
              key={friend.id}
              style={[
                styles.friendRow,
                friend.isYou && styles.youRow,
              ]}
            >
              <Text style={styles.rank}>
                {index === 0
                  ? "🥇"
                  : index === 1
                    ? "🥈"
                    : index === 2
                      ? "🥉"
                      : index + 1}
              </Text>

              <View style={styles.friendAvatar}>
                <Text style={styles.avatarText}>
                  {friend.initial}
                </Text>
              </View>

              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>
                  {friend.name} {friend.isYou ? "(You)" : ""}
                </Text>

                <Text style={styles.friendStats}>
                  🔥 {friend.streak} day streak
                  {"  "}•{"  "}
                  {friend.focusMinutes} min
                </Text>
              </View>

              {!friend.isYou && (
                <Pressable
                  style={styles.cheerButton}
                  onPress={() => cheerFriend(friend.id)}
                >
                  <Text style={styles.cheerText}>
                    👏 {cheers[friend.id] || 0}
                  </Text>
                </Pressable>
              )}

              {friend.isYou && (
                <Text style={styles.youLabel}>
                  YOU
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* PRIVACY */}

        <View style={styles.privacyCard}>
          <Text style={styles.privacyHeading}>
            🔒 Your privacy matters
          </Text>

          <Text style={styles.privacyText}>
            This prototype keeps your community settings
            on this device. The future online version
            will share focus statistics without exposing
            private browsing history.
          </Text>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Better habits. Stronger together. 💜
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
    paddingBottom: 40,
  },

  logo: {
    color: "#A78BFA",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 19,
  },

  subtitle: {
    color: "#929BB2",
    fontSize: 13,
    marginTop: 7,
  },

  demoBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#31245B",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 17,
  },

  demoText: {
    color: "#C4B5FD",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  sectionTitle: {
    color: "#AAB3C8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 30,
    marginBottom: 14,
  },

  personalCard: {
    backgroundColor: "#151E34",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26324A",
    padding: 19,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  personalStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 23,
  },

  bigNumber: {
    color: "#C4B5FD",
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
  },

  smallLabel: {
    color: "#929BB2",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },

  challengeCard: {
    backgroundColor: "#191B3A",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#414078",
    padding: 21,
  },

  challengeEmoji: {
    fontSize: 35,
    marginBottom: 12,
  },

  challengeHeading: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },

  challengeSubtitle: {
    color: "#A8AAC7",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },

  challengeProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },

  progressLabel: {
    color: "#C5BEDD",
    fontSize: 11,
  },

  progressValue: {
    color: "#C4B5FD",
    fontSize: 11,
    fontWeight: "800",
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

  joinButton: {
    backgroundColor: "#8764E8",
    borderRadius: 14,
    padding: 16,
    marginTop: 22,
    alignItems: "center",
  },

  joinedButton: {
    backgroundColor: "#294B55",
  },

  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  leaderboardCard: {
    backgroundColor: "#151E34",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26324A",
    padding: 16,
  },

  leaderboardSubtitle: {
    color: "#929BB2",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 13,
  },

  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#26324A",
    gap: 10,
  },

  youRow: {
    backgroundColor: "#202249",
    borderRadius: 12,
    paddingHorizontal: 7,
  },

  rank: {
    color: "#C4B5FD",
    fontSize: 17,
    fontWeight: "900",
    width: 23,
  },

  friendAvatar: {
    height: 42,
    width: 42,
    borderRadius: 14,
    backgroundColor: "#31245B",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  friendInfo: {
    flex: 1,
  },

  friendName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  friendStats: {
    color: "#929BB2",
    fontSize: 10,
    marginTop: 5,
  },

  cheerButton: {
    backgroundColor: "#30264D",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  cheerText: {
    color: "#C4B5FD",
    fontSize: 12,
    fontWeight: "800",
  },

  youLabel: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "900",
  },

  privacyCard: {
    backgroundColor: "#151E34",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#26324A",
    padding: 17,
    marginTop: 27,
  },

  privacyHeading: {
    color: "#C4B5FD",
    fontSize: 14,
    fontWeight: "800",
  },

  privacyText: {
    color: "#929BB2",
    fontSize: 11,
    lineHeight: 19,
    marginTop: 9,
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
