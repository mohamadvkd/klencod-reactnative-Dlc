import React, {useMemo, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Clipboard,
  Keyboard,
} from 'react-native';

// ============================================================
// أنواع البيانات
// ============================================================
type Unit = {
  id: string;
  name: string;
  factor: number;
};

type Category = {
  id: string;
  name: string;
  units: Unit[];
  isTemperature?: boolean;
};

// ============================================================
// الفئات والوحدات
// ============================================================
const CATEGORIES: Category[] = [
  {
    id: 'length',
    name: 'الطول',
    units: [
      {id: 'mm', name: 'مليمتر', factor: 0.001},
      {id: 'cm', name: 'سنتيمتر', factor: 0.01},
      {id: 'm', name: 'متر', factor: 1},
      {id: 'km', name: 'كيلومتر', factor: 1000},
      {id: 'in', name: 'بوصة', factor: 0.0254},
      {id: 'ft', name: 'قدم', factor: 0.3048},
      {id: 'yd', name: 'يارد', factor: 0.9144},
      {id: 'mi', name: 'ميل', factor: 1609.344},
    ],
  },
  {
    id: 'weight',
    name: 'الوزن',
    units: [
      {id: 'mg', name: 'ملليجرام', factor: 0.000001},
      {id: 'g', name: 'جرام', factor: 0.001},
      {id: 'kg', name: 'كيلوجرام', factor: 1},
      {id: 'ton', name: 'طن', factor: 1000},
      {id: 'oz', name: 'أونصة', factor: 0.0283495},
      {id: 'lb', name: 'رطل', factor: 0.453592},
    ],
  },
  {
    id: 'temperature',
    name: 'الحرارة',
    isTemperature: true,
    units: [
      {id: 'c', name: 'سيليزيوس', factor: 1},
      {id: 'f', name: 'فهرنهايت', factor: 1},
      {id: 'k', name: 'كلفن', factor: 1},
    ],
  },
  {
    id: 'data',
    name: 'البيانات',
    units: [
      {id: 'b', name: 'بايت', factor: 1},
      {id: 'kb', name: 'كيلوبايت', factor: 1024},
      {id: 'mb', name: 'ميجابايت', factor: 1048576},
      {id: 'gb', name: 'جيجابايت', factor: 1073741824},
      {id: 'tb', name: 'تيرابايت', factor: 1099511627776},
    ],
  },
  {
    id: 'time',
    name: 'الوقت',
    units: [
      {id: 'ms', name: 'مللي ثانية', factor: 0.001},
      {id: 's', name: 'ثانية', factor: 1},
      {id: 'min', name: 'دقيقة', factor: 60},
      {id: 'h', name: 'ساعة', factor: 3600},
      {id: 'd', name: 'يوم', factor: 86400},
      {id: 'w', name: 'أسبوع', factor: 604800},
    ],
  },
  {
    id: 'area',
    name: 'المساحة',
    units: [
      {id: 'cm2', name: 'سنتيمتر مربع', factor: 0.0001},
      {id: 'm2', name: 'متر مربع', factor: 1},
      {id: 'km2', name: 'كيلومتر مربع', factor: 1000000},
      {id: 'ha', name: 'هكتار', factor: 10000},
      {id: 'ac', name: 'فدان', factor: 4046.86},
      {id: 'ft2', name: 'قدم مربع', factor: 0.092903},
    ],
  },
];

// ============================================================
// التحويل
// ============================================================
function convertTemperature(value: number, fromId: string, toId: string): number {
  let celsius: number;
  if (fromId === 'c') celsius = value;
  else if (fromId === 'f') celsius = (value - 32) * (5 / 9);
  else celsius = value - 273.15;

  if (toId === 'c') return celsius;
  if (toId === 'f') return celsius * (9 / 5) + 32;
  return celsius + 273.15;
}

function convertValue(
  value: number,
  fromUnit: Unit,
  toUnit: Unit,
  isTemp: boolean,
): number {
  if (isTemp) return convertTemperature(value, fromUnit.id, toUnit.id);
  return (value * fromUnit.factor) / toUnit.factor;
}

function formatNumber(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '0';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs < 0.0001) return value.toExponential(4);
  if (abs >= 1000000000) return value.toExponential(4);
  const rounded = Math.round(value * 1000000) / 1000000;
  return rounded.toString();
}

