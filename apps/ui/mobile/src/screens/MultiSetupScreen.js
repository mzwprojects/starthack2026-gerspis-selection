import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Platform, ScrollView, Alert
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';
import { api } from '../api';
import { getSocket } from '../socket';

export default function MultiSetupScreen({ navigation, route }) {
  const { email, displayName, roomCode, years, totalBudget } = route.params;
  const [assets, setAssets] = useState([]);
  const [allocation, setAllocation] = useState({});
  const [players, setPlayers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    api.getAssets().then(data => setAssets(data.assets || []));

    socket.on('lobby_update', (data) => {
      setPlayers(data.players);
    });
    socket.on('all_ready', () => {
      // Auto-start simulation — the host emits start_simulation
      setTimeout(() => socket.emit('start_simulation'), 500);
    });
    socket.on('simulation_data', (data) => {
      navigation.replace('MultiSimulation', { email, displayName, roomCode, simData: data });
    });
    return () => {
      socket.off('lobby_update');
      socket.off('all_ready');
      socket.off('simulation_data');
    };
  }, []);

  const totalAlloc = Object.values(allocation).reduce((a, b) => a + b, 0);

  const adjust = (id, delta) => {
    setAllocation(prev => {
      const total = Object.values(prev).reduce((a, b) => a + b, 0);
      const cur = prev[id] || 0;
      const nv = Math.max(0, Math.min(100, cur + delta));
      if (total - cur + nv > 100) return prev;
      return { ...prev, [id]: nv };
    });
  };

  const submit = () => {
    if (totalAlloc !== 100) { Alert.alert('Not Ready', 'Allocation must total 100%'); return; }
    socket.emit('submit_allocation', { allocation });
    setSubmitted(true);
  };

  const isHost = players.find(p => p.isHost)?.id === socket.id;
  const allReady = players.length > 0 && players.every(p => p.ready);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚔️ Set Up Your Portfolio</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>📅 {years} Years</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>💰 CHF {totalBudget.toLocaleString()}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>🔑 {roomCode}</Text>
          </View>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        {/* Player status */}
        <View style={styles.playersRow}>
          {players.map((p, i) => (
            <View key={p.id} style={[styles.playerChip, p.ready && styles.playerChipReady]}>
              <Text style={{ fontSize: 10, marginRight: 3 }}>{p.ready ? '✅' : '⏳'}</Text>
              <Text style={[styles.playerChipText, p.ready && { color: '#155724' }]}>{p.displayName}</Text>
            </View>
          ))}
        </View>

        {/* Allocation bar */}
        <View style={styles.allocBar}>
          <View style={[styles.allocFill, { width: `${totalAlloc}%`, backgroundColor: totalAlloc === 100 ? colors.success : colors.accent }]} />
        </View>
        <Text style={[styles.allocText, totalAlloc === 100 && { color: colors.success }]}>
          {totalAlloc}% allocated
        </Text>

        {/* Asset list */}
        {assets.map(asset => (
          <View key={asset.id} style={styles.assetRow}>
            <Text style={{ fontSize: 22, marginRight: spacing.sm }}>{asset.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.assetName}>{asset.name}</Text>
              <Text style={styles.assetCategory}>{asset.category} · {asset.riskLevel}</Text>
            </View>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjust(asset.id, -5)} disabled={submitted}>
              <Text style={styles.adjustBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.allocValue, allocation[asset.id] > 0 && { color: colors.primary }]}>
              {allocation[asset.id] || 0}%
            </Text>
            <TouchableOpacity style={[styles.adjustBtn, styles.adjustBtnPlus]} onPress={() => adjust(asset.id, 5)} disabled={submitted}>
              <Text style={[styles.adjustBtnText, { color: colors.textOnDark }]}>+</Text>
            </TouchableOpacity>
          </View>
        ))}

        {!submitted ? (
          <TouchableOpacity style={[styles.submitBtn, totalAlloc !== 100 && { opacity: 0.5 }]}
            onPress={submit} disabled={totalAlloc !== 100} activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>✅ Lock In Allocation</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingCard}>
            <Text style={{ fontSize: 32 }}>⏳</Text>
            <Text style={styles.waitingText}>
              {allReady ? 'Starting simulation...' : 'Waiting for other players...'}
            </Text>
            {isHost && allReady && (
              <TouchableOpacity style={styles.submitBtn} onPress={() => socket.emit('start_simulation')} activeOpacity={0.85}>
                <Text style={styles.submitBtnText}>🚀 Start Simulation</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary, paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: spacing.md, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl,
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textOnDark },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  headerBadgeText: { fontSize: fontSize.xs, color: colors.textOnDark, fontWeight: '600' },
  playersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  playerChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.border,
  },
  playerChipReady: { backgroundColor: '#D4EDDA', borderColor: colors.success },
  playerChipText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textSecondary },
  allocBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  allocFill: { height: '100%', borderRadius: 4 },
  allocText: { fontSize: fontSize.xs, color: colors.textLight, textAlign: 'right', marginBottom: spacing.md },
  assetRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: 6, ...shadows.card,
  },
  assetName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  assetCategory: { fontSize: 10, color: colors.textLight },
  adjustBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  adjustBtnPlus: { backgroundColor: colors.primary, borderColor: colors.primary },
  adjustBtnText: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  allocValue: { width: 44, textAlign: 'center', fontSize: fontSize.sm, fontWeight: '700', color: colors.textLight },
  submitBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.full, paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg, ...shadows.button },
  submitBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnAccent },
  waitingCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', marginTop: spacing.lg, ...shadows.card },
  waitingText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', marginTop: spacing.sm },
});
