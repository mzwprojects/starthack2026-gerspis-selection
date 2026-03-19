import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, Platform, TextInput, Alert, ActivityIndicator, Modal
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';
import { api } from '../api';

export default function GameSetupScreen({ navigation, route }) {
  const userEmail = route.params?.email || '';
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState(10);
  const [budget, setBudget] = useState('20000');
  const [allocation, setAllocation] = useState({});
  const [infoAsset, setInfoAsset] = useState(null); // for info popup

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAssets();
        setAssets(data.assets);
        const init = {};
        data.assets.forEach(a => { init[a.id] = 0; });
        setAllocation(init);
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
          {[5, 10, 15, 20, 25, 30].map(y => (
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
        {categories.map(cat => (
          <View key={cat}>
            <Text style={styles.catTitle}>{cat}</Text>
            {assets.filter(a => a.category === cat).map(asset => (
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
        ))}
        <TouchableOpacity style={[styles.startBtn, totalAlloc < 100 && { opacity: 0.5 }]} onPress={start} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>🚀  Start Simulation</Text>
        </TouchableOpacity>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Info Modal */}
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
  catTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary, marginTop: spacing.md, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  assetCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  assetName: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  riskText: { fontSize: fontSize.xs, fontWeight: '700' },
  allocRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  allocBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  allocBtnText: { fontSize: 22, fontWeight: '600', color: colors.textPrimary, lineHeight: 24 },
  allocValue: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textLight },
  startBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.full, paddingVertical: 18, alignItems: 'center', marginTop: spacing.xl, ...shadows.button },
  startBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnAccent },
  // Info button
  infoBtn: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  infoBtnText: { fontSize: 9, fontWeight: '700', color: colors.textOnDark, letterSpacing: 0.3 },
  // Info modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', maxWidth: 360, alignItems: 'center', ...shadows.card },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  modalCategoryBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full, marginBottom: spacing.md },
  modalCategoryText: { fontSize: fontSize.xs, fontWeight: '700' },
  modalInfoText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22, textAlign: 'left' },
  modalBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 12, paddingHorizontal: spacing.xl, marginTop: spacing.md },
  modalBtnText: { color: colors.textOnDark, fontSize: fontSize.md, fontWeight: '600' },
});
