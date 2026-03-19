import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, Platform, TextInput, Alert, ActivityIndicator, Modal, LayoutAnimation, UIManager
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';
import { api } from '../api';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Category info descriptions — written for 16-36 yr olds
const CATEGORY_INFO = {
  'Equity Index': {
    icon: '📊',
    title: 'Equity Index',
    text: 'Think of it like a "best of" playlist — but for stocks. An index bundles the top companies of a country or region into one package (e.g. the SMI has Nestlé, Roche, Novartis...). Instead of betting on one company, you spread your money across many.\n\nVolatility is moderate (~17-23%) because when one stock drops, another might rise — they balance each other out. It\'s like a team sport: one bad player doesn\'t lose the game.',
  },
  'Single Stock': {
    icon: '🎯',
    title: 'Single Stock',
    text: 'This is buying shares of ONE specific company — like owning a tiny piece of Apple or Nestlé. If the company does great, you win big. If it tanks, you lose big. Simple as that.\n\nVolatility is higher (~17-51%) because everything depends on that single company. No safety net, no teammates. NVIDIA for example can swing 50% in a year — that\'s a wild ride! 🎢',
  },
  'Bonds': {
    icon: '📄',
    title: 'Bonds',
    text: 'Imagine lending money to a government or big company — and they pay you back with interest. That\'s basically what a bond is. It\'s like being the bank instead of borrowing from one.\n\nVolatility is super low (~3%) because the interest payments are fixed in the contract. The stock market could crash and your bond still pays you. That\'s why it\'s the "safe but boring" option.',
  },
  'Currency': {
    icon: '💱',
    title: 'Currency',
    text: 'This is trading one currency against another — like betting whether the dollar gets stronger or weaker vs. the Swiss franc. Every time you buy something abroad or travel, you\'re affected by exchange rates.\n\nVolatility is moderate (~9-12%) because currencies move based on what central banks decide, trade deals, and global events. The Swiss Franc is considered a "safe haven" — it tends to get stronger in crises.',
  },
  'Commodity': {
    icon: '🥇',
    title: 'Commodity',
    text: 'Commodities are real, physical stuff you can touch — like gold, oil, or wheat. Gold has been valuable for thousands of years and people buy it when they\'re scared about the economy.\n\nVolatility is moderate (~18%) because prices depend on how much people want it vs. how much is available. During crises, gold often goes UP because everyone rushes to "safe" assets. 🏃‍♂️',
  },
  'Crypto': {
    icon: '🪙',
    title: 'Crypto',
    text: 'Digital money that exists only on the internet — no bank, no government controls it. Bitcoin and Ethereum are the biggest ones. It\'s new, exciting, and super unpredictable.\n\nVolatility is EXTREME (~70-75%) 🤯 because the market is still young and mostly driven by hype, tweets, and FOMO rather than real company profits. It can double or halve in weeks. Only invest what you\'re okay losing!',
  },
};