// ============================================================
// المكوّن الرئيسي
// ============================================================
export default function App() {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [inputValue, setInputValue] = useState('1');
  const [copied, setCopied] = useState(false);
  const [fromUnitId, setFromUnitId] = useState('m');
  const [toUnitId, setToUnitId] = useState('ft');

  const category = CATEGORIES[activeCategoryIndex];
  const isTemp = category.isTemperature === true;

  const fromUnit = useMemo(
    () => category.units.find(u => u.id === fromUnitId) || category.units[0],
    [category, fromUnitId],
  );

  const toUnit = useMemo(
    () => category.units.find(u => u.id === toUnitId)
      || category.units[1]
      || category.units[0],
    [category, toUnitId],
  );

  const result = useMemo(() => {
    const parsed = parseFloat(inputValue.replace(',', '.')) || 0;
    try {
      return convertValue(parsed, fromUnit, toUnit, isTemp);
    } catch (e) {
      return 0;
    }
  }, [inputValue, fromUnit, toUnit, isTemp]);

  const formula = useMemo(() => {
    const parsed = parseFloat(inputValue.replace(',', '.')) || 0;
    return (
      parsed +
      ' ' +
      fromUnit.name +
      ' = ' +
      formatNumber(result) +
      ' ' +
      toUnit.name
    );
  }, [inputValue, fromUnit, toUnit, result]);

  const changeCategory = (index: number) => {
    setActiveCategoryIndex(index);
    const newCategory = CATEGORIES[index];
    if (newCategory.units.length >= 2) {
      setFromUnitId(newCategory.units[0].id);
      setToUnitId(newCategory.units[1].id);
    } else if (newCategory.units.length === 1) {
      setFromUnitId(newCategory.units[0].id);
      setToUnitId(newCategory.units[0].id);
    }
  };

  const swapUnits = () => {
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
  };

  const copyResult = () => {
    Clipboard.setString(formatNumber(result));
    setCopied(true);
    Keyboard.dismiss();
    setTimeout(() => setCopied(false), 1500);
  };

  const reset = () => {
    setInputValue('1');
    if (category.units.length >= 2) {
      setFromUnitId(category.units[0].id);
      setToUnitId(category.units[1].id);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>محوّل الوحدات</Text>
        <Text style={styles.headerSubtitle}>أداة سريعة للتحويل بين الوحدات</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}>
          {CATEGORIES.map((cat, index) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.tab,
                index === activeCategoryIndex && styles.tabActive,
              ]}
              onPress={() => changeCategory(index)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.tabText,
                  index === activeCategoryIndex && styles.tabTextActive,
                ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled">

        <View style={styles.card}>
          <Text style={styles.cardLabel}>من</Text>
          <TextInput
            style={styles.valueInput}
            keyboardType="numeric"
            value={inputValue}
            onChangeText={setInputValue}
            selectTextOnFocus
            placeholder="0"
            placeholderTextColor="#5A6472"
          />
          <View style={styles.unitSelector}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.unitSelectorContent}>
              {category.units.map((unit) => (
                <TouchableOpacity
                  key={'from-' + unit.id}
                  style={[
                    styles.unitChip,
                    unit.id === fromUnit.id && styles.unitChipActive,
                  ]}
                  onPress={() => setFromUnitId(unit.id)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.unitChipText,
                      unit.id === fromUnit.id && styles.unitChipTextActive,
                    ]}>
                    {unit.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity
          style={styles.swapButton}
          onPress={swapUnits}
          activeOpacity={0.7}>
          <Text style={styles.swapButtonText}>تبديل</Text>
        </TouchableOpacity>

        <View style={[styles.card, styles.cardResult]}>
          <Text style={styles.cardLabel}>إلى</Text>
          <Text
            style={styles.resultValue}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {formatNumber(result)}
          </Text>
          <View style={styles.unitSelector}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.unitSelectorContent}>
              {category.units.map((unit) => (
                <TouchableOpacity
                  key={'to-' + unit.id}
                  style={[
                    styles.unitChip,
                    unit.id === toUnit.id && styles.unitChipActive,
                  ]}
                  onPress={() => setToUnitId(unit.id)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.unitChipText,
                      unit.id === toUnit.id && styles.unitChipTextActive,
                    ]}>
                    {unit.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.formulaBox}>
          <Text style={styles.formulaText}>{formula}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={copyResult}
            activeOpacity={0.7}>
            <Text style={styles.actionButtonPrimaryText}>
              {copied ? 'تم النسخ' : 'نسخ النتيجة'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={reset}
            activeOpacity={0.7}>
            <Text style={styles.actionButtonSecondaryText}>إعادة تعيين</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {category.units.length} وحدة متاحة في هذه الفئة
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// الأنماط
// ============================================================
const COLORS = {
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
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'right',
  },
  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'right',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  tabsContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardResult: {
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.primary,
  },
  cardLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  valueInput: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '700',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 56,
  },
  resultValue: {
    color: COLORS.success,
    fontSize: 32,
    fontWeight: '700',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 56,
  },
  unitSelector: {
    marginTop: 12,
  },
  unitSelectorContent: {
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  unitChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },
  unitChipText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  unitChipTextActive: {
    color: '#FFFFFF',
  },
  swapButton: {
    alignSelf: 'center',
    marginVertical: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  swapButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  formulaBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  formulaText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonSecondary: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonSecondaryText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 11,
  },
});