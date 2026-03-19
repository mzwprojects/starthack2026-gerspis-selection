import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
  Platform, Modal, Animated, Dimensions, Easing
} from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';
import { api } from '../api';

const YEAR_DURATION = 7000; // 7 seconds per year
const Y_AXIS_W = 45;
const CHART_W = Dimensions.get('window').width - 64 - Y_AXIS_W;
const CHART_H = 140;
const ASSET_CHART_H = 120;
const SCREEN_H = Dimensions.get('window').height;

// Distinct colors for asset lines
const ASSET_COLORS = [
  '#2196F3', '#FF9800', '#4CAF50', '#E91E63', '#9C27B0',
  '#00BCD4', '#FF5722', '#795548', '#607D8B', '#CDDC39', '#3F51B5'
];

export default function SimulationScreen({ navigation, route }) {
  const { email, years, totalBudget, allocation } = route.params;
  const [simData, setSimData] = useState(null);
  const [currentYear, setCurrentYear] = useState(0);
  const [animProgress, setAnimProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [decisionChosen, setDecisionChosen] = useState(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const yearAnimRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  // Year intro overlay
  const [showYearIntro, setShowYearIntro] = useState(false);
  const [introYear, setIntroYear] = useState(1);
  const yearIntroOpacity = useRef(new Animated.Value(0)).current;
  const yearIntroScale = useRef(new Animated.Value(0.5)).current;

  // Year-end popup
  const [showYearEnd, setShowYearEnd] = useState(false);
  const [yearEndYear, setYearEndYear] = useState(0);
  const yearEndSlide = useRef(new Animated.Value(SCREEN_H)).current;
  const [wantsRealloc, setWantsRealloc] = useState(false);
  const [yearEndAllocation, setYearEndAllocation] = useState({});
  const [yearEndAssets, setYearEndAssets] = useState([]);

  const simDataRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const assetsData = await api.getAssets();
        setYearEndAssets(assetsData.assets || []);
        const data = await api.simulate(years, totalBudget, allocation);
        if (data.error) { alert(data.error); navigation.goBack(); return; }
        setSimData(data);
        simDataRef.current = data;
        showYearIntroOverlay(1, data);
      } catch (e) { alert('Simulation failed.'); navigation.goBack(); }
    })();
    return () => {
      if (yearAnimRef.current) clearTimeout(yearAnimRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const showYearIntroOverlay = useCallback((y, data) => {
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
          startYear(data || simDataRef.current, y);
        });
      }, 800);
    });
  }, []);

  const startYear = useCallback((data, y) => {
    if (y > data.years) { setComplete(true); return; }
    setCurrentYear(y);
    setAnimProgress(0);
    Animated.timing(progressAnim, { toValue: y / data.years, duration: YEAR_DURATION, useNativeDriver: false }).start();

    startTimeRef.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const linearP = Math.min(1, elapsed / YEAR_DURATION);
      const p = linearP < 0.5
        ? 2 * linearP * linearP
        : 1 - Math.pow(-2 * linearP + 2, 2) / 2;
      setAnimProgress(p);
      if (linearP < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setAnimProgress(1);
        showYearEndPopup(y, data);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const showYearEndPopup = useCallback((y, data) => {
    setYearEndYear(y);
    setShowYearEnd(true);
    setWantsRealloc(false);
    setYearEndAllocation({ ...allocation });
    yearEndSlide.setValue(SCREEN_H);
    Animated.spring(yearEndSlide, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }).start();
  }, [allocation]);

  const dismissYearEnd = useCallback(() => {
    Animated.timing(yearEndSlide, { toValue: SCREEN_H, duration: 300, useNativeDriver: true, easing: Easing.in(Easing.cubic) }).start(() => {
      setShowYearEnd(false);
      const data = simDataRef.current;
      if (!data) return;
      const y = yearEndYear;
      const yd = data.yearlyData[y - 1];
      if (yd && yd.event) {
        setActiveModal({ type: 'event', data: yd.event, yearInteraction: yd.interaction });
      } else if (yd && yd.interaction) {
        setQuizAnswer(null);
        setDecisionChosen(null);
        setActiveModal({ type: yd.interaction.type, data: yd.interaction.data });
      } else {
        if (y < data.years) {
          yearAnimRef.current = setTimeout(() => showYearIntroOverlay(y + 1, data), 300);
        } else {
          setComplete(true);
        }
      }
    });
  }, [yearEndYear]);

  const dismissModal = () => {
    const currentModal = activeModal;
    setActiveModal(null);
    setQuizAnswer(null);
    setDecisionChosen(null);
    const data = simDataRef.current;
    if (!data) return;
    if (currentModal?.type === 'event' && currentModal?.yearInteraction) {
      setTimeout(() => {
        setActiveModal({ type: currentModal.yearInteraction.type, data: currentModal.yearInteraction.data });
      }, 300);
      return;
    }
    if (currentYear < data.years) {
      yearAnimRef.current = setTimeout(() => showYearIntroOverlay(currentYear + 1, data), 400);
    } else {
      setComplete(true);
    }
  };

  const adjustYearEnd = (id, delta) => {
    setYearEndAllocation(prev => {
      const total = Object.values(prev).reduce((a, b) => a + b, 0);
      const cur = prev[id] || 0;
      const nv = Math.max(0, Math.min(100, cur + delta));
      if (total - cur + nv > 100) return prev;
      return { ...prev, [id]: nv };
    });
  };

  const fmt = (n) => {
    if (n === undefined || n === null) return '0';
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  };

  // --- MAIN CHART (Investor, Saver, Trader) ---
  const renderChart = () => {
    if (!simData) return null;
    const portfolioHistory = simData.portfolioHistory;
    const saverHistory = simData.saverHistory;
    const traderHistory = simData.traderHistory || [];

    // Compute the current animated position in the timeline
    const totalProgress = Math.max(0, currentYear - 1 + animProgress);

    // Calculate value range ONLY up to the current visible progress
    const visibleEnd = Math.ceil(totalProgress);
    let rawMin = portfolioHistory[0], rawMax = portfolioHistory[0];
    for (let i = 0; i <= visibleEnd && i <= years; i++) {
      rawMin = Math.min(rawMin, portfolioHistory[i], saverHistory[i]);
      rawMax = Math.max(rawMax, portfolioHistory[i], saverHistory[i]);
      if (traderHistory[i] !== undefined) {
        rawMin = Math.min(rawMin, traderHistory[i]);
        rawMax = Math.max(rawMax, traderHistory[i]);
      }
    }
    
    // Dynamic Y: Zoom in relative to price
    const padding = (rawMax - rawMin) * 0.1 || portfolioHistory[0] * 0.1;
    const minVal = rawMin - padding;
    const maxVal = rawMax + padding;

    const toX = (i) => (i / Math.max(1, years)) * CHART_W;
    const toY = (val) => CHART_H - ((val - minVal) / (maxVal - minVal)) * CHART_H;

    // Build points including interpolated current position
    const buildPoints = (history) => {
      const pts = [];
      // Always start with year 0
      pts.push(`${toX(0)},${toY(history[0])}`);

      if (currentYear > 0) {
        // Add all completed year points
        for (let i = 1; i < currentYear; i++) {
          pts.push(`${toX(i)},${toY(history[i])}`);
        }
        // Add interpolated current position
        const prevIdx = currentYear - 1;
        const nextIdx = Math.min(currentYear, years);
        const interpVal = history[prevIdx] + (history[nextIdx] - history[prevIdx]) * animProgress;
        const x = toX(prevIdx + animProgress);
        pts.push(`${x},${toY(interpVal)}`);
      }
      return pts;
    };

    const portfolioPoints = buildPoints(portfolioHistory);
    const saverPoints = buildPoints(saverHistory);
    const traderPoints = traderHistory.length > 0 ? buildPoints(traderHistory) : [];

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
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 3, backgroundColor: colors.primary, marginRight: 5, borderRadius: 2 }} />
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Investor (You)</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 3, backgroundColor: '#BDC3C7', marginRight: 5, borderRadius: 2 }} />
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Saver</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 3, backgroundColor: colors.danger, marginRight: 5, borderRadius: 2 }} />
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Trader</Text>
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
          {/* Chart lines offset by Y_AXIS_W */}
          {traderPoints.length > 1 && (
            <Polyline points={traderPoints.map(p => { const [x, y] = p.split(','); return `${parseFloat(x) + Y_AXIS_W},${y}`; }).join(' ')}
              fill="none" stroke={colors.danger} strokeWidth={1.5}
              strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,3" />
          )}
          {saverPoints.length > 1 && (
            <Polyline points={saverPoints.map(p => { const [x, y] = p.split(','); return `${parseFloat(x) + Y_AXIS_W},${y}`; }).join(' ')}
              fill="none" stroke="#BDC3C7" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" />
          )}
          {portfolioPoints.length > 1 && (
            <Polyline points={portfolioPoints.map(p => { const [x, y] = p.split(','); return `${parseFloat(x) + Y_AXIS_W},${y}`; }).join(' ')}
              fill="none" stroke={colors.primary} strokeWidth={2.5}
              strokeLinecap="round" strokeLinejoin="round" />
          )}
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

  // --- INDIVIDUAL ASSET BREAKDOWN CHART ---
  const renderAssetChart = () => {
    if (!simData || !simData.assetHistories) return null;
    const assetEntries = Object.entries(simData.assetHistories);
    if (assetEntries.length === 0) return null;

    // Calculate range across all individual assets
    let minVal = Infinity, maxVal = -Infinity;
    assetEntries.forEach(([, asset]) => {
      asset.history.forEach(v => {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      });
    });
    const pad = (maxVal - minVal) * 0.1 || 100;
    minVal -= pad;
    maxVal += pad;

    const toX = (i) => (i / years) * CHART_W;
    const toY = (val) => ASSET_CHART_H - ((val - minVal) / (maxVal - minVal)) * ASSET_CHART_H;

    const buildAssetPoints = (history) => {
      const pts = [];
      pts.push(`${toX(0)},${toY(history[0])}`);
      if (currentYear > 0) {
        for (let i = 1; i < currentYear; i++) {
          pts.push(`${toX(i)},${toY(history[i])}`);
        }
        const prevIdx = currentYear - 1;
        const nextIdx = Math.min(currentYear, years);
        if (history[nextIdx] !== undefined) {
          const interpVal = history[prevIdx] + (history[nextIdx] - history[prevIdx]) * animProgress;
          pts.push(`${toX(prevIdx + animProgress)},${toY(interpVal)}`);
        }
      }
      return pts;
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs }}>
          📊 Individual Asset Performance
        </Text>
        {/* Legend */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 6 }}>
          {assetEntries.map(([id, asset], idx) => (
            <View key={id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 8, height: 3, backgroundColor: ASSET_COLORS[idx % ASSET_COLORS.length], marginRight: 3, borderRadius: 1 }} />
              <Text style={{ fontSize: 9, color: colors.textSecondary }}>{asset.icon} {asset.name}</Text>
            </View>
          ))}
        </View>
        <Svg width={CHART_W} height={ASSET_CHART_H + 20}>
          {[0, 0.5, 1].map((pct, i) => (
            <Line key={i} x1={0} y1={ASSET_CHART_H * (1 - pct)} x2={CHART_W} y2={ASSET_CHART_H * (1 - pct)}
              stroke="#E8E8E8" strokeWidth={0.5} />
          ))}
          {assetEntries.map(([id, asset], idx) => {
            const pts = buildAssetPoints(asset.history);
            if (pts.length < 2) return null;
            return (
              <Polyline key={id} points={pts.join(' ')} fill="none"
                stroke={ASSET_COLORS[idx % ASSET_COLORS.length]} strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round" />
            );
          })}
        </Svg>
        {/* Asset values list */}
        <View style={{ marginTop: spacing.sm }}>
          {assetEntries.map(([id, asset], idx) => {
            // Current interpolated value
            let curAssetVal = asset.history[0];
            if (currentYear > 0) {
              const prevIdx = currentYear - 1;
              const nextIdx = Math.min(currentYear, years);
              if (asset.history[nextIdx] !== undefined) {
                curAssetVal = asset.history[prevIdx] + (asset.history[nextIdx] - asset.history[prevIdx]) * animProgress;
              }
            }
            const assetChange = curAssetVal - asset.history[0];
            const assetChangePct = asset.history[0] > 0 ? ((assetChange / asset.history[0]) * 100).toFixed(1) : '0.0';
            const assetPos = assetChange >= 0;
            return (
              <View key={id} style={styles.assetValueRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ASSET_COLORS[idx % ASSET_COLORS.length], marginRight: 6 }} />
                  <Text style={{ fontSize: fontSize.xs, color: colors.textPrimary, fontWeight: '500' }}>{asset.icon} {asset.name}</Text>
                  <Text style={{ fontSize: 9, color: colors.textLight, marginLeft: 4 }}>({asset.percentage}%)</Text>
                </View>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.textPrimary }}>
                  {fmt(Math.round(curAssetVal))}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: assetPos ? colors.success : colors.danger, marginLeft: 6, width: 50, textAlign: 'right' }}>
                  {assetPos ? '+' : ''}{assetChangePct}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (!simData) return (
    <View style={[styles.container, styles.center]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📊</Text>
      <Text style={styles.loadTitle}>Running simulation...</Text>
      <Text style={styles.loadSub}>Generating {years} years of market data</Text>
    </View>
  );

  // Live values
  const curVal = (() => {
    if (currentYear === 0) return totalBudget;
    const prevIdx = currentYear - 1;
    const nextIdx = Math.min(currentYear, years);
    return Math.round(simData.portfolioHistory[prevIdx] + (simData.portfolioHistory[nextIdx] - simData.portfolioHistory[prevIdx]) * animProgress);
  })();
  const change = curVal - totalBudget;
  const changePct = ((change / totalBudget) * 100).toFixed(1);
  const pos = change >= 0;
  const reinvestAmount = Math.round(totalBudget * 0.05);
  const yearEndAllocTotal = Object.values(yearEndAllocation).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Simulation</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.sm }}>
          <Text style={{ fontSize: fontSize.md, color: 'rgba(255,255,255,0.6)', marginRight: spacing.sm }}>Year</Text>
          <Text style={{ fontSize: 38, fontWeight: '800', color: colors.accent }}>{currentYear}</Text>
          <Text style={{ fontSize: fontSize.lg, color: 'rgba(255,255,255,0.5)', marginLeft: spacing.xs }}>/ {years}</Text>
          <View style={{ marginLeft: spacing.md, backgroundColor: pos ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.25)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.full }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: pos ? '#2ECC71' : '#E74C3C' }}>
              {pos ? '+' : ''}{changePct}%
            </Text>
          </View>
        </View>
        <View style={styles.progBar}>
          <Animated.View style={[styles.progFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }} showsVerticalScrollIndicator={false}>
        {/* Portfolio value card */}
        <View style={styles.valueCard}>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>Your Portfolio</Text>
          <Text style={styles.valueAmt}>CHF {fmt(curVal)}</Text>
          <Text style={[styles.valueChange, { color: pos ? colors.success : colors.danger }]}>
            {pos ? '+' : ''}{fmt(change)} ({pos ? '+' : ''}{changePct}%)
          </Text>
        </View>

        {/* Main chart (Investor / Saver / Trader) */}
        {renderChart()}

        {/* Year performance */}
        {currentYear > 0 && simData.yearlyData[currentYear - 1] && (
          <View style={styles.yearInfo}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary }}>Year {currentYear}</Text>
            <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: simData.yearlyData[currentYear - 1].yearReturn >= 0 ? colors.success : colors.danger }}>
              {simData.yearlyData[currentYear - 1].yearReturn >= 0 ? '📈' : '📉'} {(simData.yearlyData[currentYear - 1].yearReturn * 100).toFixed(1)}%
            </Text>
          </View>
        )}

        {/* Individual Asset Performance Chart */}
        {renderAssetChart()}

        {complete ? (
          <TouchableOpacity style={styles.resultsBtn} onPress={() => navigation.replace('Results', { email, simData })} activeOpacity={0.85}>
            <Text style={styles.resultsBtnText}>🏆  See Your Results</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md }}>
            <Text style={{ fontSize: 16, marginRight: spacing.sm }}>{activeModal || showYearEnd || showYearIntro ? '⏸️' : '▶️'}</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{activeModal || showYearEnd ? 'Event paused...' : showYearIntro ? 'Starting year...' : 'Simulating...'}</Text>
          </View>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* ====== YEAR INTRO OVERLAY ====== */}
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

      {/* ====== YEAR-END POPUP ====== */}
      <Modal visible={showYearEnd} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.yearEndCard, { transform: [{ translateY: yearEndSlide }] }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
              <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: spacing.sm }}>🎉</Text>
              <Text style={styles.yearEndTitle}>Year {yearEndYear} Complete!</Text>
              <Text style={styles.yearEndSubtitle}>
                Portfolio: CHF {fmt(simData?.portfolioHistory?.[yearEndYear] || 0)}
              </Text>
              <View style={styles.yearEndDivider} />
              <Text style={styles.yearEndInfoTitle}>📥 Annual Investment</Text>
              <Text style={styles.yearEndInfoText}>
                5% of your initial capital ({'\n'}CHF {fmt(reinvestAmount)}) will be invested for the next year.
              </Text>
              <View style={styles.yearEndChoiceRow}>
                <TouchableOpacity
                  style={[styles.yearEndChoiceBtn, !wantsRealloc && styles.yearEndChoiceBtnActive]}
                  onPress={() => setWantsRealloc(false)} activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>✅</Text>
                  <Text style={[styles.yearEndChoiceText, !wantsRealloc && { color: colors.textOnDark }]}>Keep Allocation</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.yearEndChoiceBtn, wantsRealloc && styles.yearEndChoiceBtnActive]}
                  onPress={() => setWantsRealloc(true)} activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>⚙️</Text>
                  <Text style={[styles.yearEndChoiceText, wantsRealloc && { color: colors.textOnDark }]}>Adjust</Text>
                </TouchableOpacity>
              </View>
              {wantsRealloc && (
                <View style={styles.yearEndAllocSection}>
                  <Text style={{ fontSize: fontSize.xs, color: colors.textLight, marginBottom: spacing.sm, textAlign: 'center' }}>
                    Allocate CHF {fmt(reinvestAmount)} for year {yearEndYear + 1}:
                  </Text>
                  <View style={styles.allocBarSmall}>
                    <View style={[styles.allocFillSmall, { width: `${yearEndAllocTotal}%`, backgroundColor: yearEndAllocTotal === 100 ? colors.success : colors.accent }]} />
                  </View>
                  <Text style={{ fontSize: 10, color: yearEndAllocTotal === 100 ? colors.success : colors.textLight, textAlign: 'right', marginBottom: spacing.sm }}>{yearEndAllocTotal}%</Text>
                  {yearEndAssets.map(asset => (
                    <View key={asset.id} style={styles.yearEndAssetRow}>
                      <Text style={{ fontSize: 16, marginRight: 6 }}>{asset.icon}</Text>
                      <Text style={{ flex: 1, fontSize: fontSize.xs, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>{asset.name}</Text>
                      <TouchableOpacity style={styles.yearEndAllocBtn} onPress={() => adjustYearEnd(asset.id, -5)}>
                        <Text style={styles.yearEndAllocBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={{ width: 38, textAlign: 'center', fontSize: fontSize.xs, fontWeight: '700', color: yearEndAllocation[asset.id] > 0 ? colors.primary : colors.textLight }}>
                        {yearEndAllocation[asset.id] || 0}%
                      </Text>
                      <TouchableOpacity style={[styles.yearEndAllocBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => adjustYearEnd(asset.id, 5)}>
                        <Text style={[styles.yearEndAllocBtnText, { color: colors.textOnDark }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.yearEndContinueBtn} onPress={dismissYearEnd} activeOpacity={0.85}>
                <Text style={styles.yearEndContinueBtnText}>Continue →</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* TIP Modal */}
      <Modal visible={activeModal?.type === 'tip'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalBadge}>💡 TIP</Text>
            <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>{activeModal?.data?.icon}</Text>
            <Text style={styles.modalTitle}>{activeModal?.data?.title}</Text>
            <Text style={styles.modalText}>{activeModal?.data?.text}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={dismissModal}>
              <Text style={styles.modalBtnText}>Got it! 👍</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QUIZ Modal */}
      <Modal visible={activeModal?.type === 'quiz'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalBadge}>🧠 QUIZ</Text>
              <Text style={styles.quizQuestion}>{activeModal?.data?.question}</Text>
              {activeModal?.data?.options?.map((opt, i) => {
                let optStyle = styles.quizOption;
                let textStyle = styles.quizOptionText;
                if (quizAnswer !== null) {
                  if (i === activeModal.data.correct) {
                    optStyle = [styles.quizOption, styles.quizCorrect];
                    textStyle = [styles.quizOptionText, { color: '#155724' }];
                  } else if (i === quizAnswer) {
                    optStyle = [styles.quizOption, styles.quizWrong];
                    textStyle = [styles.quizOptionText, { color: '#721C24' }];
                  }
                }
                return (
                  <TouchableOpacity key={i} style={optStyle} onPress={() => { if (quizAnswer === null) setQuizAnswer(i); }}
                    disabled={quizAnswer !== null} activeOpacity={0.7}>
                    <Text style={[{ fontWeight: '700', marginRight: 8, color: colors.primary, width: 20 }, quizAnswer !== null && i === activeModal.data.correct && { color: '#155724' }]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                    <Text style={textStyle}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
              {quizAnswer !== null && (
                <View style={[styles.feedbackBox, quizAnswer === activeModal?.data?.correct ? { backgroundColor: '#D4EDDA' } : { backgroundColor: '#F8D7DA' }]}>
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>{quizAnswer === activeModal?.data?.correct ? '✅' : '❌'}</Text>
                  <Text style={styles.feedbackText}>{activeModal?.data?.explanation}</Text>
                </View>
              )}
              {quizAnswer !== null && (
                <TouchableOpacity style={styles.modalBtn} onPress={dismissModal}>
                  <Text style={styles.modalBtnText}>Continue →</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* DECISION Modal */}
      <Modal visible={activeModal?.type === 'decision'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
            <View style={styles.modalCard}>
              <Text style={[styles.modalBadge, { backgroundColor: '#FFE0E0', color: colors.danger }]}>⚡ DECISION</Text>
              <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>{activeModal?.data?.icon}</Text>
              <Text style={styles.modalTitle}>{activeModal?.data?.title}</Text>
              <Text style={styles.modalText}>{activeModal?.data?.description}</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary, alignSelf: 'flex-start', marginBottom: spacing.sm }}>What do you do?</Text>
              {activeModal?.data?.options?.map((opt, i) => {
                let optStyle = styles.decisionOption;
                if (decisionChosen !== null && i === decisionChosen) {
                  const isGood = opt.effect >= 0;
                  optStyle = [styles.decisionOption, { borderColor: isGood ? colors.success : colors.danger, backgroundColor: isGood ? '#D4EDDA' : '#F8D7DA' }];
                }
                return (
                  <TouchableOpacity key={i} style={optStyle}
                    onPress={() => { if (decisionChosen === null) setDecisionChosen(i); }}
                    disabled={decisionChosen !== null} activeOpacity={0.7}>
                    <Text style={styles.decisionOptionText}>{opt.text}</Text>
                    {decisionChosen === i && (
                      <Text style={[styles.decisionEffect, { color: opt.effect >= 0 ? colors.success : colors.danger }]}>
                        {opt.effect > 0 ? '+' : ''}{(opt.effect * 100).toFixed(0)}% Portfolio Effect
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              {decisionChosen !== null && (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackText}>{activeModal?.data?.options[decisionChosen]?.feedback}</Text>
                  <View style={[styles.lessonBox, { marginTop: spacing.sm }]}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.warning }}>💡 Lesson:</Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.textPrimary, marginTop: 2 }}>{activeModal?.data?.lesson}</Text>
                  </View>
                </View>
              )}
              {decisionChosen !== null && (
                <TouchableOpacity style={styles.modalBtn} onPress={dismissModal}>
                  <Text style={styles.modalBtnText}>Continue →</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MARKET EVENT Modal */}
      <Modal visible={activeModal?.type === 'event'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalBadge, { backgroundColor: '#E8E0FF', color: '#6B46C1' }]}>📰 MARKET EVENT</Text>
            <Text style={{ fontSize: 44, marginBottom: spacing.sm }}>{activeModal?.data?.icon}</Text>
            <Text style={styles.modalTitle}>{activeModal?.data?.title}</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textLight, marginBottom: spacing.md }}>📅 Year {currentYear}</Text>
            <Text style={styles.modalText}>{activeModal?.data?.description}</Text>
            <View style={styles.lessonBox}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.warning, marginBottom: 4 }}>💡 Lesson:</Text>
              <Text style={{ fontSize: fontSize.md, color: colors.textPrimary, lineHeight: 22 }}>{activeModal?.data?.lesson}</Text>
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={dismissModal}>
              <Text style={styles.modalBtnText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
  loadSub: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
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
  yearInfo: {
    backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm, ...shadows.card,
  },
  assetValueRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 4,
    borderBottomWidth: 0.5, borderBottomColor: colors.border,
  },
  resultsBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.full, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md, ...shadows.button },
  resultsBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnAccent },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', maxWidth: 340, alignItems: 'center', alignSelf: 'center', ...shadows.card },
  modalBadge: {
    backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: fontSize.xs, fontWeight: '800',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full,
    letterSpacing: 1, marginBottom: spacing.md, overflow: 'hidden',
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  modalText: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  modalBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 12, paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  modalBtnText: { color: colors.textOnDark, fontSize: fontSize.md, fontWeight: '600' },
  quizQuestion: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.md },
  quizOption: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    backgroundColor: colors.background, borderRadius: borderRadius.md,
    padding: spacing.sm, marginBottom: 6,
    borderWidth: 1.5, borderColor: colors.border,
  },
  quizCorrect: { backgroundColor: '#D4EDDA', borderColor: colors.success },
  quizWrong: { backgroundColor: '#F8D7DA', borderColor: colors.danger },
  quizOptionText: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary, lineHeight: 18 },
  decisionOption: {
    width: '100%', backgroundColor: colors.background, borderRadius: borderRadius.md,
    padding: spacing.sm, marginBottom: 6,
    borderWidth: 1.5, borderColor: colors.border,
  },
  decisionOptionText: { fontSize: fontSize.sm, color: colors.textPrimary, lineHeight: 20 },
  decisionEffect: { fontSize: fontSize.xs, fontWeight: '700', marginTop: 4 },
  feedbackBox: {
    width: '100%', backgroundColor: '#F0F9FF', borderRadius: borderRadius.md,
    padding: spacing.sm, marginTop: spacing.sm, alignItems: 'center',
  },
  feedbackText: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  lessonBox: { backgroundColor: '#FFF8E1', borderRadius: borderRadius.sm, padding: spacing.sm, width: '100%' },

  // Year intro
  yearIntroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 76, 83, 0.92)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  yearIntroLabel: {
    fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.6)',
    letterSpacing: 6, textTransform: 'uppercase', marginBottom: spacing.xs,
  },
  yearIntroNumber: {
    fontSize: 96, fontWeight: '900', color: colors.accent,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12,
  },
  yearIntroDivider: { width: 40, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginVertical: spacing.sm },
  yearIntroSub: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  // Year-end popup
  yearEndCard: {
    backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg, width: '100%', maxHeight: SCREEN_H * 0.8,
    position: 'absolute', bottom: 0, ...shadows.card,
  },
  yearEndTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  yearEndSubtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  yearEndDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  yearEndInfoTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  yearEndInfoText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },
  yearEndChoiceRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  yearEndChoiceBtn: {
    flex: 1, backgroundColor: colors.background, borderRadius: borderRadius.md,
    paddingVertical: spacing.md, alignItems: 'center',
    borderWidth: 2, borderColor: colors.border,
  },
  yearEndChoiceBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  yearEndChoiceText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  yearEndAllocSection: { backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  yearEndAssetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  yearEndAllocBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  yearEndAllocBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, lineHeight: 18 },
  allocBarSmall: { height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 2 },
  allocFillSmall: { height: '100%', borderRadius: 3 },
  yearEndContinueBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 14, alignItems: 'center', ...shadows.button },
  yearEndContinueBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnDark },
});
