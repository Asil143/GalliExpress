// GalliExpress — ShopCard Component v3 (premium)

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../shared/theme';
import { getCategoryEmoji } from '../../../shared/utils';

const CATEGORY_GRADIENTS = {
  'Tiffin & Breakfast':      ['#FF9A5C', '#FF6B35'],
  'Meals & Fast Food':       ['#FF7B54', '#FF4D1C'],
  'Biryani':                 ['#FFC837', '#FF8C00'],
  'Restaurant':              ['#7C6CF8', '#5A4FCF'],
  'Chicken & Meat':          ['#FF6B6B', '#EE3D3D'],
  'Bakery & Sweets':         ['#F06FA4', '#D63777'],
  'Bakery & Beverages':      ['#C47CFF', '#9C27B0'],
  'Juice & Beverages':       ['#56D176', '#28A745'],
  'Tea & Beverages':         ['#B08968', '#7D5A50'],
  'Grocery & Provisions':    ['#4DD9E0', '#00ACC1'],
  'Gifts & Stationery':      ['#BA68C8', '#7B1FA2'],
  'Stationery & Print':      ['#7986CB', '#3949AB'],
  'Electronics & Computers': ['#4FC3F7', '#0288D1'],
};

function getCategoryGradient(category) {
  return CATEGORY_GRADIENTS[category] || ['#FF9A5C', '#FF6B35'];
}

