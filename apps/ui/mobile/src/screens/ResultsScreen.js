import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, Platform
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';

const gradeColors = { A: '#22C55E', B: '#84CC16', C: '#EAB308', D: '#F97316', F: '#EF4444' };
const gradeLabels = { A: 'Excellent', B: 'Good', C: 'Average', D: 'Below Average', F: 'Poor' };

export default function ResultsScreen({ navigation, route }) {
  const { simData } = route.params;
  const { summary } = simData;

  const fmt = (n) => {
    if (n === undefined || n === null) return '0';
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  };

  const gc = gradeColors[summary.riskReturnGrade] || colors.textLight;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Your Results</Text>
        <Text style={{ fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
          {simData.years} years of investing — here's what happened
        </Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* Investor Score */}
        <View style={styles.scoreCard}>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs }}>Investor Score</Text>
          <Text style={styles.scoreValue}>{summary.investorScore}</Text>
          <Text style={{ fontSize: fontSize.lg, color: colors.textLight }}>/100</Text>
          <View style={styles.scoreBar}><View style={[styles.scoreFill, { width: `${summary.investorScore}%` }]} /></View>
          <Text style={{ fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.sm }}>
            Based on returns, diversification, risk-adjusted performance, and resilience
          </Text>
        </View>

        {/* Risk-Return Grade */}
        <View style={styles.riskReturnCard}>
          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm }}>⚖️ Risk-Return Analysis</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <View style={[styles.gradeBadge, { backgroundColor: gc + '20', borderColor: gc }]}>
              <Text style={[styles.gradeText, { color: gc }]}>{summary.riskReturnGrade}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: gc }}>{gradeLabels[summary.riskReturnGrade]}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                Risk Level: {summary.riskLevel}
              </Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Annual Return</Text>
              <Text style={[styles.metricValue, { color: summary.annualizedReturnPct >= 0 ? colors.success : colors.danger }]}>
                {summary.annualizedReturnPct >= 0 ? '+' : ''}{summary.annualizedReturnPct}%
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Volatility</Text>
              <Text style={[styles.metricValue, { color: summary.volatilityPct > 20 ? colors.danger : summary.volatilityPct > 12 ? colors.warning : colors.success }]}>
                {summary.volatilityPct}%
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Sharpe Ratio</Text>
              <Text style={[styles.metricValue, { color: gc }]}>
                {summary.sharpeRatio}
              </Text>
            </View>
          </View>
          <View style={styles.riskExplain}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
              {summary.sharpeRatio >= 0.8
                ? "🏅 Outstanding! You achieved strong returns while managing risk well. This is smart investing."
                : summary.sharpeRatio >= 0.5
                ? "👍 Good balance of risk and reward. Your portfolio allocated risk efficiently."
                : summary.sharpeRatio >= 0.2
                ? "⚡ Average risk-return ratio. Consider diversifying more to improve your risk-adjusted returns."
                : summary.sharpeRatio >= 0
                ? "⚠️ Your returns didn't justify the risk taken. A more balanced portfolio would likely perform better."
                : "🚨 Negative risk-adjusted return. Taking more risk didn't pay off — consider a safer, more diversified strategy."}
            </Text>
          </View>
        </View>

        {/* Saver vs Investor */}
        <View style={styles.compRow}>
          <View style={styles.compCard}>
            <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>😐</Text>
            <Text style={styles.compLabel}>The Saver</Text>
            <Text style={styles.compAmount}>CHF {fmt(summary.saverFinalValue)}</Text>
            <Text style={[styles.compDetail, { color: colors.danger }]}>Lost CHF {fmt(summary.saverInflationLoss)} to inflation</Text>
          </View>
          <View style={[styles.compCard, styles.compHighlight]}>
            <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>🚀</Text>
            <Text style={styles.compLabel}>The Investor (You)</Text>
            <Text style={[styles.compAmount, { color: colors.primary }]}>CHF {fmt(summary.finalValue)}</Text>
            <Text style={[styles.compDetail, { color: summary.totalReturn >= 0 ? colors.success : colors.danger }]}>
              {summary.totalReturn >= 0 ? '+' : ''}CHF {fmt(summary.totalReturn)} gained
            </Text>
          </View>
        </View>

        {/* Power of Investing */}
        <View style={styles.powerCard}>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs }}>The Power of Investing</Text>
          <Text style={[styles.powerAmt, { color: summary.totalReturn > (summary.saverFinalValue - simData.totalBudget) ? colors.success : colors.danger }]}>
            {summary.totalReturn > 0 ? '+' : ''}CHF {fmt(summary.totalReturn - (summary.saverFinalValue - simData.totalBudget))}
          </Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textLight, marginTop: 4 }}>more than just saving</Text>
        </View>

        {/* Cost of Fear */}
        {summary.panicSells > 0 && (
          <View style={styles.fearCard}>
            <Text style={styles.fearTitle}>Cost of Fear</Text>
            <Text style={styles.fearText}>
              You experienced {summary.panicSells} major crash{summary.panicSells > 1 ? 'es' : ''}, potentially costing you approximately{' '}
              <Text style={{ color: colors.danger, fontWeight: '700' }}>CHF {fmt(summary.costOfFear)}</Text> if you had panic-sold.
            </Text>
          </View>
        )}

        {/* What you learned */}
        <View style={styles.learnedCard}>
          <Text style={styles.learnedTitle}>What You Learned</Text>
          {summary.lessons.map((l, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm }}>
              <Text style={{ fontSize: 18, marginRight: spacing.sm, marginTop: 1 }}>{l.icon}</Text>
              <Text style={{ flex: 1, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>{l.text}</Text>
            </View>
          ))}
        </View>

        {/* Diversification */}
        <View style={styles.diversCard}>
          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm }}>Diversification Score</Text>
          <View style={{ height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: spacing.xs }}>
            <View style={{ height: '100%', backgroundColor: colors.primary, borderRadius: 5, width: `${summary.diversificationScore}%` }} />
          </View>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.primary, textAlign: 'right' }}>{summary.diversificationScore}/100</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.sm }}>
            {summary.diversificationScore >= 80 ? '🎯 Excellent diversification!' :
             summary.diversificationScore >= 50 ? '⚡ Good start — try adding more asset classes!' :
             '⚠️ Consider diversifying across more categories.'}
          </Text>
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.playBtn} onPress={() => navigation.navigate('GameSetup', { email: route.params?.email })} activeOpacity={0.85}>
          <Text style={styles.playBtnText}>🎮  Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.popToTop()} activeOpacity={0.85}>
          <Text style={styles.homeBtnText}>🏠  Back to Home</Text>
        </TouchableOpacity>
        <View style={{ height: spacing.xxl }} />
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
  scoreCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg, ...shadows.card },
  scoreValue: { fontSize: fontSize.hero, fontWeight: '800', color: colors.accent },
  scoreBar: { width: '100%', height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginTop: spacing.sm },
  scoreFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 4 },
  riskReturnCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card },
  gradeBadge: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  gradeText: { fontSize: 28, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  metricBox: { flex: 1, backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center' },
  metricLabel: { fontSize: 10, color: colors.textLight, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { fontSize: fontSize.lg, fontWeight: '800' },
  riskExplain: { backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.sm },
  compRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  compCard: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', ...shadows.card },
  compHighlight: { borderWidth: 2, borderColor: colors.accent },
  compLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.xs, textAlign: 'center' },
  compAmount: { fontSize: fontSize.lg, fontWeight: '800', color: colors.textPrimary },
  compDetail: { fontSize: fontSize.xs, marginTop: 4, textAlign: 'center' },
  powerCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg, ...shadows.card },
  powerAmt: { fontSize: 28, fontWeight: '800' },
  fearCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card },
  fearTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  fearText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  learnedCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card },
  learnedTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  diversCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card },
  playBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.full, paddingVertical: 16, alignItems: 'center', marginBottom: spacing.md, ...shadows.button },
  playBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnAccent },
  homeBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 16, alignItems: 'center' },
  homeBtnText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textOnDark },
});
