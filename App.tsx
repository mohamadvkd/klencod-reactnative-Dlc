import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ============================================================
// الفئات والوحدات (بسيطة جداً)
// ============================================================
type Unit = {
  id: string;
  name: string;
  factor: number; // معامل التحويل إلى الوحدة الأساسية
};

type Category = {
  id: string;
  name: string;
  baseUnitId: string;
  units: Unit[];
  isTemperature?: boolean;
};

const CATEGORIES: Category[] = [
  {
    id: 'length',
    name: 'الطول',
    baseUnitId: 'm',
    units: [
      {id: 'mm', name: 'مم', factor: 0.001},
      {id: 'cm', name: 'سم', factor: 0.01},
      {id: 'm', name: 'متر', factor: 1},
      {id: 'km', name: 'كم', factor: 1000},
    ],
  },
  {
    id: 'weight',
    name: 'الوزن',
    baseUnitId: 'kg',
    units: [
      {id: 'g', name: 'جرام', factor: 0.001},
      {id: 'kg', name: 'كجم', factor: 1},
      {id: 'ton', name: 'طن', factor: 1000},
      {id: 'lb', name: 'رطل', factor: 0.453592},
    ],
  },
  {
    id: 'temperature',
    name: 'الحرارة',
    baseUnitId: 'c',
    isTemperature: true,
    units: [
      {id: 'c', name: 'سيلزيوس', factor: 1},
      {id: 'f', name: 'فهرنهايت', factor: 1},
      {id: 'k', name: 'كلفن', factor: 1},
    ],
  },
];

// ============================================================
// التحويل (دالة واحدة بسيطة)
// ============================================================
function convert(value: number, fromId: string, toId: string, category: Category): number {
  // حالة الحرارة (منطق خاص)
  if (category.isTemperature) {
    let celsius = value;
    if (fromId === 'f') celsius = (value - 32) * 5 / 9;
    else if (fromId === 'k') celsius = value - 273.15;

    if (toId === 'c') return celsius;
    if (toId === 'f') return celsius * 9 / 5 + 32;
    return celsius + 273.15;
  }

  // الحالة العادية: نجد الوحدتين ثم نحول
  const fromUnit = category.units.find(u => u.id === fromId);
  const toUnit = category.units.find(u => u.id === toId);
  if (!fromUnit || !toUnit) return 0;

  // حول إلى الوحدة الأساسية، ثم إلى الهدف
  const valueInBase = value * fromUnit.factor;
  return valueInBase / toUnit.factor;
}

// ============================================================
// تنسيق الرقم
// ============================================================
function fmt(n: number): string {
  if (!isFinite(n)) return '0';
  if (n === 0) return '0';
  if (Math.abs(n) < 0.0001) return n.toExponential(3);
  if (Math.abs(n) > 1000000) return n.toExponential(3);
  return (Math.round(n * 10000) / 10000).toString();
}

// ============================================================
// التطبيق
// ============================================================
export default function App() {
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [fromId, setFromId] = useState('mm');
  const [toId, setToId] = useState('m');
  const [input, setInput] = useState('1');

  const category = CATEGORIES[categoryIndex];

  // حساب النتيجة مباشرة (بدون useMemo)
  const numInput = parseFloat(input) || 0;
  const result = convert(numInput, fromId, toId, category);

  // تغيير الفئة
  const changeCategory = (idx: number) => {
    setCategoryIndex(idx);
    const newCat = CATEGORIES[idx];
    setFromId(newCat.units[0].id);
    setToId(newCat.units[1].id);
    setInput('1');
  };

  // تبديل
  const swap = () => {
    const tmp = fromId;
    setFromId(toId);
    setToId(tmp);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>محوّل الوحدات</Text>
      </View>

      {/* التبويبات */}
      <View style={styles.tabsRow}>
        {CATEGORIES.map((cat, idx) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.tab, idx === categoryIndex && styles.tabActive]}
            onPress={() => changeCategory(idx)}>
            <Text style={[styles.tabText, idx === categoryIndex && styles.tabTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* حقل الإدخال */}
        <Text style={styles.label}>القيمة</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={input}
          onChangeText={setInput}
          placeholder="1"
          placeholderTextColor="#5A6472"
        />

        {/* اختيار الوحدة من */}
        <Text style={styles.label}>من</Text>
        <View style={styles.chipsRow}>
          {category.units.map(unit => (
            <TouchableOpacity
              key={unit.id}
              style={[styles.chip, unit.id === fromId && styles.chipActive]}
              onPress={() => setFromId(unit.id)}>
              <Text style={[styles.chipText, unit.id === fromId && styles.chipTextActive]}>
                {unit.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* زر التبديل */}
        <TouchableOpacity style={styles.swapBtn} onPress={swap}>
          <Text style={styles.swapBtnText}>تبديل الوحدات</Text>
        </TouchableOpacity>

        {/* اختيار الوحدة إلى */}
        <Text style={styles.label}>إلى</Text>
        <View style={styles.chipsRow}>
          {category.units.map(unit => (
            <TouchableOpacity
              key={unit.id}
              style={[styles.chip, unit.id === toId && styles.chipActive]}
              onPress={() => setToId(unit.id)}>
              <Text style={[styles.chipText, unit.id === toId && styles.chipTextActive]}>
                {unit.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* النتيجة */}
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>النتيجة</Text>
          <Text style={styles.resultValue}>{fmt(result)}</Text>
          <Text style={styles.formula}>
            {numInput} {category.units.find(u => u.id === fromId)?.name} = {fmt(result)}{' '}
            {category.units.find(u => u.id === toId)?.name}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// الأنماط
// ============================================================
const C = {
  bg: '#0A0E14',
  surface: '#141B24',
  surfaceAlt: '#1B242F',
  border: '#303E4D',
  text: '#F5F7FA',
  muted: '#9DABBB',
  primary: '#3791FF',
  primaryDark: '#2570CC',
  success: '#36C284',
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  header: {padding: 20, paddingBottom: 12},
  title: {color: C.text, fontSize: 26, fontWeight: '800', textAlign: 'right'},
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  tabActive: {backgroundColor: C.primary, borderColor: C.primary},
  tabText: {color: C.muted, fontSize: 13, fontWeight: '600'},
  tabTextActive: {color: '#FFFFFF'},
  body: {flex: 1},
  bodyContent: {padding: 16, paddingBottom: 40},
  label: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'right',
  },
  input: {
    color: C.text,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: C.surface,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: C.border,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: {backgroundColor: C.primaryDark, borderColor: C.primary},
  chipText: {color: C.muted, fontSize: 13, fontWeight: '600'},
  chipTextActive: {color: '#FFFFFF'},
  swapBtn: {
    alignSelf: 'center',
    marginVertical: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  swapBtnText: {color: C.primary, fontSize: 14, fontWeight: '700'},
  resultBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: 18,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.primary,
  },
  resultLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 6,
  },
  resultValue: {
    color: C.success,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'right',
  },
  formula: {
    color: C.muted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 10,
  },
});