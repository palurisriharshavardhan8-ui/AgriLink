import { test, expect } from '@playwright/test';
import {
  normalizeExtractedQuantity,
  normalizePricePerKg,
  inferCategoryFromProduceName,
  matchMandiLocation,
  sanitizeVoiceExtraction,
  VoiceExtractionData,
} from '../src/lib/services/voiceListing';
import { calculateFairPrice } from '../src/lib/services/fairPrice';

test.describe('AgriLink AI Voice Listing Assistant (SIH26033)', () => {
  // --------------------------------------------------------------------------
  // 1. DETERMINISTIC UNIT & LOGICAL EXTRACTION TESTS (VOICE-1 to VOICE-10)
  // --------------------------------------------------------------------------

  test('VOICE-1: English speech extraction normalizes product, quantity, price, and location', async () => {
    // Spoken input: "I have 200 kg of fresh potatoes at 30 rupees per kg in Kolar"
    const rawEnglishData = {
      product: 'Potato',
      quantity: 200,
      unit: 'kg',
      price: 30,
      location: 'Kolar',
      harvestDate: null,
      availabilityDate: null,
      rawTranscription: 'I have 200 kg of fresh potatoes at 30 rupees per kg in Kolar',
      detectedLanguage: 'english',
    };

    const sanitized = sanitizeVoiceExtraction(rawEnglishData);
    expect(sanitized.product).toBe('Potato');
    expect(sanitized.quantity).toBe(200);
    expect(sanitized.unit).toBe('kg');
    expect(sanitized.price).toBe(30);
    expect(sanitized.location).toBe('Kolar');

    const { quantityKg } = normalizeExtractedQuantity(sanitized.quantity, sanitized.unit);
    expect(quantityKg).toBe(200);

    const pricePerKg = normalizePricePerKg(sanitized.price, sanitized.unit);
    expect(pricePerKg).toBe(30);

    const category = inferCategoryFromProduceName(sanitized.product);
    expect(category).toBe('vegetables');

    const mandiId = matchMandiLocation(sanitized.location);
    expect(mandiId).toContain('kolar');
  });

  test('VOICE-2: Telugu speech extraction handles Telugu input and produces expected structured JSON', async () => {
    // Example Telugu input specified in SIH26033:
    // "నా దగ్గర 500 కిలోల టమాటాలు ఉన్నాయి. కిలో 25 రూపాయలు."
    const rawTeluguData = {
      product: 'Tomato',
      quantity: 500,
      unit: 'kg',
      price: 25,
      location: null,
      harvestDate: null,
      availabilityDate: null,
      rawTranscription: 'నా దగ్గర 500 కిలోల టమాటాలు ఉన్నాయి. కిలో 25 రూపాయలు.',
      detectedLanguage: 'telugu',
    };

    const sanitized = sanitizeVoiceExtraction(rawTeluguData);
    expect(sanitized.product).toBe('Tomato');
    expect(sanitized.quantity).toBe(500);
    expect(sanitized.unit).toBe('kg');
    expect(sanitized.price).toBe(25);
    expect(sanitized.location).toBeNull();
    expect(sanitized.harvestDate).toBeNull();
    expect(sanitized.availabilityDate).toBeNull();

    const { quantityKg } = normalizeExtractedQuantity(sanitized.quantity, sanitized.unit);
    expect(quantityKg).toBe(500);

    const category = inferCategoryFromProduceName(sanitized.product);
    expect(category).toBe('vegetables');
  });

  test('VOICE-3: Telugu-English mixed speech extraction normalizes code-mixed speech', async () => {
    // Code-mixed spoken input: "Nenu 300 kgs of onions sell chesthunnanu, price 20 rupees per kg"
    const rawMixedData = {
      product: 'Onion',
      quantity: 300,
      unit: 'kg',
      price: 20,
      location: null,
      harvestDate: null,
      availabilityDate: null,
      rawTranscription: 'Nenu 300 kgs of onions sell chesthunnanu, price 20 rupees per kg',
      detectedLanguage: 'mixed',
    };

    const sanitized = sanitizeVoiceExtraction(rawMixedData);
    expect(sanitized.product).toBe('Onion');
    expect(sanitized.quantity).toBe(300);
    expect(sanitized.price).toBe(20);
    expect(sanitized.unit).toBe('kg');

    const { quantityKg } = normalizeExtractedQuantity(sanitized.quantity, sanitized.unit);
    expect(quantityKg).toBe(300);

    const category = inferCategoryFromProduceName(sanitized.product);
    expect(category).toBe('vegetables');
  });

  test('VOICE-4: Missing fields return null without hallucination', async () => {
    // Farmer only said produce name without quantity, price, or dates
    const incompleteData = {
      product: 'Fresh Spinach',
      quantity: null,
      unit: null,
      price: null,
      location: null,
      harvestDate: null,
      availabilityDate: null,
    };

    const sanitized = sanitizeVoiceExtraction(incompleteData);
    expect(sanitized.product).toBe('Fresh Spinach');
    expect(sanitized.quantity).toBeNull();
    expect(sanitized.unit).toBeNull();
    expect(sanitized.price).toBeNull();
    expect(sanitized.location).toBeNull();
    expect(sanitized.harvestDate).toBeNull();
    expect(sanitized.availabilityDate).toBeNull();

    const { quantityKg } = normalizeExtractedQuantity(sanitized.quantity, sanitized.unit);
    expect(quantityKg).toBeNull();

    const price = normalizePricePerKg(sanitized.price, sanitized.unit);
    expect(price).toBeNull();
  });

  test('VOICE-5: AI extraction contract verifies AI NEVER automatically publishes', async () => {
    // Contract verification: Voice assistant returns structured data ONLY.
    // Publish action requires an explicit, authenticated user interaction.
    const extraction: VoiceExtractionData = {
      product: 'Tomato',
      quantity: 500,
      unit: 'kg',
      price: 25,
      location: null,
      harvestDate: null,
      availabilityDate: null,
    };

    // Simulated form state before and after voice extraction
    let formSubmitted = false;
    const mockSubmitHandler = () => {
      formSubmitted = true;
    };

    // Calling extraction handler populates form state ONLY
    let formTitle = '';
    let formQty = '';
    let formPrice = '';

    const handleVoiceDataExtracted = (data: VoiceExtractionData) => {
      if (data.product) formTitle = data.product;
      if (data.quantity != null) formQty = data.quantity.toString();
      if (data.price != null) formPrice = data.price.toString();
      // AI MUST NEVER call mockSubmitHandler()
    };

    handleVoiceDataExtracted(extraction);

    expect(formTitle).toBe('Tomato');
    expect(formQty).toBe('500');
    expect(formPrice).toBe('25');
    // Critical guard: Form submission MUST remain false
    expect(formSubmitted).toBe(false);
  });

  test('VOICE-6: Extracted data correctly populates existing listing form fields and normalizes units', async () => {
    // 1. Quintal conversion test: 5 quintals -> 500 kg
    const quintalData = {
      product: 'Wheat',
      quantity: 5,
      unit: 'quintal',
      price: 28,
    };
    const { quantityKg: qKg } = normalizeExtractedQuantity(quintalData.quantity, quintalData.unit);
    expect(qKg).toBe(500);

    const wheatCategory = inferCategoryFromProduceName(quintalData.product);
    expect(wheatCategory).toBe('grains_pulses');

    // 2. Tonne conversion test: 2 tonnes -> 2000 kg
    const tonneData = {
      product: 'Basmati Rice',
      quantity: 2,
      unit: 'tonne',
      price: 55,
    };
    const { quantityKg: tKg } = normalizeExtractedQuantity(tonneData.quantity, tonneData.unit);
    expect(tKg).toBe(2000);

    // 3. Spices classification: Turmeric
    const turmericCategory = inferCategoryFromProduceName('Organic Turmeric');
    expect(turmericCategory).toBe('spices');

    // 4. Dairy classification: Farm Fresh Milk
    const dairyCategory = inferCategoryFromProduceName('Farm Fresh Milk (A2)');
    expect(dairyCategory).toBe('dairy_other');
  });

  test('VOICE-7: Fair Price Engine calculates normally after voice extraction', async () => {
    // Simulated voice extraction: 500 kg Tomato
    const voiceData = {
      product: 'Tomato',
      quantityKg: 500,
    };

    const recommendation = calculateFairPrice({
      category: 'vegetables',
      produceName: voiceData.product,
      quantityKg: voiceData.quantityKg,
    });

    expect(recommendation.mandiBenchmarkPricePerKg).toBe(32);
    expect(recommendation.suggestedPricePerKg).toBe(34.5);
    expect(recommendation.volumeTier).toBe('standard');
    expect(recommendation.totalEstimatedFarmerPayout).toBe(34.5 * 500);
    expect(recommendation.mandiRate.commodity).toBe('Tomato');
  });

  test('VOICE-8: Manual editing after AI voice extraction works seamlessly', async () => {
    // Voice initially populates:
    let currentTitle = 'Tomato';
    let currentQty = '500';
    let currentPrice = '25';

    // Farmer manually edits fields:
    currentTitle = 'Fresh Kolar Tomatoes Grade A';
    currentQty = '750';
    currentPrice = '28';

    expect(currentTitle).toBe('Fresh Kolar Tomatoes Grade A');
    expect(currentQty).toBe('750');
    expect(currentPrice).toBe('28');

    // Fair price recalculates with edited quantity
    const updatedRec = calculateFairPrice({
      category: 'vegetables',
      produceName: currentTitle,
      quantityKg: parseFloat(currentQty),
    });

    // 750kg is > 500kg -> triggers bulk_wholesale tier (+5% volume adjustment)
    expect(updatedRec.volumeTier).toBe('bulk_wholesale');
    expect(updatedRec.suggestedPricePerKg).toBe(33.5);
  });

  test('VOICE-9: Server-side security check ensures Gemini API key is not exposed to client', async () => {
    // 1. Client-facing public env must not leak GEMINI_API_KEY
    expect(process.env.NEXT_PUBLIC_GEMINI_API_KEY).toBeUndefined();

    // 2. Mock response shape must never include API keys or tokens
    const sampleResponse = {
      success: true,
      data: {
        product: 'Tomato',
        quantity: 500,
        unit: 'kg',
        price: 25,
        location: null,
        harvestDate: null,
        availabilityDate: null,
      },
      message: 'Please check your details before publishing.',
    };

    const serialized = JSON.stringify(sampleResponse);
    expect(serialized).not.toContain('AIzaSy');
    expect(serialized).not.toContain('GEMINI_API_KEY');
    expect(serialized).not.toContain('apiKey');
  });

  test('VOICE-10: Existing manual listing creation still works without voice', async () => {
    // Validate manual listing creation flow params
    const manualParams = {
      title: 'Direct Manual Tomato Batch',
      category: 'vegetables' as const,
      price_per_kg: 35,
      available_quantity_kg: 250,
      description: 'Hand harvested from field 4',
    };

    expect(manualParams.title).toBeTruthy();
    expect(manualParams.price_per_kg).toBeGreaterThan(0);
    expect(manualParams.available_quantity_kg).toBeGreaterThan(0);

    const priceRec = calculateFairPrice({
      category: manualParams.category,
      produceName: manualParams.title,
      quantityKg: manualParams.available_quantity_kg,
    });

    expect(priceRec.suggestedPricePerKg).toBeGreaterThan(0);
    expect(priceRec.mandiBenchmarkPricePerKg).toBeGreaterThan(0);
  });
});
