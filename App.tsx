import React, { useCallback, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

// ============================================================
// الأنواع
// ============================================================
type Unit = {
  id: string;
  name: string;
  symbol: string;
  factor: number; // معامل التحويل إلى الوحدة الأساسية للفئة
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
      { id: 'mm', name: 'مليمتر', symbol: 'mm', factor: 0.001 },
      { id: 'cm', name: 'سنتيمتر', symbol: 'cm', factor: 0.01 },
      { id: 'm', name: 'متر', symbol: 'm', factor: 1 },
      { id: 'km', name: 'كيلومتر', symbol: 'km', factor: 1000 },
      { id: 'in', name: 'بوصة', symbol: 'in', factor: 0.0254 },
      { id: 'ft', name: 'قدم', symbol: 'ft', factor: 0.3048 },
      { id: 'yd', name: 'يارد', symbol: 'yd', factor: 0.9144 },
      { id: 'mi', name: 'ميل', symbol: 'mi', factor: 1609.344 },
    ],
  },
  {
    id: 'weight',
    name: 'الوزن',
    units: [
      { id: 'mg', name: 'ملليجرام', symbol: 'mg', factor: 0.000001 },
      { id: 'g', name: 'جرام', symbol: 'g', factor: 0.001 },
      { id: 'kg', name: 'كيلوجرام', symbol: 'kg', factor: 1 },
      { id: 'ton', name: 'طن', symbol: 't', factor: 1000 },
      { id: 'oz', name: 'أونصة', symbol: 'oz', factor: 0.0283495 },
      { id: 'lb', name: 'رطل', symbol: 'lb', factor: 0.453592 },
    ],
  },
  {
    id: 'temperature',
    name: 'الحرارة',
    isTemperature: true,
    units: [
      { id: 'c', name: 'سيليزيوس', symbol: '°C', factor: 1 },
      { id: 'f', name: 'فهرنهايت', symbol: '°F', factor: 1 },
      { id: 'k', name: 'كلفن', symbol: 'K', factor: 1 },
    ],
  },
  {
    id: 'data',
    name: 'البيانات',
    units: [
      { id: 'b', name: 'بايت', symbol: 'B', factor: 1 },
      { id: 'kb', name: 'كيلوبايت', symbol: 'KB', factor: 1024 },
      { id: 'mb', name: 'ميجابايت', symbol: 'MB', factor: 1048576 },
      { id: 'gb', name: 'جيجابايت', symbol: 'GB', factor: 1073741824 },
      { id: 'tb', name: 'تيرابايت', symbol: 'TB', factor: 1099511627776 },
    ],
  },
  {
    id: 'time',
    name: 'الوقت',
    units: [
      { id: 'ms', name: 'مللي ثانية', symbol: 'ms', factor: 0.001 },
      { id: 's', name: 'ثانية', symbol: 's', factor: 1 },
      { id: 'min', name: 'دقيقة', symbol: 'min', factor: 60 },
      { id: 'h', name: 'ساعة', symbol: 'h', factor: 3600 },
      { id: 'd', name: 'يوم', symbol: 'd', factor: 86400 },
      { id: 'w', name: 'أسبوع', symbol: 'w', factor: 604800 },
    ],
  },
  {
    id: 'area',
    name: 'المساحة',
    units: [
      { id: 'cm2', name: 'سنتيمتر مربع', symbol: 'cm²', factor: 0.0001 },
      { id: 'm2', name: 'متر مربع', symbol: 'm²', factor: 1 },
      { id: 'km2', name: 'كيلومتر مربع', symbol: 'km²', factor: 1000000 },
      { id: 'ha', name: 'هكتار', symbol: 'ha', factor: 10000 },
      { id: 'ac', name: 'فدان', symbol: 'ac', factor: 4046.86 },
      { id: 'ft2', name: 'قدم مربع', symbol: 'ft²', factor: 0.092903 },
    ],
  },
];

// ============================================================
// دوال التحويل
// ============================================================
function convertTemperature(value: number, fromId: string, toId: string): number {
  if (fromId === toId) return value;

  // تحويل إلى سيليزيوس أولاً
  let celsius: number;
  switch (fromId) {
    case 'c':
      celsius = value;
      break;
    case 'f':
      celsius = (value - 32) * (5 / 9);
      break;
    case 'k':
      celsius = value - 273.15;
      break;
    default:
      celsius = value;
  }

  // من سيليزيوس إلى الوحدة الهدف
  switch (toId) {
    case 'c':
      return celsius;
    case 'f':
      return celsius * (9 / 5) + 32;
    case 'k':
      return celsius + 273.15;
    default:
      return celsius;
  }
}

