import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuthStore } from '../store/authStore';

const PAYSTACK_LINK = 'https://paystack.shop/pay/-acuh9o3d9';

const PLANS = [
  {
    id: 'weekly',
    label: 'Weekly VIP',
    price: '₦2,000',
    originalPrice: '₦4,000',
    discount: '50% OFF',
    description: 'First subscriber discount!',
    perks: ['Unlimited swipes', 'See who liked you', 'Unlimited video calls', 'Priority in discovery', 'No ads'],
    badge: '🔥 Best for starters',
    color: '#FF4B6E',
  },
  {
    id: 'monthly',
    label: 'Monthly VIP',
    price: '₦6,500',
    originalPrice: null,
    discount: null,
    description: 'Best value for serious daters',
    perks: ['Everything in Weekly', 'Boost profile 4x/month', 'Read receipts', 'Advanced filters', 'VIP badge on profile'],
    badge: '👑 Most Popular',
    color: '#8B5CF6',
  },
];

const DIAMOND_PACKS = [
  { id: 'd1', amount: 50, price: '₦500', bonus: '' },
  { id: 'd2', amount: 150, price: '₦1,200', bonus: '+20 bonus' },
  { id: 'd3', amount: 500, price: '₦3,500', bonus: '+100 bonus' },
  { id: 'd4', amount: 1000, price: '₦6,000', bonus: '+300 bonus' },
];

export default function PaymentScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<'vip' | 'diamonds'>('vip');

  const handlePay = async (planId: string, label: string, price: string) => {
    Alert.alert(
      `${label} - ${price}`,
      'You will be redirected to Paystack to complete payment securely.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now 💳',
          onPress: async () => {
            await Linking.openURL(PAYSTACK_LINK);
            Alert.alert(
              'Payment Initiated',
              'After payment, your VIP will be activated within minutes. Contact support if needed.',
              [
                {
                  text: 'I have paid',
                  onPress: async () => {
                    if (user) {
                      await updateDoc(doc(db, 'users', user.id), {
                        isPremium: true,
                        vipPlan: planId,
                        vipActivatedAt: new Date().toISOString(),
                      });
                      setUser({ ...user, isPremium: true });
                      Alert.alert('🎉 Welcome VIP!', 'Your VIP is now active!');
                      router.back();
                    }
                  }
                },
                { text: 'Close', style: 'cancel' }
              ]
            );
          }
        }
      ]
    );
  };

  const handleDiamondPay = (amount: number, price: string) => {
    Alert.alert(
      `Buy ${amount} 💎 Diamonds`,
      `Pay ${price} via Paystack`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now 💳',
          onPress: async () => {
            await Linking.openURL(PAYSTACK_LINK);
            Alert.alert('Diamonds', 'After payment your diamonds will be credited within minutes!');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Go Premium 👑</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'vip' && styles.tabActive]}
          onPress={() => setTab('vip')}
        >
          <Text style={[styles.tabText, tab === 'vip' && styles.tabTextActive]}>👑 VIP Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'diamonds' && styles.tabActive]}
          onPress={() => setTab('diamonds')}
        >
          <Text style={[styles.tabText, tab === 'diamonds' && styles.tabTextActive]}>💎 Diamonds</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'vip' ? (
          <>
            <Text style={styles.sectionTitle}>Choose your plan</Text>
            {PLANS.map(plan => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, selected === plan.id && styles.planSelected, { borderColor: plan.color }]}
                onPress={() => setSelected(plan.id)}
              >
                <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
                <View style={styles.planTop}>
                  <View>
                    <Text style={styles.planLabel}>{plan.label}</Text>
                    <Text style={styles.planDesc}>{plan.description}</Text>
                  </View>
                  <View style={styles.planPriceBox}>
                    {plan.originalPrice && (
                      <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                    )}
                    <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                    {plan.discount && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{plan.discount}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.perks}>
                  {plan.perks.map(perk => (
                    <Text key={perk} style={styles.perk}>✅ {perk}</Text>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.payBtn, { backgroundColor: plan.color }]}
                  onPress={() => handlePay(plan.id, plan.label, plan.price)}
                >
                  <Text style={styles.payBtnText}>Subscribe {plan.price} →</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Buy Diamonds 💎</Text>
            <Text style={styles.sectionSub}>Use diamonds to send gifts and super likes</Text>
            {DIAMOND_PACKS.map(pack => (
              <TouchableOpacity
                key={pack.id}
                style={styles.diamondCard}
                onPress={() => handleDiamondPay(pack.amount, pack.price)}
              >
                <Text style={styles.diamondIcon}>💎</Text>
                <View style={styles.diamondInfo}>
                  <Text style={styles.diamondAmount}>{pack.amount} Diamonds {pack.bonus && <Text style={styles.bonus}>{pack.bonus}</Text>}</Text>
                  <Text style={styles.diamondPrice}>{pack.price}</Text>
                </View>
                <TouchableOpacity
                  style={styles.buyBtn}
                  onPress={() => handleDiamondPay(pack.amount, pack.price)}
                >
                  <Text style={styles.buyBtnText}>Buy</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={styles.secure}>
          <Text style={styles.secureText}>🔒 Secured by Paystack · Nigerian payment gateway</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  back: { fontSize: 18, color: '#FF4B6E', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: '#f0f0f0', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontSize: 14, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#333' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  sectionSub: { fontSize: 14, color: '#999', marginBottom: 16 },
  planCard: { borderWidth: 2, borderRadius: 16, padding: 16, marginBottom: 16, borderColor: '#ddd', position: 'relative', paddingTop: 36 },
  planSelected: { elevation: 4 },
  planBadge: { position: 'absolute', top: -1, left: 16, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  planBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  planLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  planDesc: { fontSize: 13, color: '#999', marginTop: 2 },
  planPriceBox: { alignItems: 'flex-end' },
  originalPrice: { fontSize: 13, color: '#999', textDecorationLine: 'line-through' },
  planPrice: { fontSize: 24, fontWeight: 'bold' },
  discountBadge: { backgroundColor: '#FF4B6E', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  discountText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  perks: { marginBottom: 16, gap: 6 },
  perk: { fontSize: 14, color: '#555' },
  payBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  diamondCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 12, gap: 12 },
  diamondIcon: { fontSize: 32 },
  diamondInfo: { flex: 1 },
  diamondAmount: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  bonus: { color: '#FF4B6E', fontSize: 13 },
  diamondPrice: { fontSize: 14, color: '#999', marginTop: 2 },
  buyBtn: { backgroundColor: '#FF4B6E', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  buyBtnText: { color: '#fff', fontWeight: 'bold' },
  secure: { alignItems: 'center', marginTop: 20 },
  secureText: { fontSize: 13, color: '#999' },
});
