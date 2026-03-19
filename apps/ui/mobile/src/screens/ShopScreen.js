import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Platform, ActivityIndicator, Alert, ImageBackground
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';
import { api } from '../api';

const AVATARS = [
  { id: '1', emoji: '🧢', name: 'Blue Cap', price: 0 },
  { id: '2', emoji: '🕶️', name: 'Cool Shades', price: 50 },
  { id: '3', emoji: '🤠', name: 'Cowboy Hat', price: 75 },
  { id: '4', emoji: '🪖', name: 'Helmet', price: 100 },
  { id: '5', emoji: '🎩', name: 'Top Hat', price: 150 },
  { id: '6', emoji: '👑', name: 'Crown', price: 500 },
];

export default function ShopScreen({ navigation, route }) {
  const userEmail = route.params?.email || '';
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [ownedAvatars, setOwnedAvatars] = useState([]);
  const [equippedAvatar, setEquippedAvatar] = useState('🧢');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const data = await api.getUser(userEmail);
      if (data && !data.error) {
        setCoins(data.coins);
        setOwnedAvatars(data.ownedAvatars || ['🧢']);
        setEquippedAvatar(data.avatar || '🧢');
        const eqIdx = AVATARS.findIndex(a => a.emoji === (data.avatar || '🧢'));
        if (eqIdx >= 0) setCurrentIndex(eqIdx);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not load shop data.');
    }
    setLoading(false);
  };

  const currentItem = AVATARS[currentIndex];
  const isOwned = ownedAvatars.includes(currentItem.emoji);
  const isEquipped = equippedAvatar === currentItem.emoji;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % AVATARS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + AVATARS.length) % AVATARS.length);
  };

  const handleAction = async () => {
    if (isEquipped) return;

    if (isOwned) {
      // Equip
      try {
        setLoading(true);
        const res = await api.updateAvatar(userEmail, currentItem.emoji, 0);
        if (res.success) {
          setEquippedAvatar(res.avatar);
          await AsyncStorage.setItem('equippedAvatar', res.avatar); // keep local in sync
        }
      } catch (e) {
        Alert.alert('Error', 'Could not equip avatar.');
      } finally {
        setLoading(false);
      }
    } else {
      // Buy
      if (coins < currentItem.price) {
        Alert.alert('Not enough coins', `You need ${currentItem.price} coins to buy this.`);
        return;
      }
      try {
        setLoading(true);
        const res = await api.updateAvatar(userEmail, currentItem.emoji, currentItem.price);
        if (res.success) {
          setCoins(res.coins);
          setOwnedAvatars(res.ownedAvatars);
          setEquippedAvatar(res.avatar);
          await AsyncStorage.setItem('userCoins', String(res.coins));
          await AsyncStorage.setItem('equippedAvatar', res.avatar);
          Alert.alert('Success', `You bought ${currentItem.name}!`);
        } else {
          Alert.alert('Error', res.error || 'Purchase failed.');
        }
      } catch (e) {
        Alert.alert('Error', 'Purchase failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ImageBackground source={require('../../assets/bull-bear-bg.png')} style={styles.container} resizeMode="cover" imageStyle={{ opacity: 0.1 }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avatar Shop</Text>
        <View style={styles.coinsBadge}>
          <Text style={{ fontSize: 16, marginRight: 4 }}>🪙</Text>
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.shopCard}>
            <Text style={styles.itemName}>{currentItem.name}</Text>

            <View style={styles.carousel}>
              <TouchableOpacity onPress={handlePrev} style={styles.arrowBtn}>
                <Text style={styles.arrowText}>←</Text>
              </TouchableOpacity>
              
              <View style={styles.avatarDisplay}>
                <Text style={styles.avatarEmoji}>{currentItem.emoji}</Text>
              </View>

              <TouchableOpacity onPress={handleNext} style={styles.arrowBtn}>
                <Text style={styles.arrowText}>→</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statusBox}>
              {isEquipped ? (
                <Text style={styles.equippedText}>✓ EQUIPPED</Text>
              ) : isOwned ? (
                <Text style={styles.ownedText}>IN INVENTORY</Text>
              ) : (
                <Text style={styles.priceText}>Cost: {currentItem.price} 🪙</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                isEquipped && styles.actionBtnDisabled,
                !isOwned && coins < currentItem.price && styles.actionBtnDisabled
              ]}
              onPress={handleAction}
              disabled={isEquipped || (!isOwned && coins < currentItem.price)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>
                {isEquipped ? 'Equipped' : isOwned ? 'Equip' : `Buy for ${currentItem.price} 🪙`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.card
  },
  backBtn: { paddingVertical: spacing.sm, paddingRight: spacing.md },
  backText: { color: colors.textOnDark, fontSize: fontSize.md, fontWeight: '600' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textOnDark, flex: 1, textAlign: 'center', marginRight: -20 },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,204,0,0.2)',
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full,
  },
  coinsText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  shopCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  itemName: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xl },
  carousel: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between', marginBottom: spacing.xl },
  arrowBtn: {
    backgroundColor: colors.background,
    width: 50, height: 50,
    borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border
  },
  arrowText: { fontSize: 24, color: colors.textSecondary },
  avatarDisplay: {
    width: 140, height: 140,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 70,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: colors.primaryLight
  },
  avatarEmoji: { fontSize: 72 },
  statusBox: { marginBottom: spacing.lg, height: 30, justifyContent: 'center' },
  equippedText: { color: colors.success, fontSize: fontSize.md, fontWeight: '800', letterSpacing: 1 },
  ownedText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '700', letterSpacing: 1 },
  priceText: { color: colors.accentDark, fontSize: fontSize.lg, fontWeight: '800' },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
    width: '100%',
    alignItems: 'center',
    ...shadows.button
  },
  actionBtnDisabled: { backgroundColor: colors.textLight },
  actionBtnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700' }
});
