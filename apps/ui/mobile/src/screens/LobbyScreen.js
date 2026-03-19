import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, Platform, Alert, ScrollView, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';
import { connectSocket, disconnectSocket } from '../socket';

const PLAYER_COLORS = ['#2196F3', '#FF9800', '#4CAF50', '#E91E63', '#9C27B0', '#00BCD4'];

export default function LobbyScreen({ navigation, route }) {
  const { email } = route.params;
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [roomCode, setRoomCode] = useState('');
  const [lobby, setLobby] = useState(null);
  const [socket, setSocket] = useState(null);
  const [years, setYears] = useState('10');
  const [budget, setBudget] = useState('10000');
  const roomCodeRef = useRef('');
  const displayNameRef = useRef('');

  useEffect(() => {
    AsyncStorage.getItem('userDisplayName').then(n => { if (n) { setDisplayName(n); displayNameRef.current = n; } });
    // Do NOT disconnect socket on unmount — socket must persist through navigation to MultiSetup
  }, []);

  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);
  useEffect(() => { displayNameRef.current = displayName; }, [displayName]);

  const setupSocket = (s) => {
    s.on('lobby_created', ({ roomCode: code }) => {
      setRoomCode(code);
      roomCodeRef.current = code;
    });
    s.on('lobby_joined', ({ roomCode: code }) => {
      setRoomCode(code);
      roomCodeRef.current = code;
    });
    s.on('lobby_update', (data) => {
      setLobby(data);
    });
    s.on('error_msg', ({ message }) => {
      Alert.alert('Error', message);
    });
    s.on('game_started', ({ years, totalBudget }) => {
      // Clean up LobbyScreen listeners before navigating
      s.off('lobby_created');
      s.off('lobby_joined');
      s.off('lobby_update');
      s.off('error_msg');
      s.off('game_started');
      s.off('player_left');
      navigation.replace('MultiSetup', { email, displayName: displayNameRef.current, roomCode: roomCodeRef.current, years, totalBudget });
    });
    s.on('player_left', ({ message }) => {
      // Auto-handled by lobby_update
    });
    setSocket(s);
  };

  const createLobby = () => {
    if (!displayName.trim()) { Alert.alert('Oops!', 'Please set a display name first.'); return; }
    const s = connectSocket();
    setupSocket(s);
    s.emit('create_lobby', { displayName: displayName.trim(), email });
    setMode('create');
  };

  const joinLobby = () => {
    if (!displayName.trim()) { Alert.alert('Oops!', 'Please set a display name first.'); return; }
    if (!roomCode.trim() || roomCode.length !== 4) { Alert.alert('Oops!', 'Enter a 4-digit room code.'); return; }
    const s = connectSocket();
    setupSocket(s);
    s.emit('join_lobby', { roomCode: roomCode.trim(), displayName: displayName.trim(), email });
    setMode('join');
  };

  const startGame = () => {
    const y = parseInt(years) || 10;
    const b = parseInt(budget) || 10000;
    if (y < 3 || y > 30) { Alert.alert('Invalid', 'Years must be between 3 and 30'); return; }
    if (b < 1000) { Alert.alert('Invalid', 'Budget must be at least 1,000'); return; }
    socket?.emit('host_start_game', { years: y, totalBudget: b });
  };

  const isHost = lobby?.players?.find(p => p.isHost)?.id === socket?.id;

  // Initial mode selection
  if (!mode || !lobby) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { disconnectSocket(); navigation.goBack(); }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚔️ Battle Mode</Text>
          <Text style={styles.headerSub}>Challenge your friends in real-time</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
          <View style={styles.nameCard}>
            <Text style={styles.nameLabel}>Your Player Name</Text>
            <TextInput style={styles.nameInput} value={displayName}
              onChangeText={setDisplayName} placeholder="Enter your name" placeholderTextColor={colors.textLight}
              maxLength={15} />
          </View>

          <TouchableOpacity style={styles.actionCard} onPress={createLobby} activeOpacity={0.85}>
            <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>🏠</Text>
            <Text style={styles.actionTitle}>Create Lobby</Text>
            <Text style={styles.actionSub}>Host a game and invite friends</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.joinCard}>
            <Text style={{ fontSize: 40, marginBottom: spacing.sm, textAlign: 'center' }}>🔑</Text>
            <Text style={[styles.actionTitle, { textAlign: 'center' }]}>Join Lobby</Text>
            <TextInput style={styles.codeInput} value={roomCode}
              onChangeText={setRoomCode} placeholder="4-digit code"
              placeholderTextColor={colors.textLight} keyboardType="numeric" maxLength={4} />
            <TouchableOpacity style={styles.joinBtn} onPress={joinLobby} activeOpacity={0.85}>
              <Text style={styles.joinBtnText}>Join →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Lobby view
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { disconnectSocket(); navigation.goBack(); }}>
          <Text style={styles.backText}>← Leave Lobby</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚔️ Battle Lobby</Text>
        <View style={styles.codeDisplay}>
          <Text style={styles.codeLabel}>ROOM CODE</Text>
          <Text style={styles.codeValue}>{roomCode}</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.sectionLabel}>Players ({lobby.players.length}/6)</Text>
        {lobby.players.map((p, i) => (
          <View key={p.id} style={styles.playerCard}>
            <View style={[styles.playerAvatar, { backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }]}>
              <Text style={styles.playerInitial}>{p.displayName[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>{p.displayName}</Text>
              {p.isHost && <Text style={styles.hostBadge}>👑 HOST</Text>}
            </View>
            {p.id === socket?.id && (
              <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>
            )}
          </View>
        ))}

        {isHost && (
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>⚙️ Game Settings</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Years:</Text>
              <TextInput style={styles.settingInput} value={years} onChangeText={setYears}
                keyboardType="numeric" maxLength={2} />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Budget (CHF):</Text>
              <TextInput style={styles.settingInput} value={budget} onChangeText={setBudget}
                keyboardType="numeric" maxLength={7} />
            </View>
            <TouchableOpacity
              style={[styles.startBtn, lobby.players.length < 1 && { opacity: 0.5 }]}
              onPress={startGame} disabled={lobby.players.length < 1} activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>🚀  Start Game</Text>
            </TouchableOpacity>
            {lobby.players.length < 1 && (
              <Text style={{ fontSize: fontSize.xs, color: colors.textLight, textAlign: 'center', marginTop: spacing.sm }}>
                Need at least 2 players to start
              </Text>
            )}
          </View>
        )}

        {!isHost && (
          <View style={styles.waitingCard}>
            <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>⏳</Text>
            <Text style={styles.waitingText}>Waiting for host to start the game...</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.xs }}>
              Share the room code with friends
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary, paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: spacing.lg, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl,
  },
  backText: { color: colors.textOnDark, fontSize: fontSize.md, marginBottom: spacing.md },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textOnDark },
  headerSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  nameCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card },
  nameLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  nameInput: {
    backgroundColor: colors.background, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md,
    paddingVertical: 14, fontSize: fontSize.lg, fontWeight: '600', color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border, textAlign: 'center',
  },
  actionCard: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.xl,
    alignItems: 'center', ...shadows.card,
  },
  actionTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textOnDark },
  actionSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.md, fontSize: fontSize.sm, fontWeight: '600', color: colors.textLight },
  joinCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.card },
  codeInput: {
    backgroundColor: colors.background, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md,
    paddingVertical: 14, fontSize: 28, fontWeight: '800', color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border, textAlign: 'center', letterSpacing: 8, marginVertical: spacing.md,
  },
  joinBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.full, paddingVertical: 14, alignItems: 'center', ...shadows.button },
  joinBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnAccent },
  // Lobby view
  codeDisplay: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.md,
  },
  codeLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 2 },
  codeValue: { fontSize: 32, fontWeight: '900', color: colors.accent, letterSpacing: 6 },
  sectionLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.md },
  playerCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card,
  },
  playerAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  playerInitial: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  playerName: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  hostBadge: { fontSize: 10, fontWeight: '700', color: colors.accent, marginTop: 2 },
  youBadge: { backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  youBadgeText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  settingsCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.md, ...shadows.card },
  settingsTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  settingLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  settingInput: {
    backgroundColor: colors.background, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md,
    paddingVertical: 8, fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border, width: 100, textAlign: 'center',
  },
  startBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.full, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md, ...shadows.button },
  startBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnAccent },
  waitingCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', marginTop: spacing.md, ...shadows.card },
  waitingText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
});
