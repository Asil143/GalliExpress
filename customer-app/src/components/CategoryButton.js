// GalliExpress — CategoryButton Component

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors, Fonts, Spacing, Radius } from '../../../shared/theme';

export default function CategoryButton({ emoji, name, isSelected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.button, isSelected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.name, isSelected && styles.nameSelected]}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 72,
    gap: 4,
  },
  selected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  emoji: { fontSize: 28 },
  name: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
    color: Colors.darkGrey,
    textAlign: 'center',
  },
  nameSelected: {
    color: Colors.primary,
    fontWeight: Fonts.weights.bold,
  },
});