function convertValue(
  value: number,
  fromUnit: Unit,
  toUnit: Unit,
  isTemp: boolean,
): number {
  if (isTemp) return convertTemperature(value, fromUnit.id, toUnit.id);
  if (fromUnit.id === toUnit.id) return value;
  return (value * fromUnit.factor) / toUnit.factor;
}

/**
 * تنسيق الأرقام بشكل مقروء
 * - يحذف الأصفار الزائدة
 * - يستخدم الترميز العلمي فقط للأرقام شديدة الصغر أو الكبر
 */
function formatNumber(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  if (value === 0) return '0';

  const abs = Math.abs(value);

  if (abs < 1e-6 || abs >= 1e12) {
    return value.toExponential(4);
  }

  // تقريب ذكي حسب حجم الرقم
  let decimals: number;
  if (abs >= 1000) decimals = 2;
  else if (abs >= 1) decimals = 4;
  else if (abs >= 0.001) decimals = 6;
  else decimals = 8;

  const rounded = parseFloat(value.toFixed(decimals));
  return rounded.toString();
}

/**
 * تحليل الإدخال مع دعم الأرقام العربية والفواصل
 */
function parseInput(text: string): number {
  if (!text) return NaN;
  const normalized = text
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/,/g, '.');
  return parseFloat(normalized);
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

  const fromUnit = useMemo(() => {
    return category.units.find((u) => u.id === fromUnitId) ?? category.units[0];
  }, [category, fromUnitId]);

  const toUnit = useMemo(() => {
    return (
      category.units.find((u) => u.id === toUnitId) ??
      category.units[1] ??
      category.units[0]
    );
  }, [category, toUnitId]);

  const numericValue = useMemo(() => parseInput(inputValue), [inputValue]);
  const isValid = !isNaN(numericValue);

  const result = useMemo(() => {
    if (!isValid) return NaN;
    return convertValue(numericValue, fromUnit, toUnit, isTemp);
  }, [numericValue, isValid, fromUnit, toUnit, isTemp]);

  const resultText = useMemo(
    () => (isValid ? formatNumber(result) : '—'),
    [isValid, result],
  );

  const formula = useMemo(() => {
    if (!isValid) return 'أدخل رقماً صحيحاً';
    return `${inputValue.trim()} ${fromUnit.symbol} = ${resultText} ${toUnit.symbol}`;
  }, [isValid, inputValue, fromUnit, toUnit, resultText]);

  // ----- الأحداث -----
  const changeCategory = useCallback((index: number) => {
    setActiveCategoryIndex(index);
    const newCat = CATEGORIES[index];
    if (newCat.units.length >= 2) {
      setFromUnitId(newCat.units[0].id);
      setToUnitId(newCat.units[1].id);
    } else if (newCat.units.length === 1) {
      setFromUnitId(newCat.units[0].id);
      setToUnitId(newCat.units[0].id);
    }
  }, []);

  const swapUnits = useCallback(() => {
    setFromUnitId((prevFrom) => {
      setToUnitId(prevFrom);
      return toUnitId;
    });
    // اهتزاز خفيف عند التبديل
    if (Platform.OS === 'android') {
      // Vibration.vibrate(10); // اختياري
    }
  }, [toUnitId]);

  const copyResult = useCallback(() => {
    if (!isValid) {
      Alert.alert('تنبيه', 'لا توجد نتيجة صحيحة لنسخها');
      return;
    }
    Clipboard.setString(resultText);
    setCopied(true);
    Keyboard.dismiss();
    setTimeout(() => setCopied(false), 1500);
  }, [isValid, resultText]);

  const reset = useCallback(() => {
    setInputValue('1');
    if (category.units.length >= 2) {
      setFromUnitId(category.units[0].id);
      setToUnitId(category.units[1].id);
    }
  }, [category]);

  const handleInputChange = useCallback((text: string) => {
    // اسمح فقط بالأرقام والفواصل والعلامة السالبة
    const cleaned = text.replace(/[^0-9٠-٩۰-۹.,\-]/g, '');
    setInputValue(cleaned);
  }, []);

  const clearInput = useCallback(() => setInputValue(''), []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>محوّل الوحدات</Text>
        <Text style={styles.headerSubtitle}>أداة سريعة ودقيقة للتحويل بين الوحدات</Text>
      </View>

      {/* التبويبات */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}>
          {CATEGORIES.map((cat, index) => {
            const active = index === activeCategoryIndex;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => changeCategory(index)}
                activeOpacity={0.7}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* بطاقة "من" */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>من</Text>
            <Text style={styles.unitSymbolHint}>{fromUnit.symbol}</Text>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.valueInput}
              keyboardType="numeric"
              value={inputValue}
              onChangeText={handleInputChange}
              selectTextOnFocus
              placeholder="0"
              placeholderTextColor={COLORS.muted}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {inputValue.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearInput}
                activeOpacity={0.6}>
                <Text style={styles.clearButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          <UnitSelector
            units={category.units}
            selectedId={fromUnit.id}
            onSelect={setFromUnitId}
            keyPrefix="from"
          />
        </View>

        {/* زر التبديل */}
        <TouchableOpacity
          style={styles.swapButton}
          onPress={swapUnits}
          activeOpacity={0.7}>
          <Text style={styles.swapIcon}>⇅</Text>
          <Text style={styles.swapButtonText}>تبديل</Text>
        </TouchableOpacity>

        {/* بطاقة "إلى" */}
        <View style={[styles.card, styles.cardResult]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>إلى</Text>
            <Text style={styles.unitSymbolHint}>{toUnit.symbol}</Text>
          </View>

          <Text
            style={[styles.resultValue, !isValid && styles.resultValueInvalid]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}>
            {resultText}
          </Text>

          <UnitSelector
            units={category.units}
            selectedId={toUnit.id}
            onSelect={setToUnitId}
            keyPrefix="to"
          />
        </View>

        {/* الصيغة */}
        <View style={styles.formulaBox}>
          <Text style={styles.formulaText}>{formula}</Text>
        </View>

        {/* الأزرار */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonPrimary,
              !isValid && styles.actionButtonDisabled,
            ]}
            onPress={copyResult}
            activeOpacity={0.7}
            disabled={!isValid}>
            <Text style={styles.actionButtonPrimaryText}>
              {copied ? '✓ تم النسخ' : 'نسخ النتيجة'}
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
// مكوّن فرعي لاختيار الوحدة
// ============================================================
type UnitSelectorProps = {
  units: Unit[];
  selectedId: string;
  onSelect: (id: string) => void;
  keyPrefix: string;
};

function UnitSelector({ units, selectedId, onSelect, keyPrefix }: UnitSelectorProps) {
  return (
    <View style={styles.unitSelector}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.unitSelectorContent}>
        {units.map((unit) => {
          const active = unit.id === selectedId;
          return (
            <TouchableOpacity
              key={`${keyPrefix}-${unit.id}`}
              style={[styles.unitChip, active && styles.unitChipActive]}
              onPress={() => onSelect(unit.id)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.unitChipSymbol,
                  active && styles.unitChipSymbolActive,
                ]}>
                {unit.symbol}
              </Text>
              <Text
                style={[
                  styles.unitChipText,
                  active && styles.unitChipTextActive,
                ]}>
                {unit.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
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
  danger: '#FF5A5F',
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
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

  // التبويبات
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  tabsContent: {
    paddingHorizontal: 14,
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

  // الجسم
  body: { flex: 1 },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // البطاقات
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
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  unitSymbolHint: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  // الإدخال
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  valueInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '700',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 56,
  },
  clearButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  clearButtonText: {
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },

  // النتيجة
  resultValue: {
    color: COLORS.success,
    fontSize: 30,
    fontWeight: '700',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 56,
  },
  resultValueInvalid: {
    color: COLORS.muted,
  },

  // اختيار الوحدة
  unitSelector: {
    marginTop: 12,
  },
  unitSelectorContent: {
    paddingRight: 4,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 64,
  },
  unitChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },
  unitChipSymbol: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  unitChipSymbolActive: {
    color: '#FFFFFF',
  },
  unitChipText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  unitChipTextActive: {
    color: '#EAF3FF',
  },

  // زر التبديل
  swapButton: {
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  swapIcon: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  swapButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  // الصيغة
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

  // الأزرار
  actionsRow: {
    flexDirection: 'row-reverse',
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
    marginLeft: 10,
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonDisabled: {
    opacity: 0.4,
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

  // التذييل
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 11,
  },
});