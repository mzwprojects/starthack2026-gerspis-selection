import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, Modal, Platform, Animated, Dimensions, LayoutAnimation, UIManager, ImageBackground
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';
import { api } from '../api';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const theoryTopics = [
  {
    id: 'compound',
    icon: '📈',
    title: 'Compound Interest',
    summary: 'Let your money grow money',
    text: 'Compound interest is the concept of earning interest on your interest. If you invest CHF 10,000 at 7% annual return, after 10 years you have CHF 19,672 — and after 30 years, CHF 76,123. The key insight is that growth accelerates over time. Albert Einstein reportedly called compound interest "the eighth wonder of the world." The earlier you start investing, the more powerful this effect becomes.',
  },
  {
    id: 'diversification',
    icon: '🎯',
    title: 'Diversification',
    summary: "Don't put all your eggs in one basket",
    text: 'Diversification means spreading your investments across different asset classes (stocks, bonds, commodities), geographies (US, Europe, Asia), and sectors (tech, healthcare, finance). The idea is that when one investment falls, others may rise, reducing your overall risk. Studies show that diversification can reduce portfolio risk by 30-50% without significantly reducing returns.',
  },
  {
    id: 'riskreturn',
    icon: '⚖️',
    title: 'Risk vs. Return',
    summary: 'Higher returns require accepting more risk',
    text: 'In investing, risk and return are fundamentally linked. Safe investments like savings accounts or government bonds offer low returns (0.5-3% annually). Stocks offer higher returns (7-10% average) but with more volatility. Crypto assets offer potentially 40%+ returns but with extreme volatility. The key is finding the right balance for your goals and risk tolerance.',
  },
  {
    id: 'timeinmarket',
    icon: '⏰',
    title: 'Time in the Market',
    summary: 'Patience beats timing',
    text: '"Time in the market beats timing the market" is one of the most important investing principles. Research shows that missing just the 10 best trading days over 20 years can cut your returns in half. Historical data shows that the S&P 500 has never lost money over any 20-year period, despite crashes along the way.',
  },
  {
    id: 'dca',
    icon: '💰',
    title: 'Dollar-Cost Averaging',
    summary: 'Invest regularly regardless of price',
    text: 'Dollar-cost averaging (DCA) means investing a fixed amount at regular intervals (e.g., CHF 500 per month), regardless of market conditions. When prices are low, you buy more shares; when prices are high, you buy fewer. Over time, this averages out your purchase price and reduces the impact of market volatility.',
  },
  {
    id: 'inflation',
    icon: '🔥',
    title: 'Inflation: The Silent Tax',
    summary: 'Why doing nothing costs you money',
    text: 'Inflation is the gradual increase in prices over time — typically 2% per year in Switzerland. At 2% inflation, CHF 10,000 today will only be worth CHF 8,171 in purchasing power after 10 years. Investing is not just about growing wealth — it\'s about protecting it from inflation.',
  },
];

