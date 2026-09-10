import { ProduceCategory } from '@/types/database.types';
import { SEEDED_MANDI_RATES } from '@/lib/services/fairPrice';

/**
 * Structured Voice Extraction Data Schema
 * Strictly adheres to SIH26033 AI Voice Listing Assistant requirements.
 */
export interface VoiceExtractionData {
  product: string | null;
  quantity: number | null;
  unit: string | null;
  price: number | null;
  location: string | null;
  harvestDate: string | null;
  availabilityDate: string | null;
  rawTranscription?: string | null;
  detectedLanguage?: 'telugu' | 'english' | 'mixed' | 'unknown' | null;
}

export interface VoiceListingResponse {
  success: boolean;
  data: VoiceExtractionData;
  message: string;
  error?: string;
}

/**
 * Normalizes common spoken units to standardized values and computes normalized quantity in Kilograms (kg).
 * Standard APMC / Indian Agricultural units:
 * - 1 quintal = 100 kg
 * - 1 tonne = 1,000 kg
 */
export function normalizeExtractedQuantity(
  quantity: number | null | undefined,
  unit: string | null | undefined
): { quantityKg: number | null; standardizedUnit: string | null } {
  if (quantity == null || isNaN(quantity) || quantity <= 0) {
    return { quantityKg: null, standardizedUnit: null };
  }

  if (!unit) {
    return { quantityKg: quantity, standardizedUnit: 'kg' };
  }

  const u = unit.toLowerCase().trim();

  // Quintal: 1 quintal = 100 kg
  if (
    u === 'quintal' ||
    u === 'quintals' ||
    u === 'qtl' ||
    u.includes('క్వింటా') ||
    u.includes('quintal')
  ) {
    return {
      quantityKg: Math.round(quantity * 100 * 100) / 100,
      standardizedUnit: 'quintal',
    };
  }

  // Tonne / Ton: 1 tonne = 1000 kg
  if (
    u === 'tonne' ||
    u === 'tonnes' ||
    u === 'ton' ||
    u === 'tons' ||
    u.includes('టన్ను') ||
    u.includes('ton')
  ) {
    return {
      quantityKg: Math.round(quantity * 1000 * 100) / 100,
      standardizedUnit: 'tonne',
    };
  }

  // Kilogram / kg
  if (
    u === 'kg' ||
    u === 'kgs' ||
    u === 'kilo' ||
    u === 'kilos' ||
    u === 'kilogram' ||
    u === 'kilograms' ||
    u.includes('కిలో') ||
    u.includes('కేజీ')
  ) {
    return {
      quantityKg: Math.round(quantity * 100) / 100,
      standardizedUnit: 'kg',
    };
  }

  // Gram: 1000 g = 1 kg
  if (u === 'g' || u === 'gram' || u === 'grams' || u.includes('గ్రామ')) {
    return {
      quantityKg: Math.round((quantity / 1000) * 100) / 100,
      standardizedUnit: 'kg',
    };
  }

  // Default fallback assumes kg for farm batches
  return {
    quantityKg: Math.round(quantity * 100) / 100,
    standardizedUnit: u,
  };
}

/**
 * Normalizes price when farmer quotes per-quintal or per-tonne rates to price per kg.
 */
export function normalizePricePerKg(
  price: number | null | undefined,
  unit: string | null | undefined
): number | null {
  if (price == null || isNaN(price) || price <= 0) return null;

  if (!unit) return price;

  const u = unit.toLowerCase().trim();

  // If price is explicitly stated per quintal (e.g. ₹3200 per quintal -> ₹32/kg)
  if (
    u === 'quintal' ||
    u === 'quintals' ||
    u === 'qtl' ||
    u.includes('క్వింటా')
  ) {
    // Only convert if price looks like a quintal rate (> ₹200)
    if (price >= 200) {
      return Math.round((price / 100) * 10) / 10;
    }
  }

  // If price is per tonne (e.g. ₹30000 per tonne -> ₹30/kg)
  if (
    u === 'tonne' ||
    u === 'tonnes' ||
    u === 'ton' ||
    u.includes('టన్ను')
  ) {
    if (price >= 1000) {
      return Math.round((price / 1000) * 10) / 10;
    }
  }

  return Math.round(price * 10) / 10;
}

/**
 * Maps extracted produce name (English, Telugu, or transliterated) to standard AgriLink ProduceCategory.
 */
