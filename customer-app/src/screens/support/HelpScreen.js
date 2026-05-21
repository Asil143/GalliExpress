// GalliExpress Customer — Help & Support Screen

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';

const WHATSAPP_NUMBER = '919727178763'; // Real support number
const SUPPORT_EMAIL = 'support@galliexpress.in';

const FAQ = [
  {
    q: 'How long does delivery take?',
    a: 'Delivery usually takes 25–40 minutes depending on distance and shop preparation time.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'You can cancel within 60 seconds of placing. After the shop confirms, cancellation is not possible.',
  },
  {
    q: 'What if my order is wrong or missing items?',
    a: 'Report the issue within 30 minutes of delivery using "Report Issue" below. We\'ll resolve it quickly.',
  },
  {
    q: 'How do GalliCoins work?',
    a: 'You earn 1 GalliCoin for every ₹1 spent. Coins can be redeemed on future orders (100 coins = ₹10 off).',
  },
  {
    q: 'When will I get my refund?',
    a: 'Refunds for cancelled orders are processed within 3–5 business days to your original payment method.',
  },
  {
    q: 'Is there a minimum order value?',
    a: 'Minimum order varies per shop. Free delivery kicks in above ₹300 for most shops.',
  },
];

const ISSUE_TYPES = [
  { id: 'wrong_items', label: 'Wrong items delivered', emoji: '❌' },
  { id: 'missing_items', label: 'Missing items', emoji: '📦' },
  { id: 'quality', label: 'Food quality issue', emoji: '🍽️' },
  { id: 'late', label: 'Order too late', emoji: '⏰' },
  { id: 'rude_rider', label: 'Rider behaviour', emoji: '🛵' },
  { id: 'billing', label: 'Billing / Payment issue', emoji: '💳' },
  { id: 'other', label: 'Other', emoji: '📝' },
];

export default function HelpScreen({ navigation }) {
  const user = auth().currentUser;
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueNote, setIssueNote] = useState('');
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent('Hi GalliExpress Support! I need help with my order.');
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`).catch(() => {
      Alert.alert('WhatsApp not installed', 'Please contact us at ' + SUPPORT_EMAIL);
    });
  };

  const handleCallSupport = () => {
    Linking.openURL(`tel:+91${WHATSAPP_NUMBER.replace('91', '')}`);
  };

  const handleSubmitIssue = async () => {
    if (!selectedIssue) {
      Alert.alert('Select Issue', 'Please select the type of issue you faced');
      return;
    }
    if (!orderId.trim()) {
      Alert.alert('Order ID Required', 'Please enter the Order ID related to this issue');
      return;
    }

    setSubmitting(true);
    try {
      await firestore().collection('supportTickets').add({
        customerId: user.uid,
        customerPhone: user.phoneNumber,
        orderId: orderId.trim().toUpperCase(),
        issueType: selectedIssue,
        note: issueNote.trim() || null,
        status: 'open',
        createdAt: firestore.FieldValue.serverTimestamp(),
        town: 'addanki',
      });
      Alert.alert(
        'Issue Reported ✅',
        'We\'ve received your report. Our team will contact you within 2 hours.',
        [{ text: 'OK', onPress: () => { setSelectedIssue(null); setIssueNote(''); setOrderId(''); } }]
      );
    } catch {
      Alert.alert('Error', 'Could not submit your issue. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Quick Contact */}
        <View style={styles.quickContact}>
          <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp}>
            <View style={[styles.contactIcon, { backgroundColor: '#25D366' + '20' }]}>
              <Text style={{ fontSize: 24 }}>💬</Text>
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={styles.contactSub}>Usually replies in minutes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport}>
            <View style={[styles.contactIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Ionicons name="call" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.contactLabel}>Call Us</Text>
            <Text style={styles.contactSub}>Mon–Sat, 8AM–10PM</Text>
          </TouchableOpacity>
        </View>

        {/* Report an Issue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Report an Issue</Text>

          <TextInput
            style={styles.input}
            placeholder="Order ID (e.g. GE-20240101-ABCD)"
            placeholderTextColor={Colors.lightGrey}
            value={orderId}
            onChangeText={setOrderId}
            autoCapitalize="characters"
          />

          <Text style={styles.subLabel}>What went wrong?</Text>
          <View style={styles.issueGrid}>
            {ISSUE_TYPES.map(issue => (
              <TouchableOpacity
                key={issue.id}
                style={[styles.issueChip, selectedIssue === issue.id && styles.issueChipActive]}
                onPress={() => setSelectedIssue(issue.id)}
              >
                <Text style={styles.issueEmoji}>{issue.emoji}</Text>
                <Text style={[styles.issueLabel, selectedIssue === issue.id && styles.issueLabelActive]}>
                  {issue.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="Additional details (optional)..."
            placeholderTextColor={Colors.lightGrey}
            value={issueNote}
            onChangeText={setIssueNote}
            multiline
            maxLength={200}
          />

          <TouchableOpacity
            style={[styles.submitBtn, (submitting || !selectedIssue) && { opacity: 0.5 }]}
            onPress={handleSubmitIssue}
            disabled={submitting || !selectedIssue}
          >
            {submitting
              ? <ActivityIndicator color={Colors.white} />
              : <>
                  <Ionicons name="send-outline" size={16} color={Colors.white} />
                  <Text style={styles.submitBtnText}>Submit Report</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ Frequently Asked Questions</Text>
          {FAQ.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion} numberOfLines={expandedFaq === index ? 0 : 2}>
                  {item.q}
                </Text>
                <Ionicons
                  name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.grey}
                />
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{item.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
          <Text style={styles.footerNoteText}>
            GalliExpress ensures 100% resolution for all verified issues within 24 hours.
          </Text>
        </View>

      </ScrollView>
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

  quickContact: {
    flexDirection: 'row', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  contactCard: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', gap: 6, ...Shadows.sm,
  },
  contactIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold, color: Colors.dark },
  contactSub: { fontSize: Fonts.sizes.xs, color: Colors.grey, textAlign: 'center' },

  section: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.sm,
  },
  sectionTitle: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark, marginBottom: Spacing.md },

  input: {
    height: 44, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    fontSize: Fonts.sizes.sm, color: Colors.dark,
    marginBottom: Spacing.sm,
  },
  noteInput: { height: 70, textAlignVertical: 'top', paddingTop: Spacing.sm },
  subLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey, fontWeight: Fonts.weights.medium, marginBottom: 8 },

  issueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  issueChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 7, backgroundColor: Colors.background,
  },
  issueChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  issueEmoji: { fontSize: 14 },
  issueLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  issueLabelActive: { color: Colors.primary, fontWeight: Fonts.weights.semibold },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitBtnText: { color: Colors.white, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },

  faqItem: {
    borderBottomWidth: 1, borderBottomColor: Colors.background,
    paddingVertical: Spacing.md,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  faqQuestion: { flex: 1, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  faqAnswer: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 8, lineHeight: 20 },

  footerNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  footerNoteText: { flex: 1, fontSize: Fonts.sizes.xs, color: Colors.grey, lineHeight: 18 },
});