export default function ShopCard({ shop, onPress, horizontal }) {
  const {
    name, category, rating, deliveryTime, minOrder,
    isOpen, isFeatured, isVeg, distance, offerText,
    totalOrders, openingTime,
  } = shop;

  const emoji = getCategoryEmoji(category);
  const gradient = getCategoryGradient(category);
  const nextOpen = openingTime ? `Opens at ${openingTime}` : 'Currently Closed';

  if (horizontal) {
    return (
      <TouchableOpacity
        style={[styles.cardH, isOpen ? styles.cardHOpen : styles.cardHClosed]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <LinearGradient colors={gradient} style={styles.imageH} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.emojiH}>{emoji}</Text>
          {!isOpen && (
            <View style={styles.closedOverlayH}>
              <Text style={styles.closedOverlayText}>Closed</Text>
              <Text style={styles.closedOverlaySub}>{nextOpen}</Text>
            </View>
          )}
          {offerText && (
            <View style={styles.offerBadgeH}>
              <Text style={styles.offerBadgeText}>{offerText}</Text>
            </View>
          )}
        </LinearGradient>
        <View style={styles.infoH}>
          <View style={styles.nameRow}>
            <Text style={styles.nameH} numberOfLines={1}>{name}</Text>
            {isVeg && <View style={styles.vegDot} />}
          </View>
          <Text style={styles.categoryH} numberOfLines={1}>{category}</Text>
          <View style={styles.metaRowH}>
            <Ionicons name="star" size={11} color="#FFB800" />
            <Text style={styles.ratingH}>{rating || '4.2'}</Text>
            <View style={styles.dotSep} />
            <Ionicons name="time-outline" size={11} color={Colors.grey} />
            <Text style={styles.metaH}>{deliveryTime || '25'} min</Text>
          </View>
          <Text style={styles.minH}>Min ₹{minOrder || 50}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Vertical card
  return (
    <TouchableOpacity
      style={[styles.card, isOpen ? styles.cardOpen : styles.cardClosed]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Category gradient image area */}
      <LinearGradient colors={gradient} style={styles.imageBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.emoji}>{emoji}</Text>
        {!isOpen && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>Closed</Text>
          </View>
        )}
        {offerText && isOpen && (
          <View style={styles.offerBadge}>
            <Text style={styles.offerBadgeText}>{offerText}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Right info */}
      <View style={styles.info}>
        {/* Name + veg indicator */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {isVeg !== undefined && (
            <View style={[styles.vegIndicator, { borderColor: isVeg ? Colors.success : Colors.error }]}>
              <View style={[styles.vegInnerDot, { backgroundColor: isVeg ? Colors.success : Colors.error }]} />
            </View>
          )}
        </View>

        {/* Category pill + featured */}
        <View style={styles.categoryRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.category} numberOfLines={1}>{category}</Text>
          </View>
          {isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>⭐ Top Pick</Text>
            </View>
          )}
        </View>

        {/* Meta: rating, time, min order */}
        <View style={styles.metaRow}>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={11} color="#FFB800" />
            <Text style={styles.rating}>{rating || '4.2'}</Text>
          </View>
          <View style={styles.dotSep} />
          <Ionicons name="time-outline" size={11} color={Colors.grey} />
          <Text style={styles.meta}>{deliveryTime || '25'} min</Text>
          <View style={styles.dotSep} />
          <Text style={styles.meta}>₹{minOrder || 50} min</Text>
          {distance ? (
            <>
              <View style={styles.dotSep} />
              <Text style={styles.meta}>{distance}</Text>
            </>
          ) : null}
        </View>

        {/* Social proof / closed notice */}
        {isOpen && totalOrders > 0 && (
          <View style={styles.proofRow}>
            <Text style={styles.proofText}>🔥 {totalOrders > 50 ? '50+' : totalOrders} orders today</Text>
          </View>
        )}
        {!isOpen && (
          <Text style={styles.closedNotice}>{nextOpen}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ── Vertical Card ──────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: Radius.xl, marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md, overflow: 'hidden',
    shadowColor: '#1C1C2E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  cardOpen: {
    shadowColor: '#FF6B35',
    shadowOpacity: 0.12,
  },
  cardClosed: {
    opacity: 0.85,
  },
  imageBox: {
    width: 100, minHeight: 100,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  emoji: { fontSize: 44 },
  closedBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 4, alignItems: 'center',
  },
  closedBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  offerBadge: {
    position: 'absolute', top: 8, left: 0,
    backgroundColor: Colors.error,
    paddingHorizontal: 6, paddingVertical: 3,
    borderTopRightRadius: 6, borderBottomRightRadius: 6,
  },
  offerBadgeText: { color: Colors.white, fontSize: 8, fontWeight: '800', letterSpacing: 0.3 },
  info: { flex: 1, padding: Spacing.md, justifyContent: 'center', gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flex: 1, fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.dark },
  vegIndicator: {
    width: 14, height: 14, borderRadius: 3,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  vegInnerDot: { width: 6, height: 6, borderRadius: 3 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryPill: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full,
  },
  category: { fontSize: Fonts.sizes.xs, color: Colors.grey, fontWeight: '500' },
  featuredBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full,
    borderWidth: 1, borderColor: '#FFD54F',
  },
  featuredText: { fontSize: 9, color: '#E65100', fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: Fonts.sizes.xs, fontWeight: '700', color: Colors.dark },
  dotSep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.lightGrey },
  meta: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  proofRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  proofText: { fontSize: Fonts.sizes.xs, color: Colors.warning, fontWeight: '600' },
  closedNotice: { fontSize: Fonts.sizes.xs, color: Colors.error, fontWeight: '500' },

  // ── Horizontal Card ────────────────────────────────────────────────────────
  cardH: {
    width: 170, backgroundColor: Colors.white,
    borderRadius: Radius.xl, marginRight: Spacing.md, overflow: 'hidden',
    shadowColor: '#1C1C2E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHOpen: {
    shadowColor: '#FF6B35',
    shadowOpacity: 0.14,
  },
  cardHClosed: { opacity: 0.82 },
  imageH: {
    height: 108, width: '100%',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  emojiH: { fontSize: 50 },
  closedOverlayH: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  closedOverlayText: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  closedOverlaySub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 },
  offerBadgeH: {
    position: 'absolute', top: 8, left: 0,
    backgroundColor: Colors.error,
    paddingHorizontal: 7, paddingVertical: 3,
    borderTopRightRadius: 6, borderBottomRightRadius: 6,
  },
  infoH: { padding: Spacing.sm, gap: 3 },
  nameH: { flex: 1, fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.dark },
  vegDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  categoryH: { fontSize: Fonts.sizes.xs, color: Colors.grey, fontWeight: '500' },
  metaRowH: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingH: { fontSize: Fonts.sizes.xs, fontWeight: '700', color: Colors.dark },
  metaH: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  minH: { fontSize: Fonts.sizes.xs, color: Colors.grey, fontWeight: '500' },
});
