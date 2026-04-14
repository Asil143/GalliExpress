// GalliExpress — ShopCard Component

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../shared/theme';
import { getCategoryEmoji } from '../../../shared/utils';

const { width } = Dimensions.get('window');

export default function ShopCard({ shop, onPress, horizontal }) {
  const {
    name, category, rating, deliveryTime, minOrder,
    isOpen, image, distance, totalOrders,
  } = shop;

  if (horizontal) {
    return (
      <TouchableOpacity style={[styles.cardH, Shadows.md]} onPress={onPress} activeOpacity={0.9}>
        {/* Image / Emoji placeholder */}
        <View style={styles.imageH}>
          <Text style={styles.placeholderEmojiH}>{getCategoryEmoji(category)}</Text>
        </View>
        {!isOpen && <View style={styles.closedOverlay}><Text style={styles.closedText}>మూసివేయబడింది</Text></View>}
        <View style={styles.infoH}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.category}>{category}</Text>
          <View style={styles.row}>
            <Ionicons name="star" size={12} color={Colors.secondary} />
            <Text style={styles.rating}>{rating || '4.2'}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.deliveryTime}>{deliveryTime || '25'} min</Text>
          </View>
          <Text style={styles.minOrder}>Min ₹{minOrder || 50}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, Shadows.sm]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageBox}>
        <Text style={styles.placeholderEmoji}>{getCategoryEmoji(category)}</Text>
        {!isOpen && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>మూసివేయబడింది</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {shop.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>⭐ Featured</Text>
            </View>
          )}
        </View>
        <Text style={styles.category}>{category}</Text>
        <View style={styles.metaRow}>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={12} color={Colors.secondary} />
            <Text style={styles.rating}>{rating || '4.2'}</Text>
          </View>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>{deliveryTime || '25'} నిమి.</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>Min ₹{minOrder || 50}</Text>
          {distance && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.meta}>{distance}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Vertical card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  imageBox: {
    width: 90,
    height: 90,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  placeholderEmoji: { fontSize: 40 },
  closedBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  closedBadgeText: { color: Colors.white, fontSize: 9, fontWeight: Fonts.weights.bold },
  info: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  name: {
    flex: 1,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    color: Colors.dark,
  },
  featuredBadge: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: { fontSize: 9, color: Colors.dark, fontWeight: Fonts.weights.semibold },
  category: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  dot: { fontSize: 10, color: Colors.lightGrey },
  meta: { fontSize: Fonts.sizes.xs, color: Colors.grey },

  // Horizontal card
  cardH: {
    width: 160,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  imageH: {
    height: 100,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmojiH: { fontSize: 48 },
  closedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedText: { color: Colors.white, fontSize: 11, fontWeight: Fonts.weights.bold },
  infoH: { padding: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  deliveryTime: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  minOrder: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
});
