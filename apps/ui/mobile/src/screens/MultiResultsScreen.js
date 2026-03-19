import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Platform, ScrollView, Dimensions
} from 'react-native';
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';
import { getSocket, disconnectSocket } from '../socket';

const CHART_W = Dimensions.get('window').width - 64;
const CHART_H = 160;
const PLAYER_COLORS = ['#2196F3', '#FF9800', '#4CAF50', '#E91E63', '#9C27B0', '#00BCD4'];

export default function MultiResultsScreen({ navigation, route }) {
  const { email, displayName, roomCode, simData } = route.params;
  const { years, totalBudget, yearByYear, saverHistory, players } = simData;
  const socket = getSocket();
  const myId = socket?.id;

  const fmt = (n) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");

  // Build rankings
  const rankings = players
    .map((p, i) => {
      const finalVal = yearByYear[years]?.[p.id]?.value || totalBudget;
      const returnPct = ((finalVal - totalBudget) / totalBudget * 100).toFixed(1);
      return { ...p, idx: i, finalVal, returnPct, color: PLAYER_COLORS[i % PLAYER_COLORS.length] };
    })
    .sort((a, b) => b.finalVal - a.finalVal);

  // Chart
  const renderChart = () => {
    let minVal = totalBudget, maxVal = totalBudget;
    for (let y = 0; y <= years; y++) {
      const yd = yearByYear[y];
      if (yd) Object.values(yd).forEach(p => { if (p.value < minVal) minVal = p.value; if (p.value > maxVal) maxVal = p.value; });
      if (saverHistory[y] < minVal) minVal = saverHistory[y];
      if (saverHistory[y] > maxVal) maxVal = saverHistory[y];
    }
    const pad = (maxVal - minVal) * 0.1 || totalBudget * 0.1;
    minVal -= pad; maxVal += pad;
    const toX = (i) => (i / years) * CHART_W;
    const toY = (val) => CHART_H - ((val - minVal) / (maxVal - minVal)) * CHART_H;

    const saverPts = [];
    for (let y = 0; y <= years; y++) saverPts.push(`${toX(y)},${toY(saverHistory[y])}`);

    const playerLines = players.map((p, i) => {
      const pts = [];
      for (let y = 0; y <= years; y++) {
        pts.push(`${toX(y)},${toY(yearByYear[y]?.[p.id]?.value || totalBudget)}`);
      }
      return { ...p, pts, color: PLAYER_COLORS[i % PLAYER_COLORS.length] };
    });

    const yearMarkers = [];
    for (let y = 0; y <= years; y += Math.max(1, Math.floor(years / 5))) yearMarkers.push(y);
    if (!yearMarkers.includes(years)) yearMarkers.push(years);

    return (
      <View style={styles.chartContainer}>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm }}>📊 Portfolio Comparison</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {playerLines.map(p => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 3, backgroundColor: p.color, marginRight: 4, borderRadius: 2 }} />
              <Text style={{ fontSize: 9, color: colors.textSecondary }}>{p.displayName}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 10, height: 3, backgroundColor: '#BDC3C7', marginRight: 4, borderRadius: 2 }} />
            <Text style={{ fontSize: 9, color: colors.textSecondary }}>Saver</Text>
          </View>
        </View>
        <Svg width={CHART_W} height={CHART_H + 24}>
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
            <Line key={i} x1={0} y1={CHART_H * (1 - pct)} x2={CHART_W} y2={CHART_H * (1 - pct)} stroke="#E8E8E8" strokeWidth={0.5} />
          ))}
          {saverPts.length > 1 && (
            <Polyline points={saverPts.join(' ')} fill="none" stroke="#BDC3C7" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {playerLines.map(p => p.pts.length > 1 && (
            <Polyline key={p.id} points={p.pts.join(' ')} fill="none" stroke={p.color}
              strokeWidth={p.id === myId ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {yearMarkers.map(y => (
            <SvgText key={y} x={toX(y)} y={CHART_H + 16} fill="#999" fontSize={10} textAnchor="middle">{y}</SvgText>
          ))}
        </Svg>
      </View>
    );
  };

  const winner = rankings[0];
  const myRank = rankings.findIndex(r => r.id === myId) + 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Battle Results</Text>
        <Text style={styles.headerSub}>Room {roomCode} · {years} years · CHF {fmt(totalBudget)}</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl * 2 }} showsVerticalScrollIndicator={false}>
        {/* Winner trophy */}
        <View style={styles.winnerCard}>
          <Text style={{ fontSize: 54 }}>🏆</Text>
          <Text style={styles.winnerLabel}>WINNER</Text>
          <Text style={styles.winnerName}>{winner.displayName}</Text>
          <Text style={styles.winnerValue}>CHF {fmt(winner.finalVal)}</Text>
          <Text style={[styles.winnerReturn, { color: winner.returnPct >= 0 ? colors.success : colors.danger }]}>
            {winner.returnPct >= 0 ? '+' : ''}{winner.returnPct}%
          </Text>
          {winner.id === myId && (
            <Text style={{ fontSize: fontSize.sm, color: colors.accent, fontWeight: '600', marginTop: spacing.sm }}>🎉 That's you! Congratulations!</Text>
          )}
        </View>

        {/* Your placement */}
        {winner.id !== myId && (
          <View style={styles.yourPlacement}>
            <Text style={{ fontSize: 20, marginRight: spacing.sm }}>
              {myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '📊'}
            </Text>
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary }}>
              You finished #{myRank} of {players.length}
            </Text>
          </View>
        )}

        {/* Full rankings */}
        <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md }}>
          Final Rankings
        </Text>
        {rankings.map((p, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          const pos = p.returnPct >= 0;
          return (
            <View key={p.id} style={[styles.rankCard, p.id === myId && styles.rankCardMe]}>
              <Text style={{ fontSize: 22, width: 36, textAlign: 'center' }}>{medal}</Text>
              <View style={[styles.rankAvatar, { backgroundColor: p.color }]}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFF' }}>{p.displayName[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary }}>
                  {p.displayName}{p.id === myId ? ' (You)' : ''}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textLight }}>
                  {pos ? '+' : ''}{p.returnPct}% Return
                </Text>
              </View>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.textPrimary }}>
                CHF {fmt(p.finalVal)}
              </Text>
            </View>
          );
        })}

        {/* Comparison chart */}
        {renderChart()}

        {/* Saver comparison */}
        <View style={styles.saverCompare}>
          <Text style={{ fontSize: 16, marginRight: spacing.sm }}>🏦</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary }}>Savings Account</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textLight }}>What if everyone just saved?</Text>
          </View>
          <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.textSecondary }}>
            CHF {fmt(saverHistory[years])}
          </Text>
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => {
          disconnectSocket();
          navigation.popToTop();
        }} activeOpacity={0.85}>
          <Text style={styles.homeBtnText}>🏠  Back to Home</Text>
        </TouchableOpacity>
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
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textOnDark },
  headerSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  winnerCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.md,
    borderWidth: 2, borderColor: colors.accent, ...shadows.card,
  },
  winnerLabel: { fontSize: 11, fontWeight: '800', color: colors.accent, letterSpacing: 3, marginTop: spacing.sm },
  winnerName: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.xs },
  winnerValue: { fontSize: 28, fontWeight: '900', color: colors.primary, marginTop: spacing.xs },
  winnerReturn: { fontSize: fontSize.lg, fontWeight: '700', marginTop: 2 },
  yourPlacement: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary + '10', borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.md,
  },
  rankCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card,
  },
  rankCardMe: { borderWidth: 1.5, borderColor: colors.primary },
  rankAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  chartContainer: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.md, ...shadows.card },
  saverCompare: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md, ...shadows.card,
  },
  homeBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg, ...shadows.button },
  homeBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnDark },
});