export function inferCategoryFromProduceName(product: string | null | undefined): ProduceCategory | null {
  if (!product) return null;

  const p = product.toLowerCase();

  // 1. Spices
  const spiceKeywords = [
    'turmeric', 'chilli', 'chili', 'mirchi', 'pepper', 'ginger', 'garlic',
    'cardamom', 'clove', 'coriander', 'cumin', 'mustard', 'cinnamon',
    'పసుపు', 'మిర్చి', 'మిరపకాయ', 'అల్లం', 'వెల్లుల్లి', 'జీలకర్ర', 'ధనియాలు'
  ];
  if (spiceKeywords.some((k) => p.includes(k))) {
    return 'spices';
  }

  // 2. Grains & Pulses
  const grainKeywords = [
    'wheat', 'rice', 'paddy', 'basmati', 'dal', 'toor', 'pigeon pea', 'moong',
    'urad', 'chana', 'gram', 'maize', 'corn', 'jowar', 'bajra', 'millet', 'barley',
    'వరి', 'బియ్యం', 'గోధుమ', 'కందిపప్పు', 'మినప్పప్పు', 'పెసరపప్పు', 'శనగలు', 'జొన్నలు', 'సజ్జలు', 'మొక్కజొన్న'
  ];
  if (grainKeywords.some((k) => p.includes(k))) {
    return 'grains_pulses';
  }

  // 3. Dairy & Other
  const dairyKeywords = [
    'milk', 'ghee', 'curd', 'butter', 'paneer', 'cheese', 'yogurt', 'honey',
    'పాలు', 'నెయ్యి', 'పెరుగు', 'వెన్న', 'తేనె'
  ];
  if (dairyKeywords.some((k) => p.includes(k))) {
    return 'dairy_other';
  }

  // 4. Fruits
  const fruitKeywords = [
    'mango', 'alphonso', 'apple', 'banana', 'pomegranate', 'orange', 'papaya',
    'guava', 'watermelon', 'grapes', 'lime', 'lemon', 'pineapple', 'sapota',
    'మామిడి', 'అరటి', 'దానిమ్మ', 'ఆపిల్', 'బత్తాయి', 'బొప్పాయి', 'జామ', 'ద్రాక్ష'
  ];
  if (fruitKeywords.some((k) => p.includes(k))) {
    return 'fruits';
  }

  // 5. Fresh Vegetables (Default / primary)
  const vegKeywords = [
    'tomato', 'potato', 'onion', 'spinach', 'cauliflower', 'cabbage', 'brinjal',
    'eggplant', 'carrot', 'radish', 'okra', 'ladyfinger', 'bhendi', 'cucumber',
    'capsicum', 'peas', 'beans', 'gourd', 'bitter gourd', 'bottle gourd',
    'టమాటా', 'టమాటాలు', 'ఉల్లి', 'ఉల్లిపాయలు', 'బంగాళాదుంప', 'పాలకూర', 'క్యాలీఫ్లవర్', 'వంకాయ', 'బెండకాయ'
  ];
  if (vegKeywords.some((k) => p.includes(k))) {
    return 'vegetables';
  }

  return 'vegetables'; // fallback to fresh vegetables as dominant category
}

/**
 * Matches extracted location string against AgriLink's seeded APMC mandis.
 */
export function matchMandiLocation(
  locationStr: string | null | undefined,
  category?: ProduceCategory
): string | null {
  if (!locationStr || !locationStr.trim()) return null;

  const loc = locationStr.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const rates = category
    ? SEEDED_MANDI_RATES.filter((r) => r.category === category)
    : SEEDED_MANDI_RATES;

  // Check mandi name, district, or state
  for (const r of rates) {
    const mandiName = r.mandiName.toLowerCase();
    const district = r.district.toLowerCase();
    const state = r.state.toLowerCase();

    if (
      loc.includes(mandiName) ||
      mandiName.includes(loc) ||
      loc.includes(district) ||
      district.includes(loc) ||
      (loc.length >= 4 && (loc.includes(state) || state.includes(loc)))
    ) {
      return r.id;
    }
  }

  return null;
}

/**
 * Validates raw output from Gemini, sanitizing nulls and ensuring strict schema adherence.
 */
export function sanitizeVoiceExtraction(raw: unknown): VoiceExtractionData {
  if (!raw || typeof raw !== 'object') {
    return {
      product: null,
      quantity: null,
      unit: null,
      price: null,
      location: null,
      harvestDate: null,
      availabilityDate: null,
    };
  }

  const obj = raw as Record<string, unknown>;

  const cleanString = (val: unknown): string | null => {
    if (typeof val === 'string' && val.trim() !== '' && val.toLowerCase() !== 'null' && val.toLowerCase() !== 'unknown') {
      return val.trim();
    }
    return null;
  };

  const cleanNumber = (val: unknown): number | null => {
    if (typeof val === 'number' && !isNaN(val) && val > 0) {
      return val;
    }
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return null;
  };

  return {
    product: cleanString(obj.product),
    quantity: cleanNumber(obj.quantity),
    unit: cleanString(obj.unit)?.toLowerCase() || null,
    price: cleanNumber(obj.price),
    location: cleanString(obj.location),
    harvestDate: cleanString(obj.harvestDate),
    availabilityDate: cleanString(obj.availabilityDate),
    rawTranscription: cleanString(obj.rawTranscription),
    detectedLanguage: (cleanString(obj.detectedLanguage) as VoiceExtractionData['detectedLanguage']) || null,
  };
}
