// GalliExpress Customer — Rate Order Screen

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';

const FOOD_TAGS = ['Too Spicy', 'Not Enough', 'Perfect Portion', 'Tasty', 'Fresh', 'Cold', 'Soggy', 'Packaging Issue'];
const DELIVERY_TAGS = ['On Time', 'Friendly Rider', 'Late', 'Called Before Arrival', 'No Contact'];

function StarRow({ label, value, onChange }) {
  return (
    <View style={styles.starSection}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onChange(star)}>
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={36}
              color={star <= value ? Colors.secondary : Colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.starDesc}>
        {value === 0 ? 'Tap to rate'
          : value === 1 ? 'Terrible 😞'
          : value === 2 ? 'Bad 😕'
          : value === 3 ? 'Okay 😐'
          : value === 4 ? 'Good 😊'
          : 'Excellent! 🤩'}
      </Text>
    </View>
  );
}

export default function RateOrderScreen({ navigation, route }) {
  const { order } = route.params;
  const user = auth().currentUser;

  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [shopRating, setShopRating] = useState(0);

  const [selectedFoodTags, setSelectedFoodTags] = useState([]);
  const [selectedDeliveryTags, setSelectedDeliveryTags] = useState([]);

  const [itemRatings, setItemRatings] = useState(
    Object.fromEntries((order?.items || []).map(i => [i.id, 0]))
  );

  const [packagingRating, setPackagingRating] = useState(null); // 'good' | 'bad' | null
  const [tipAmount, setTipAmount] = useState(null);   // 15 | 20 | 30 | 'other' | null
  const [customTip, setCustomTip] = useState('');

  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag, list, setList) => {
    setList(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const setItemRating = (itemId, val) => {
    setItemRatings(prev => ({ ...prev, [itemId]: val }));
  };

  const handleSubmit = async () => {
    if (foodRating === 0 && deliveryRating === 0 && shopRating === 0) {
      Alert.alert('Please Rate', 'Give at least one star rating to continue');
      return;
    }

    const resolvedTip = tipAmount === 'other'
      ? (parseInt(customTip, 10) || 0)
      : (tipAmount || 0);

    setLoading(true);
    try {
      const ratedFields = [foodRating, deliveryRating, shopRating].filter(r => r > 0);
      const overallRating = ratedFields.length
        ? Math.round(ratedFields.reduce((a, b) => a + b, 0) / ratedFields.length)
        : 0;

      const ratingData = {
        orderId: order.orderId,
        customerId: user.uid,
        shopId: order.shopId,
        riderId: order.riderId || null,
        foodRating,
        deliveryRating,
        shopRating,
        overallRating,
        packagingRating: packagingRating || null,
        riderTip: resolvedTip,
        foodTags: selectedFoodTags,
        deliveryTags: selectedDeliveryTags,
        itemRatings,
        review: review.trim() || null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        town: 'addanki',
      };

      // Save rating
      await firestore().collection('ratings').doc(order.orderId).set(ratingData);

      // Update shop average rating: read current sums, compute new average, write back
      const shopRef = firestore().collection('shops').doc(order.shopId);
      const shopSnap = await shopRef.get();
      const prevSum = shopSnap.data()?.ratingSum || 0;
      const prevCount = shopSnap.data()?.ratingCount || 0;
      const newSum = prevSum + ratingData.overallRating;
      const newCount = prevCount + 1;
      await shopRef.update({
        ratingCount: newCount,
        ratingSum: newSum,
        rating: parseFloat((newSum / newCount).toFixed(1)),
      });

      // Mark order as rated so the Rate button disappears in OrderHistory
      await firestore().collection('orders').doc(order.orderId).update({ rated: true });

      Alert.alert(
        'Thank You! 🎉',
        'Your feedback helps us serve Addanki better.',
        [{ text: 'Done', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] }) }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not submit rating. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Order Quick Info */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderInfoShop}>{order?.shopName}</Text>
          <Text style={styles.orderInfoId}>Order #{order?.orderId}</Text>
        </View>

        {/* Food Rating */}
        <View style={styles.card}>
          <StarRow label="🍽️ Food Quality" value={foodRating} onChange={setFoodRating} />
          {foodRating > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>What best describes the food?</Text>
              <View style={styles.tagsRow}>
                {FOOD_TAGS.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, selectedFoodTags.includes(tag) && styles.tagActive]}
                    onPress={() => toggleTag(tag, selectedFoodTags, setSelectedFoodTags)}
                  >
                    <Text style={[styles.tagText, selectedFoodTags.includes(tag) && styles.tagTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Packaging Rating */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 How was the packaging?</Text>
          <View style={styles.packagingRow}>
            <TouchableOpacity
              style={[styles.packBtn, packagingRating === 'good' && styles.packBtnGood]}
              onPress={() => setPackagingRating(packagingRating === 'good' ? null : 'good')}
            >
              <Text style={[styles.packBtnText, packagingRating === 'good' && styles.packBtnTextActive]}>👍 Good</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.packBtn, packagingRating === 'bad' && styles.packBtnBad]}
              onPress={() => setPackagingRating(packagingRating === 'bad' ? null : 'bad')}
            >
              <Text style={[styles.packBtnText, packagingRating === 'bad' && styles.packBtnTextActive]}>👎 Not Good</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Per-item ratings */}
        {order?.items?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rate Each Item</Text>
            {order.items.map(item => (
              <View key={item.id} style={styles.itemRatingRow}>
                <Text style={styles.itemRatingName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.miniStars}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setItemRating(item.id, s)}>
                      <Ionicons
                        name={s <= (itemRatings[item.id] || 0) ? 'star' : 'star-outline'}
                        size={22}
                        color={s <= (itemRatings[item.id] || 0) ? Colors.secondary : Colors.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Delivery Rating */}
        <View style={styles.card}>
          <StarRow label="🛵 Delivery Experience" value={deliveryRating} onChange={setDeliveryRating} />
          {deliveryRating > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>How was the delivery?</Text>
              <View style={styles.tagsRow}>
                {DELIVERY_TAGS.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, selectedDeliveryTags.includes(tag) && styles.tagActive]}
                    onPress={() => toggleTag(tag, selectedDeliveryTags, setSelectedDeliveryTags)}
                  >
                    <Text style={[styles.tagText, selectedDeliveryTags.includes(tag) && styles.tagTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Rider Tip */}
        {order?.riderId && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💰 Tip your delivery partner</Text>
            <Text style={styles.tipSubtitle}>100% goes to your rider</Text>
            <View style={styles.tipRow}>
              {[15, 20, 30].map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.tipChip, tipAmount === amt && styles.tipChipActive]}
                  onPress={() => setTipAmount(tipAmount === amt ? null : amt)}
                >
                  <Text style={[styles.tipChipText, tipAmount === amt && styles.tipChipTextActive]}>₹{amt}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.tipChip, tipAmount === 'other' && styles.tipChipActive]}
                onPress={() => setTipAmount(tipAmount === 'other' ? null : 'other')}
              >
                <Text style={[styles.tipChipText, tipAmount === 'other' && styles.tipChipTextActive]}>Other</Text>
              </TouchableOpacity>
            </View>
            {tipAmount === 'other' && (
              <TextInput
                style={styles.tipInput}
                placeholder="Enter amount (₹)"
                placeholderTextColor={Colors.lightGrey}
                keyboardType="numeric"
                value={customTip}
                onChangeText={setCustomTip}
                maxLength={4}
              />
            )}
          </View>
        )}

        {/* Shop/Restaurant Rating */}
        <View style={styles.card}>
          <StarRow label="🏪 Overall Shop Experience" value={shopRating} onChange={setShopRating} />
        </View>

        {/* Written Review */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Write a Review (optional)</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Tell others about your experience with this shop..."
            placeholderTextColor={Colors.lightGrey}
            value={review}
            onChangeText={setReview}
            multiline
            maxLength={250}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{review.length}/250</Text>
        </View>

      </ScrollView>

      {/* Submit */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (loading || (!foodRating && !deliveryRating && !shopRating)) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={loading || (!foodRating && !deliveryRating && !shopRating)}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <>
                <Ionicons name="star" size={18} color={Colors.white} />
                <Text style={styles.submitBtnText}>Submit Rating</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },

  orderInfo: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  orderInfoShop: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.primary },
  orderInfoId: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },

  card: {
    backgroundColor: Colors.white, margin: Spacing.sm,
    marginHorizontal: Spacing.lg, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadows.sm,
  },
  cardTitle: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark, marginBottom: Spacing.md },

  starSection: { alignItems: 'center', gap: 8 },
  starLabel: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark },
  stars: { flexDirection: 'row', gap: 8 },
  starDesc: { fontSize: Fonts.sizes.sm, color: Colors.grey },

  tagsSection: { marginTop: Spacing.md },
  tagsLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey, fontWeight: Fonts.weights.medium, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tagActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  tagText: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  tagTextActive: { color: Colors.primary, fontWeight: Fonts.weights.semibold },

  itemRatingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.background,
  },
  itemRatingName: { fontSize: Fonts.sizes.sm, color: Colors.dark, flex: 1, marginRight: 8 },
  miniStars: { flexDirection: 'row', gap: 4 },

  packagingRow: { flexDirection: 'row', gap: 12, marginTop: Spacing.sm },
  packBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background, alignItems: 'center',
  },
  packBtnGood: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  packBtnBad: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  packBtnText: { fontSize: Fonts.sizes.sm, color: Colors.grey, fontWeight: Fonts.weights.medium },
  packBtnTextActive: { fontWeight: Fonts.weights.bold, color: Colors.dark },

  tipSubtitle: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginBottom: Spacing.md },
  tipRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  tipChip: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  tipChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  tipChipText: { fontSize: Fonts.sizes.sm, color: Colors.grey, fontWeight: Fonts.weights.medium },
  tipChipTextActive: { color: Colors.primary, fontWeight: Fonts.weights.bold },
  tipInput: {
    marginTop: Spacing.md, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md,
    fontSize: Fonts.sizes.sm, color: Colors.dark,
  },

  reviewInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: Fonts.sizes.sm, color: Colors.dark,
    minHeight: 90,
  },
  charCount: { fontSize: 10, color: Colors.lightGrey, textAlign: 'right', marginTop: 4 },

  footer: {
    backgroundColor: Colors.white, padding: Spacing.lg, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.lg,
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitBtnText: { color: Colors.white, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