export default function HomeScreen({ navigation, route }) {
  const userEmail = route.params?.email || '';
  const [coins, setCoins] = useState(0);
  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [expandedTopic, setExpandedTopic] = useState(null);
  const cardAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
    AsyncStorage.getItem('userCoins').then(c => { if (c) setCoins(parseInt(c)); });
    Animated.stagger(80, cardAnims.map((a, i) =>
      Animated.spring(a, { toValue: 1, delay: i * 100, useNativeDriver: true, tension: 50, friction: 7 })
    )).start();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      AsyncStorage.getItem('userCoins').then(c => { if (c) setCoins(parseInt(c)); });
    });
    return unsubscribe;
  }, [navigation]);

  const openTip = async () => {
    try {
      const data = await api.getTip();
      setCurrentTip(data.tip);
    } catch (e) {
      setCurrentTip({ icon: '💡', title: 'Start Early', text: 'The earlier you start investing, the more compound interest works in your favor.' });
    }
    setTipModalVisible(true);
  };

  const toggleTopic = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTopic(expandedTopic === id ? null : id);
  };

  const features = [
    { id: 'quiz', title: 'Daily Quiz', subtitle: 'Test your investing knowledge', icon: '🧠', bg: colors.primary, onPress: () => navigation.navigate('Quiz', { email: userEmail }) },
    { id: 'game', title: 'Start Game', subtitle: 'Sandbox investment simulation', icon: '🎮', bg: colors.accent, dark: true, onPress: () => navigation.navigate('GameSetup', { email: userEmail }) },
    { id: 'tip', title: 'Daily Tip', subtitle: 'Get a pro finance tip', icon: '💡', bg: '#2ECC71', onPress: openTip },
    { id: 'battle', title: 'Battle Mode', subtitle: 'Compete with friends in real-time!', icon: '⚔️', bg: '#8E44AD', onPress: () => navigation.navigate('Lobby', { email: userEmail }) },
  ];

  return (
    <ImageBackground source={require('../../assets/bull-bear-bg.png')} style={styles.container} resizeMode="cover" imageStyle={{ opacity: 0.15, transform: [{ translateY: 80 }] }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.email}>{userEmail}</Text>
          </View>
          <TouchableOpacity onPress={async () => { await AsyncStorage.clear(); navigation.replace('Login'); }} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.coinsRow}>
          <View style={styles.coinsBadge}>
            <Text style={{ fontSize: 18, marginRight: spacing.xs }}>🪙</Text>
            <Text style={styles.coinsText}>{coins} Coins</Text>
          </View>
          <View style={styles.pfLogoContainer}>
            <View style={styles.pfCross}>
              <View style={styles.pfCrossV} />
              <View style={styles.pfCrossH} />
            </View>
            <Text style={styles.pfLogoText}>PostFinance</Text>
          </View>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>What do you want to do?</Text>
        {features.map((f, i) => (
          <Animated.View key={f.id} style={{
            marginBottom: spacing.md,
            opacity: cardAnims[i],
            transform: [{ translateY: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
              { scale: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
          }}>
            <TouchableOpacity style={[styles.card, { backgroundColor: f.bg }, f.disabled && { opacity: 0.6 }]}
              onPress={f.onPress} disabled={f.disabled} activeOpacity={0.85}>
              <View style={styles.cardContent}>
                <Text style={{ fontSize: 36, marginRight: spacing.md }}>{f.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, f.dark && { color: colors.textPrimary }]}>{f.title}</Text>
                  <Text style={[styles.cardSubtitle, f.dark && { color: 'rgba(0,0,0,0.6)' }]}>{f.subtitle}</Text>
                </View>
                <Text style={[{ fontSize: 24, color: colors.textOnDark, fontWeight: '300' }, f.dark && { color: colors.textPrimary }]}>→</Text>
              </View>
              {f.disabled && <View style={styles.soonBadge}><Text style={styles.soonText}>SOON</Text></View>}
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* ====== LONG-TERM INVESTING THEORY SECTION ====== */}
        <View style={styles.theorySectionHeader}>
          <Text style={{ fontSize: 22, marginRight: spacing.sm }}>📚</Text>
          <View>
            <Text style={styles.theorySectionTitle}>Long-Term Investing</Text>
            <Text style={styles.theorySectionSub}>Deep theory knowledge for smart investors</Text>
          </View>
        </View>

        {theoryTopics.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={[styles.theoryCard, expandedTopic === topic.id && styles.theoryCardExpanded]}
            onPress={() => toggleTopic(topic.id)}
            activeOpacity={0.8}
          >
            <View style={styles.theoryCardHeader}>
              <Text style={{ fontSize: 24, marginRight: spacing.sm }}>{topic.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.theoryCardTitle}>{topic.title}</Text>
                <Text style={styles.theoryCardSummary}>{topic.summary}</Text>
              </View>
              <Text style={styles.theoryChevron}>{expandedTopic === topic.id ? '▲' : '▼'}</Text>
            </View>
            {expandedTopic === topic.id && (
              <View style={styles.theoryCardBody}>
                <View style={styles.theoryDivider} />
                <Text style={styles.theoryCardText}>{topic.text}</Text>
                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={() => navigation.navigate('TheoryDetail', { topicId: topic.id })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moreBtnText}>More →</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.mottoContainer}>
          <Text style={styles.mottoText}>"Investing isn't about being perfect.{'\n'}It's about starting."</Text>
        </View>
      </ScrollView>
      <Modal visible={tipModalVisible} transparent animationType="fade" onRequestClose={() => setTipModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {currentTip && (<>
              <Text style={{ fontSize: 48, marginBottom: spacing.md }}>{currentTip.icon}</Text>
              <Text style={styles.modalTitle}>{currentTip.title}</Text>
              <Text style={styles.modalText}>{currentTip.text}</Text>
            </>)}
            <TouchableOpacity style={styles.modalButton} onPress={() => setTipModalVisible(false)}>
              <Text style={styles.modalButtonText}>Got it! 👍</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary, paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: spacing.lg, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textOnDark },
  email: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  logoutText: { color: colors.textOnDark, fontSize: fontSize.sm, fontWeight: '500' },
  coinsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,204,0,0.2)',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  coinsText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '600' },
  pfLogoContainer: { flexDirection: 'row', alignItems: 'center' },
  pfCross: { width: 18, height: 18, position: 'relative', marginRight: 4, transform: [{ rotate: '-8deg' }] },
  pfCrossV: { position: 'absolute', left: 5, top: 0, width: 8, height: 18, backgroundColor: '#FFCC00', borderRadius: 2.5 },
  pfCrossH: { position: 'absolute', left: 0, top: 5, width: 18, height: 8, backgroundColor: '#FFCC00', borderRadius: 2.5 },
  pfLogoText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  contentContainer: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.md },
  card: { borderRadius: borderRadius.lg, padding: spacing.lg, overflow: 'hidden', ...shadows.card },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textOnDark },
  cardSubtitle: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  soonBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  soonText: { fontSize: 10, fontWeight: '700', color: colors.textOnDark, letterSpacing: 1 },

  // Theory section
  theorySectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: spacing.xl, marginBottom: spacing.md,
    backgroundColor: colors.primary + '10', borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  theorySectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  theorySectionSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  theoryCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
    ...shadows.card,
  },
  theoryCardExpanded: { borderLeftColor: colors.accent },
  theoryCardHeader: { flexDirection: 'row', alignItems: 'center' },
  theoryCardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  theoryCardSummary: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 1 },
  theoryChevron: { fontSize: 12, color: colors.textLight, marginLeft: spacing.sm },
  theoryCardBody: { marginTop: spacing.sm },
  theoryDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.sm },
  theoryCardText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22 },
  moreBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  moreBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textOnDark },

  mottoContainer: { alignItems: 'center', marginTop: spacing.lg, paddingVertical: spacing.lg },
  mottoText: { fontSize: fontSize.md, color: colors.textLight, textAlign: 'center', fontStyle: 'italic', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, width: '100%', maxWidth: 340, alignItems: 'center', ...shadows.card },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  modalText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  modalButton: { backgroundColor: colors.accent, borderRadius: borderRadius.full, paddingVertical: 14, paddingHorizontal: spacing.xl, ...shadows.button },
  modalButtonText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textOnAccent },
});
