import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, Platform, Animated, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';
import { api } from '../api';

export default function QuizScreen({ navigation, route }) {
  const userEmail = route.params?.email || '';
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [totalCoins, setTotalCoins] = useState(0);
  const [earnedThisRound, setEarnedThisRound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizComplete, setQuizComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [coinAnim] = useState(new Animated.Value(0));

  useEffect(() => { loadQuiz(); }, []);

  const loadQuiz = async () => {
    setLoading(true);
    try { const data = await api.getQuiz(); setQuestions(data.questions); }
    catch (e) { Alert.alert('Error', 'Could not load quiz.'); }
    setLoading(false);
  };

  const handleAnswer = async (answerIndex) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
    try {
      const data = await api.submitAnswer(questions[currentIndex].id, answerIndex);
      setResult(data);
      setTotalCoins(data.totalCoins);
      if (data.correct) {
        setCorrectCount(prev => prev + 1);
        setEarnedThisRound(prev => prev + data.coinsEarned);
        Animated.sequence([
          Animated.spring(coinAnim, { toValue: 1, useNativeDriver: true, tension: 100 }),
          Animated.timing(coinAnim, { toValue: 0, duration: 500, delay: 800, useNativeDriver: true }),
        ]).start();
      }
    } catch (e) { setResult({ correct: false, explanation: 'Could not verify.', correctAnswer: 0 }); }
  };

  const nextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setCurrentIndex(currentIndex + 1); setSelectedAnswer(null); setResult(null);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      await AsyncStorage.setItem('userCoins', String(totalCoins));
      setQuizComplete(true);
    }
  };

  if (loading) return (
    <View style={[styles.container, styles.center]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading quiz...</Text>
    </View>
  );

  if (quizComplete) return (
    <View style={[styles.container, styles.center]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <Text style={{ fontSize: 64, marginBottom: spacing.md }}>🎉</Text>
      <Text style={styles.completeTitle}>Quiz Complete!</Text>
      <Text style={styles.completeScore}>{correctCount}/{questions.length} correct</Text>
      <Text style={styles.completeCoins}>+{earnedThisRound} 🪙</Text>
      <Text style={{ fontSize: fontSize.md, color: colors.textLight, marginBottom: spacing.xl }}>Total: {totalCoins} coins</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );

  const q = questions[currentIndex];
  if (!q) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Quiz 🧠</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} /></View>
          <Text style={styles.progressText}>{currentIndex + 1}/{questions.length}</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.questionCard}><Text style={styles.questionText}>{q.question}</Text></View>
          {q.options.map((opt, i) => {
            let bg = colors.white, tc = colors.textPrimary, bc = colors.border;
            if (selectedAnswer !== null && result) {
              if (i === result.correctAnswer) { bg = colors.successLight; bc = colors.success; tc = '#155724'; }
              else if (i === selectedAnswer && !result.correct) { bg = colors.dangerLight; bc = colors.danger; tc = '#721C24'; }
            }
            return (
              <TouchableOpacity key={i} style={[styles.optionBtn, { backgroundColor: bg, borderColor: bc }]}
                onPress={() => handleAnswer(i)} disabled={selectedAnswer !== null} activeOpacity={0.7}>
                <Text style={[styles.optionLetter, { color: bc !== colors.border ? tc : colors.primary }]}>{String.fromCharCode(65 + i)}</Text>
                <Text style={[styles.optionText, { color: tc }]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
          {result && (
            <View style={[styles.explanationCard, result.correct ? { backgroundColor: colors.successLight } : { backgroundColor: colors.dangerLight }]}>
              <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>{result.correct ? '✅' : '❌'}</Text>
              <Text style={styles.explanationTitle}>{result.correct ? 'Correct! +10 🪙' : 'Not quite!'}</Text>
              <Text style={styles.explanationText}>{result.explanation}</Text>
              <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
                <Text style={styles.nextButtonText}>{currentIndex < questions.length - 1 ? 'Next Question →' : 'See Results 🎉'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
      <Animated.View pointerEvents="none" style={[styles.floatingCoin, {
        opacity: coinAnim,
        transform: [{ translateY: coinAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) },
          { scale: coinAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.3, 1] }) }],
      }]}><Text style={styles.floatingCoinText}>+10 🪙</Text></Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.md },
  header: {
    backgroundColor: colors.primary, paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: spacing.lg, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl,
  },
  backText: { color: colors.textOnDark, fontSize: fontSize.md, marginBottom: spacing.sm },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textOnDark },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  progressBar: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginRight: spacing.sm },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  progressText: { color: colors.accent, fontWeight: '600', fontSize: fontSize.sm },
  questionCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card },
  questionText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textPrimary, lineHeight: 26 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1.5, borderColor: colors.border, ...shadows.card,
  },
  optionLetter: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background,
    textAlign: 'center', lineHeight: 32, fontSize: fontSize.md, fontWeight: '700',
    marginRight: spacing.md, overflow: 'hidden',
  },
  optionText: { flex: 1, fontSize: fontSize.md, lineHeight: 22 },
  explanationCard: { borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.md, alignItems: 'center' },
  explanationTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm },
  explanationText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  nextButton: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 14, paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  nextButtonText: { color: colors.textOnDark, fontSize: fontSize.md, fontWeight: '600' },
  floatingCoin: {
    position: 'absolute', bottom: 100, alignSelf: 'center',
    backgroundColor: colors.accent, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, ...shadows.button,
  },
  floatingCoinText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnAccent },
  completeTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  completeScore: { fontSize: fontSize.xl, color: colors.textSecondary, marginBottom: spacing.sm },
  completeCoins: { fontSize: 32, fontWeight: '700', color: colors.accent, marginBottom: spacing.xs },
  backButton: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 14, paddingHorizontal: spacing.xl, ...shadows.button },
  backButtonText: { color: colors.textOnDark, fontSize: fontSize.lg, fontWeight: '600' },
});
