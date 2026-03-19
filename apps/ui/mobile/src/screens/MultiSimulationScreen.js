import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
  Platform, Modal, Animated, Dimensions, Easing
} from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';
import { getSocket } from '../socket';

const YEAR_DURATION = 7000;
const Y_AXIS_W = 45;
const CHART_W = Dimensions.get('window').width - 64 - Y_AXIS_W;
const CHART_H = 150;
const SCREEN_H = Dimensions.get('window').height;
const PLAYER_COLORS = ['#2196F3', '#FF9800', '#4CAF50', '#E91E63', '#9C27B0', '#00BCD4'];

export default function MultiSimulationScreen({ navigation, route }) {
  const { email, displayName, roomCode, simData } = route.params;
  const { years, totalBudget, yearByYear, saverHistory, traderHistory, yearlyData, players } = simData;
  const socket = getSocket();
  const myId = socket?.id;

  const [currentYear, setCurrentYear] = useState(0);
  const [animProgress, setAnimProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [decisionChosen, setDecisionChosen] = useState(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const yearTimerRef = useRef(null);

  // Year intro
  const [showYearIntro, setShowYearIntro] = useState(false);
  const [introYear, setIntroYear] = useState(1);
  const yearIntroOpacity = useRef(new Animated.Value(0)).current;
  const yearIntroScale = useRef(new Animated.Value(0.5)).current;

  // Year-end popup
  const [showYearEnd, setShowYearEnd] = useState(false);
  const [yearEndYear, setYearEndYear] = useState(0);
  const yearEndSlide = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    showYearIntroOverlay(1);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (yearTimerRef.current) clearTimeout(yearTimerRef.current);
    };
  }, []);

  const showYearIntroOverlay = useCallback((y) => {
    setIntroYear(y);
    setShowYearIntro(true);
    yearIntroOpacity.setValue(0);
    yearIntroScale.setValue(0.5);
    Animated.parallel([
      Animated.timing(yearIntroOpacity, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.spring(yearIntroScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(yearIntroOpacity, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.in(Easing.cubic) }).start(() => {
          setShowYearIntro(false);
          startYear(y);
        });
      }, 800);
    });
  }, []);

  const startYear = useCallback((y) => {
    if (y > years) { setComplete(true); return; }
    setCurrentYear(y);
    setAnimProgress(0);
    Animated.timing(progressAnim, { toValue: y / years, duration: YEAR_DURATION, useNativeDriver: false }).start();

    startTimeRef.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const linearP = Math.min(1, elapsed / YEAR_DURATION);
      const p = linearP < 0.5 ? 2 * linearP * linearP : 1 - Math.pow(-2 * linearP + 2, 2) / 2;
      setAnimProgress(p);
      if (linearP < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setAnimProgress(1);
        showYearEndPopup(y);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [years]);

  const showYearEndPopup = useCallback((y) => {
    setYearEndYear(y);
    setShowYearEnd(true);
    yearEndSlide.setValue(SCREEN_H);
    Animated.spring(yearEndSlide, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }).start();
  }, []);

  const dismissYearEnd = useCallback(() => {
    Animated.timing(yearEndSlide, { toValue: SCREEN_H, duration: 300, useNativeDriver: true, easing: Easing.in(Easing.cubic) }).start(() => {
      setShowYearEnd(false);
      const y = yearEndYear;
      const yd = yearlyData[y - 1];
      if (yd && yd.interaction) {
        setQuizAnswer(null);
        setDecisionChosen(null);
        setActiveModal({ type: yd.interaction.type, data: yd.interaction.data });
      } else {
        if (y < years) {
          yearTimerRef.current = setTimeout(() => showYearIntroOverlay(y + 1), 300);
        } else {
          setComplete(true);
        }
      }
    });
  }, [yearEndYear, years]);

  const dismissModal = () => {
    setActiveModal(null);
    setQuizAnswer(null);
    setDecisionChosen(null);
    if (currentYear < years) {
      yearTimerRef.current = setTimeout(() => showYearIntroOverlay(currentYear + 1), 400);
    } else {
      setComplete(true);
    }
  };

  const fmt = (n) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");

  // Get my current value
  const getPlayerValue = (playerId) => {
    if (currentYear === 0) return totalBudget;
    const prevYear = currentYear - 1;
    const prevVal = yearByYear[prevYear]?.[playerId]?.value || totalBudget;
    const nextVal = yearByYear[Math.min(currentYear, years)]?.[playerId]?.value || prevVal;
    return prevVal + (nextVal - prevVal) * animProgress;
  };

  // Build chart
  const renderChart = () => {
    // Compute the current animated position in the timeline
    const totalProgress = Math.max(0, currentYear - 1 + animProgress);
    const visibleEnd = Math.ceil(totalProgress);

    // Calculate value range ONLY up to visible progress
    let rawMin = totalBudget, rawMax = totalBudget;
    for (let y = 0; y <= visibleEnd && y <= years; y++) {
      const yd = yearByYear[y];
      if (yd) {
        Object.values(yd).forEach(p => {
          if (p.value < rawMin) rawMin = p.value;
          if (p.value > rawMax) rawMax = p.value;
        });
      }
      if (saverHistory[y] < rawMin) rawMin = saverHistory[y];
      if (saverHistory[y] > rawMax) rawMax = saverHistory[y];
    }
    
    // Dynamic Y: Zoom in relative to price
    const padding = (rawMax - rawMin) * 0.1 || totalBudget * 0.1;
    const minVal = rawMin - padding;
    const maxVal = rawMax + padding;

    const toX = (i) => (i / Math.max(1, years)) * CHART_W;
    const toY = (val) => CHART_H - ((val - minVal) / (maxVal - minVal)) * CHART_H;

    const buildPts = (getVal) => {
      const pts = [`${toX(0)},${toY(getVal(0))}`];
      if (currentYear > 0) {
        for (let i = 1; i < currentYear; i++) pts.push(`${toX(i)},${toY(getVal(i))}`);
        const prev = getVal(currentYear - 1);
        const next = getVal(Math.min(currentYear, years));
        const interp = prev + (next - prev) * animProgress;
        pts.push(`${toX(currentYear - 1 + animProgress)},${toY(interp)}`);
      }
      return pts;
    };

    const saverPts = buildPts(y => saverHistory[y]);
    const playerLines = players.map((p, i) => ({
      ...p,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      pts: buildPts(y => yearByYear[y]?.[p.id]?.value || totalBudget),
    }));

    // Fixed X-axis: show all years
    const xMarkers = [];
    for (let y = 0; y <= years; y += Math.max(1, Math.floor(years / 5))) {
      xMarkers.push(y);
    }
    if (!xMarkers.includes(years)) xMarkers.push(years);

    // Dynamic Y-axis: relative to min/max
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => {
      const val = minVal + (maxVal - minVal) * pct;
      return { pct, val, label: fmt(Math.round(val)), yPos: CHART_H * (1 - pct) };
    });

    return (
      <View style={styles.chartContainer}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8, gap: 8 }}>
          {playerLines.map(p => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 3, backgroundColor: p.color, marginRight: 4, borderRadius: 2 }} />
              <Text style={{ fontSize: 9, color: colors.textSecondary }}>{p.displayName}{p.id === myId ? ' (You)' : ''}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 10, height: 3, backgroundColor: '#BDC3C7', marginRight: 4, borderRadius: 2 }} />
            <Text style={{ fontSize: 9, color: colors.textSecondary }}>Saver</Text>
          </View>
        </View>
        <Svg width={CHART_W + Y_AXIS_W} height={CHART_H + 40}>
          {/* Y-axis label */}
          <SvgText x={6} y={CHART_H / 2} fill="#999" fontSize={9} fontWeight="600"
            textAnchor="middle" rotation={-90} originX={6} originY={CHART_H / 2}>
            Portfolio (CHF)
          </SvgText>
          {/* Y-axis tick values + grid lines (dynamic 10k steps) */}
          {yTicks.map((tick, i) => (
            <React.Fragment key={i}>
              <SvgText x={Y_AXIS_W - 4} y={tick.yPos + 3} fill="#999" fontSize={8} textAnchor="end">
                {tick.label}
              </SvgText>
              <Line x1={Y_AXIS_W} y1={tick.yPos} x2={Y_AXIS_W + CHART_W} y2={tick.yPos}
                stroke="#E8E8E8" strokeWidth={0.5} />
            </React.Fragment>
          ))}
          {/* Chart lines */}
          {saverPts.length > 1 && (
            <Polyline points={saverPts.map(p => { const [x, y] = p.split(','); return `${parseFloat(x) + Y_AXIS_W},${y}`; }).join(' ')}
              fill="none" stroke="#BDC3C7" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {playerLines.map(p => p.pts.length > 1 && (
            <Polyline key={p.id} points={p.pts.map(pt => { const [x, y] = pt.split(','); return `${parseFloat(x) + Y_AXIS_W},${y}`; }).join(' ')}
              fill="none" stroke={p.color}
              strokeWidth={p.id === myId ? 2.5 : 1.5}
              strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {/* X-axis year markers (dynamic, progressive) */}
          {xMarkers.map(y => (
            <SvgText key={y} x={toX(y) + Y_AXIS_W} y={CHART_H + 14} fill="#999" fontSize={10} textAnchor="middle">
              {y}
            </SvgText>
          ))}
          {/* X-axis label */}
          <SvgText x={Y_AXIS_W + CHART_W / 2} y={CHART_H + 32} fill="#999" fontSize={9} fontWeight="600" textAnchor="middle">
            Year
          </SvgText>
        </Svg>
      </View>
    );
  };

  // Leaderboard
  const rankings = players
    .map(p => ({ ...p, value: getPlayerValue(p.id) }))
    .sort((a, b) => b.value - a.value);

  const myVal = getPlayerValue(myId);
  const myChange = myVal - totalBudget;
  const myPct = ((myChange / totalBudget) * 100).toFixed(1);
  const pos = myChange >= 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚔️ Battle Simulation</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.sm }}>
          <Text style={{ fontSize: fontSize.md, color: 'rgba(255,255,255,0.6)', marginRight: spacing.sm }}>Year</Text>
          <Text style={{ fontSize: 38, fontWeight: '800', color: colors.accent }}>{currentYear}</Text>
          <Text style={{ fontSize: fontSize.lg, color: 'rgba(255,255,255,0.5)', marginLeft: spacing.xs }}>/ {years}</Text>
          <View style={{ marginLeft: spacing.md, backgroundColor: pos ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.25)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.full }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: pos ? '#2ECC71' : '#E74C3C' }}>{pos ? '+' : ''}{myPct}%</Text>
          </View>
        </View>
        <View style={styles.progBar}>
          <Animated.View style={[styles.progFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }} showsVerticalScrollIndicator={false}>
        <View style={styles.valueCard}>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>Your Portfolio</Text>
          <Text style={styles.valueAmt}>CHF {fmt(myVal)}</Text>
          <Text style={[styles.valueChange, { color: pos ? colors.success : colors.danger }]}>
            {pos ? '+' : ''}{fmt(myChange)} ({pos ? '+' : ''}{myPct}%)
          </Text>
        </View>

        {renderChart()}

        {/* Live Leaderboard */}
        <View style={styles.leaderboard}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm }}>🏆 Live Ranking</Text>
          {rankings.map((p, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            const pChange = p.value - totalBudget;
            const pPct = ((pChange / totalBudget) * 100).toFixed(1);
            const pPos = pChange >= 0;
            return (
              <View key={p.id} style={[styles.rankRow, p.id === myId && styles.rankRowMe]}>
                <Text style={{ fontSize: 16, width: 28, textAlign: 'center' }}>{medal}</Text>
                <View style={[styles.rankAvatar, { backgroundColor: PLAYER_COLORS[players.findIndex(pl => pl.id === p.id) % PLAYER_COLORS.length] }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFF' }}>{p.displayName[0]}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary }}>
                  {p.displayName}{p.id === myId ? ' (You)' : ''}
                </Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textPrimary }}>{fmt(p.value)}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: pPos ? colors.success : colors.danger }}>{pPos ? '+' : ''}{pPct}%</Text>
                </View>
              </View>
            );
          })}
        </View>

        {complete ? (
          <TouchableOpacity style={styles.resultsBtn} onPress={() => {
            socket.emit('get_results');
            navigation.replace('MultiResults', { email, displayName, roomCode, simData });
          }} activeOpacity={0.85}>
            <Text style={styles.resultsBtnText}>🏆  See Final Results</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md }}>
            <Text style={{ fontSize: 16, marginRight: spacing.sm }}>{showYearIntro || showYearEnd || activeModal ? '⏸️' : '▶️'}</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
              {showYearIntro ? 'Starting year...' : showYearEnd || activeModal ? 'Paused...' : 'Simulating...'}
            </Text>
          </View>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Year Intro */}
      {showYearIntro && (
        <Animated.View style={[styles.yearIntroOverlay, { opacity: yearIntroOpacity }]}>
          <Animated.View style={{ transform: [{ scale: yearIntroScale }], alignItems: 'center' }}>
            <Text style={styles.yearIntroLabel}>YEAR</Text>
            <Text style={styles.yearIntroNumber}>{introYear}</Text>
            <View style={styles.yearIntroDivider} />
            <Text style={styles.yearIntroSub}>of {years} years</Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* Year End */}
      <Modal visible={showYearEnd} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.yearEndCard, { transform: [{ translateY: yearEndSlide }] }]}>
            <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: spacing.sm }}>🎉</Text>
            <Text style={styles.yearEndTitle}>Year {yearEndYear} Complete!</Text>
            <View style={{ marginTop: spacing.sm }}>
              {rankings.map((p, i) => (
                <Text key={p.id} style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {p.displayName}: CHF {fmt(p.value)}
                </Text>
              ))}
            </View>
            <TouchableOpacity style={styles.yearEndContinueBtn} onPress={dismissYearEnd} activeOpacity={0.85}>
              <Text style={styles.yearEndContinueBtnText}>Continue →</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Quiz */}
      <Modal visible={activeModal?.type === 'quiz'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalBadge}>🧠 QUIZ</Text>
              <Text style={styles.quizQ}>{activeModal?.data?.question}</Text>
              {activeModal?.data?.options?.map((opt, i) => {
                let s = styles.qOpt;
                if (quizAnswer !== null) {
                  if (i === activeModal.data.correct) s = [styles.qOpt, { backgroundColor: '#D4EDDA', borderColor: colors.success }];
                  else if (i === quizAnswer) s = [styles.qOpt, { backgroundColor: '#F8D7DA', borderColor: colors.danger }];
                }
                return (
                  <TouchableOpacity key={i} style={s} onPress={() => { if (quizAnswer === null) setQuizAnswer(i); }} disabled={quizAnswer !== null}>
                    <Text style={{ fontWeight: '700', color: colors.primary, width: 20 }}>{String.fromCharCode(65 + i)}</Text>
                    <Text style={{ flex: 1, fontSize: fontSize.sm, color: colors.textPrimary }}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
              {quizAnswer !== null && (
                <>
                  <View style={styles.feedbackBox}>
                    <Text style={{ fontSize: 22, marginBottom: 4 }}>{quizAnswer === activeModal?.data?.correct ? '✅' : '❌'}</Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' }}>{activeModal?.data?.explanation}</Text>
                  </View>
                  <TouchableOpacity style={styles.modalBtn} onPress={dismissModal}><Text style={styles.modalBtnText}>Continue →</Text></TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Decision */}
      <Modal visible={activeModal?.type === 'decision'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
            <View style={styles.modalCard}>
              <Text style={[styles.modalBadge, { backgroundColor: '#FFE0E0', color: colors.danger }]}>⚡ DECISION</Text>
              <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>{activeModal?.data?.icon}</Text>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }}>{activeModal?.data?.title}</Text>
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md }}>{activeModal?.data?.description}</Text>
              {activeModal?.data?.options?.map((opt, i) => (
                <TouchableOpacity key={i} style={[styles.qOpt, decisionChosen === i && { backgroundColor: opt.effect >= 0 ? '#D4EDDA' : '#F8D7DA' }]}
                  onPress={() => { if (decisionChosen === null) setDecisionChosen(i); }} disabled={decisionChosen !== null}>
                  <Text style={{ fontSize: fontSize.sm, color: colors.textPrimary }}>{opt.text}</Text>
                </TouchableOpacity>
              ))}
              {decisionChosen !== null && (
                <TouchableOpacity style={styles.modalBtn} onPress={dismissModal}><Text style={styles.modalBtnText}>Continue →</Text></TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Tip */}
      <Modal visible={activeModal?.type === 'tip'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalBadge}>💡 TIP</Text>
            <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>{activeModal?.data?.icon}</Text>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }}>{activeModal?.data?.title}</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md }}>{activeModal?.data?.text}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={dismissModal}><Text style={styles.modalBtnText}>Got it! 👍</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnDark, marginBottom: spacing.sm },
  progBar: { height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  valueCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm, ...shadows.card },
  valueAmt: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  valueChange: { fontSize: fontSize.sm, fontWeight: '600', marginTop: 2 },
  chartContainer: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  leaderboard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  rankRowMe: { backgroundColor: colors.primary + '08', borderRadius: borderRadius.sm },
  rankAvatar: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  resultsBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.full, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md, ...shadows.button },
  resultsBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnAccent },
  yearIntroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,76,83,0.92)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  yearIntroLabel: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: 6, textTransform: 'uppercase', marginBottom: spacing.xs },
  yearIntroNumber: { fontSize: 96, fontWeight: '900', color: colors.accent, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 },
  yearIntroDivider: { width: 40, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginVertical: spacing.sm },
  yearIntroSub: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', maxWidth: 340, alignItems: 'center', ...shadows.card },
  modalBadge: { backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: fontSize.xs, fontWeight: '800', paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full, letterSpacing: 1, marginBottom: spacing.md, overflow: 'hidden' },
  modalBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 12, paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  modalBtnText: { color: colors.textOnDark, fontSize: fontSize.md, fontWeight: '600' },
  quizQ: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.md },
  qOpt: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: 6, borderWidth: 1.5, borderColor: colors.border },
  feedbackBox: { width: '100%', backgroundColor: '#F0F9FF', borderRadius: borderRadius.md, padding: spacing.sm, marginTop: spacing.sm, alignItems: 'center' },
  yearEndCard: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, width: '100%', position: 'absolute', bottom: 0, ...shadows.card },
  yearEndTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  yearEndContinueBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 14, alignItems: 'center', marginTop: spacing.lg, ...shadows.button },
  yearEndContinueBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnDark },
});