export default function GameSetupScreen({ navigation, route }) {
  const userEmail = route.params?.email || '';
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState(10);
  const [budget, setBudget] = useState('20000');
  const [allocation, setAllocation] = useState({});
  const [infoAsset, setInfoAsset] = useState(null);
  const [infoCat, setInfoCat] = useState(null); // category info popup
  const [expandedCats, setExpandedCats] = useState({}); // collapsed/expanded categories

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAssets();
        setAssets(data.assets);
        const init = {};
        data.assets.forEach(a => { init[a.id] = 0; });
        setAllocation(init);
        // Start with all categories expanded
        const cats = {};
        data.assets.forEach(a => { cats[a.category] = true; });
        setExpandedCats(cats);
      } catch (e) { Alert.alert('Error', 'Could not load assets.'); }
      setLoading(false);
    })();
  }, []);

  const totalAlloc = Object.values(allocation).reduce((a, b) => a + b, 0);

  const adjust = (id, delta) => {
    setAllocation(prev => {
      const cur = prev[id] || 0;
      const nv = Math.max(0, Math.min(100, cur + delta));
      if (totalAlloc - cur + nv > 100) return prev;
      return { ...prev, [id]: nv };
    });
  };

  const toggleCategory = (cat) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const start = () => {
    if (totalAlloc < 100) { Alert.alert('Incomplete', `${100 - totalAlloc}% left to allocate!`); return; }
    const b = parseInt(budget);
    if (!b || b < 1000) { Alert.alert('Invalid Budget', 'Enter at least CHF 1,000.'); return; }
    navigation.navigate('Simulation', { email: userEmail, years, totalBudget: b, allocation });
  };

  const riskColor = (r) => r === 'Low' ? colors.success : r === 'Medium' ? colors.warning : r === 'High' ? colors.danger : '#8E44AD';
  const categories = [...new Set(assets.map(a => a.category))];

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Set Up Your Portfolio 🎮</Text>
        <Text style={{ fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Choose your investments wisely!</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Investment Horizon</Text>
        <Text style={styles.sectionSub}>How many years do you want to invest?</Text>
        <View style={styles.yearRow}>
          {[3, 15, 20, 25, 30].map(y => (
            <TouchableOpacity key={y} style={[styles.yearChip, years === y && styles.yearChipActive]} onPress={() => setYears(y)}>
              <Text style={[styles.yearChipText, years === y && { color: colors.textOnDark }]}>{y}y</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Starting Capital (CHF)</Text>
        <View style={styles.budgetRow}>
          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary, marginRight: spacing.sm }}>CHF</Text>
          <TextInput style={styles.budgetInput} value={budget} onChangeText={setBudget} keyboardType="numeric" />
        </View>
        <View style={{ marginBottom: spacing.lg }}>
          <View style={styles.allocBar}>
            <View style={[styles.allocFill, { width: `${totalAlloc}%`, backgroundColor: totalAlloc === 100 ? colors.success : colors.accent }]} />
          </View>
          <Text style={[styles.allocText, totalAlloc === 100 && { color: colors.success }]}>{totalAlloc}% / 100% allocated</Text>
        </View>

        {categories.map(cat => {
          const isExpanded = expandedCats[cat];
          const catAssets = assets.filter(a => a.category === cat);
          const catAlloc = catAssets.reduce((sum, a) => sum + (allocation[a.id] || 0), 0);
          return (
            <View key={cat} style={styles.catSection}>
              <View style={styles.catHeaderRow}>
                <TouchableOpacity style={styles.catTitleRow} onPress={() => toggleCategory(cat)} activeOpacity={0.7}>
                  <Text style={styles.catChevron}>{isExpanded ? '▲' : '▼'}</Text>
                  <Text style={styles.catTitle}>{cat}</Text>
                  {catAlloc > 0 && (
                    <View style={styles.catAllocBadge}>
                      <Text style={styles.catAllocText}>{catAlloc}%</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.catInfoBtn}
                  onPress={() => setInfoCat(cat)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.catInfoBtnText}>❓</Text>
                </TouchableOpacity>
              </View>

              {isExpanded && catAssets.map(asset => (
                <View key={asset.id} style={styles.assetCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                    <Text style={{ fontSize: 28, marginRight: spacing.sm }}>{asset.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.assetName}>{asset.name}</Text>
                        <TouchableOpacity
                          style={styles.infoBtn}
                          onPress={() => setInfoAsset(asset)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.infoBtnText}>Info</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={[styles.riskBadge, { backgroundColor: riskColor(asset.riskLevel) + '20' }]}>
                      <Text style={[styles.riskText, { color: riskColor(asset.riskLevel) }]}>{asset.riskLevel}</Text>
                    </View>

                  </View>
                  <View style={styles.allocRow}>
                    <TouchableOpacity style={styles.allocBtn} onPress={() => adjust(asset.id, -5)}>
                      <Text style={styles.allocBtnText}>−</Text>
                    </TouchableOpacity>
                    <View style={{ width: 60, alignItems: 'center' }}>
                      <Text style={[styles.allocValue, allocation[asset.id] > 0 && { color: colors.primary }]}>{allocation[asset.id] || 0}%</Text>
                    </View>
                    <TouchableOpacity style={[styles.allocBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => adjust(asset.id, 5)}>
                      <Text style={[styles.allocBtnText, { color: colors.textOnDark }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {/* ====== RISK PROFILE ====== */}
        {totalAlloc > 0 && (() => {
          // Map riskLevel string to numeric score
          const riskMap = { 'Low': 0.15, 'Medium': 0.35, 'High': 0.65, 'Very High': 0.9 };
          // Calculate weighted risk score from allocated assets
          let weightedRisk = 0;
          let totalWeight = 0;
          assets.forEach(a => {
            const w = allocation[a.id] || 0;
            if (w > 0) {
              weightedRisk += w * (riskMap[a.riskLevel] || 0.5);
              totalWeight += w;
            }
          });
          const riskScore = totalWeight > 0 ? Math.min(1, weightedRisk / totalWeight) : 0;
          // Color: green (0) → yellow (0.5) → red (1)
          const r = riskScore < 0.5 ? Math.round(riskScore * 2 * 255) : 255;
          const g = riskScore < 0.5 ? 200 : Math.round((1 - (riskScore - 0.5) * 2) * 200);
          const barColor = `rgb(${r}, ${g}, 30)`;
          const riskLabel = riskScore < 0.2 ? 'Very Low Risk 🛡️'
            : riskScore < 0.35 ? 'Low Risk 🟢'
            : riskScore < 0.5 ? 'Moderate Risk 🟡'
            : riskScore < 0.7 ? 'High Risk 🟠'
            : 'Very High Risk 🔴';
          const riskPct = Math.round(riskScore * 100);
          return (
            <View style={styles.riskProfileContainer}>
              <Text style={styles.riskProfileTitle}>Your Risk Profile</Text>
              <View style={styles.riskBarBg}>
                <View style={[styles.riskBarFill, { width: `${Math.max(5, riskPct)}%`, backgroundColor: barColor }]} />
              </View>
              <View style={styles.riskBarLabels}>
                <Text style={{ fontSize: fontSize.xs, color: colors.success, fontWeight: '600' }}>Safe</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.warning, fontWeight: '600' }}>Moderate</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.danger, fontWeight: '600' }}>Risky</Text>
              </View>
              <View style={[styles.riskLabelBadge, { backgroundColor: barColor + '25' }]}>
                <Text style={[styles.riskLabelText, { color: colors.textPrimary }]}>{riskLabel}</Text>
              </View>
            </View>
          );
        })()}

        <TouchableOpacity style={[styles.startBtn, totalAlloc < 100 && { opacity: 0.5 }]} onPress={start} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>🚀  Start Simulation</Text>
        </TouchableOpacity>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Asset Info Modal */}
      <Modal visible={!!infoAsset} transparent animationType="fade" onRequestClose={() => setInfoAsset(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>{infoAsset?.icon}</Text>
            <Text style={styles.modalTitle}>{infoAsset?.fullName || infoAsset?.name}</Text>
            <View style={[styles.modalCategoryBadge, { backgroundColor: riskColor(infoAsset?.riskLevel) + '15' }]}>
              <Text style={[styles.modalCategoryText, { color: riskColor(infoAsset?.riskLevel) }]}>
                {infoAsset?.category}  •  {infoAsset?.riskLevel} Risk
              </Text>
            </View>
            <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalInfoText}>{infoAsset?.infoText || infoAsset?.description}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setInfoAsset(null)}>
              <Text style={styles.modalBtnText}>Got it! 👍</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Info Modal */}
      <Modal visible={!!infoCat} transparent animationType="fade" onRequestClose={() => setInfoCat(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>{CATEGORY_INFO[infoCat]?.icon || '📁'}</Text>
            <Text style={styles.modalTitle}>{CATEGORY_INFO[infoCat]?.title || infoCat}</Text>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalInfoText}>{CATEGORY_INFO[infoCat]?.text || 'No info available.'}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setInfoCat(null)}>
              <Text style={styles.modalBtnText}>Got it! 👍</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  backText: { color: colors.textOnDark, fontSize: fontSize.md, marginBottom: spacing.sm },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textOnDark },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textPrimary, marginTop: spacing.md, marginBottom: 4 },
  sectionSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  yearChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  yearChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  yearChipText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  budgetRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, paddingHorizontal: spacing.md },
  budgetInput: { flex: 1, fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary, paddingVertical: 14 },
  allocBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  allocFill: { height: '100%', borderRadius: 4 },
  allocText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 6, textAlign: 'right', fontWeight: '600' },

  // Category section
  catSection: { marginBottom: spacing.sm },
  catHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.primary + '10', borderRadius: borderRadius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  catTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  catChevron: { fontSize: 12, color: colors.primary, marginRight: spacing.sm, fontWeight: '700' },
  catTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  catAllocBadge: {
    marginLeft: spacing.sm, backgroundColor: colors.primary,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full,
  },
  catAllocText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textOnDark },
  catInfoBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
    ...shadows.card,
  },
  catInfoBtnText: { fontSize: 16 },

  // Asset cards
  assetCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  assetName: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  assetArrow: { fontSize: 18, color: colors.textLight, marginLeft: spacing.sm },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  riskText: { fontSize: fontSize.xs, fontWeight: '700' },
  allocRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  allocBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  allocBtnText: { fontSize: 22, fontWeight: '600', color: colors.textPrimary, lineHeight: 24 },
  allocValue: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textLight },

  // Risk Profile
  riskProfileContainer: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginTop: spacing.xl, ...shadows.card,
  },
  riskProfileTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  riskBarBg: {
    height: 14, backgroundColor: colors.border, borderRadius: 7,
    overflow: 'hidden',
  },
  riskBarFill: { height: '100%', borderRadius: 7 },
  riskBarLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 6,
  },
  riskLabelBadge: {
    alignSelf: 'center', marginTop: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  riskLabelText: { fontSize: fontSize.md, fontWeight: '700' },

  startBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.full, paddingVertical: 18, alignItems: 'center', marginTop: spacing.xl, ...shadows.button },
  startBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnAccent },
  // Info button
  infoBtn: {
    marginLeft: 6, paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 4, backgroundColor: colors.primary,
  },
  infoBtnText: { fontSize: 9, fontWeight: '700', color: colors.textOnDark, letterSpacing: 0.3 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', maxWidth: 360, alignItems: 'center', ...shadows.card },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  modalCategoryBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full, marginBottom: spacing.md },
  modalCategoryText: { fontSize: fontSize.xs, fontWeight: '700' },
  modalInfoText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22, textAlign: 'left' },
  modalBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 12, paddingHorizontal: spacing.xl, marginTop: spacing.md },
  modalBtnText: { color: colors.textOnDark, fontSize: fontSize.md, fontWeight: '600' },
});
