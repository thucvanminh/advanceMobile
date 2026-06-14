import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import vi from '../i18n/vi';
import { COLORS } from '../utils/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'Help'>;

const FAQS = [
  { q: vi.faq1_q, a: vi.faq1_a },
  { q: vi.faq2_q, a: vi.faq2_a },
  { q: vi.faq3_q, a: vi.faq3_a },
];

export default function HelpScreen({}: Props) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{vi.help}</Text>

      <Text style={styles.sectionTitle}>{vi.faq}</Text>
      {FAQS.map((faq, i) => (
        <TouchableOpacity key={i} style={styles.faqItem} onPress={() => setOpenIndex(openIndex === i ? null : i)}>
          <Text style={styles.faqQ}>{faq.q}</Text>
          {openIndex === i && <Text style={styles.faqA}>{faq.a}</Text>}
        </TouchableOpacity>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{vi.about}</Text>
        <Text style={styles.aboutText}>{vi.appDescription}</Text>
        <Text style={styles.version}>{vi.version}: 1.0.0</Text>
        <Text style={styles.dev}>{vi.developer}: Thuc.van.clone@gmail.com</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  faqItem: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  faqQ: { color: COLORS.text, fontWeight: '500', fontSize: 15 },
  faqA: { color: COLORS.textSecondary, marginTop: 8, fontSize: 14, lineHeight: 20 },
  section: { marginTop: 24, marginBottom: 40 },
  aboutText: { color: COLORS.textSecondary, marginBottom: 8 },
  version: { color: COLORS.textSecondary, marginBottom: 4 },
  dev: { color: COLORS.textSecondary },
});
