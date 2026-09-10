import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { sanitizeVoiceExtraction, VoiceListingResponse } from '@/lib/services/voiceListing';

// Maximum audio payload size (10 MB)
const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;

// Permitted MIME types for audio uploads
const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mpeg',
  'audio/mp3',
  'audio/flac',
];

const SYSTEM_INSTRUCTION = `You are the AgriLink AI Voice Listing Assistant (SIH26033).
Your job is to extract agricultural produce listing details from a farmer or FPO's speech.

The farmer may speak in Telugu, English, or a natural Telugu-English mix (code-mixing).

You must extract ONLY information explicitly stated in the speech into this exact JSON schema:
- product: string or null. Standardized English produce/commodity name (e.g. "టమాటాలు" -> "Tomato", "ఉల్లిపాయలు" -> "Onion", "బంగాళాదుంపలు" -> "Potato", "వరి" or "బియ్యం" -> "Basmati Rice", "గోధుమలు" -> "Wheat", "పసుపు" -> "Turmeric", "మిర్చి" -> "Red Chilli", "మామిడి" -> "Alphonso Mango", "అరటి" -> "Banana", "పాలు" -> "Farm Fresh Milk (A2)", "నెయ్యి" -> "Pure Cow Ghee"). If not mentioned or unclear, null.
- quantity: number or null. Only the numeric quantity. If missing or unclear, null.
- unit: string or null. Normalize to "kg", "quintal", or "tonne". If not stated, null.
- price: number or null. Only the numeric price quoted by the farmer. If not stated, null.
- location: string or null. Farm, village, APMC mandi, or city location explicitly mentioned. If not stated, null.
- harvestDate: string or null. Harvest date if explicitly stated (format YYYY-MM-DD or textual date). If not stated, null.
- availabilityDate: string or null. Date/time when produce will be ready for pickup/delivery if explicitly stated. If not stated, null.
- rawTranscription: string or null. Exact verbatim transcription of what was spoken.
- detectedLanguage: "telugu" | "english" | "mixed" | "unknown".

STRICT RULES:
1. Missing information -> null.
2. NEVER invent, guess, or assume values.
3. NEVER assume a price. If price is not mentioned, price must be null.
4. NEVER assume a quantity. If quantity is not mentioned, quantity must be null.
5. NEVER assume a location. If location is not mentioned, location must be null.
6. NEVER infer harvest date unless explicitly stated.
7. Normalize common units:
   - kilogram/kg/kilos/కిలో/కేజీ -> "kg"
   - quintal/quintals/క్వింటా/క్వింటాలు -> "quintal"
   - tonne/tonnes/టన్ను -> "tonne"
8. Accurately extract numbers spoken in Telugu:
   - "వంద" = 100, "రెండు వందలు" = 200, "ఐదు వందలు" = 500, "వెయ్యి" = 1000
   - "పది" = 10, "ఇరవై" = 20, "ఇరవై ఐదు" = 25, "ముప్పై" = 30, "ముప్పై ఐదు" = 35, "యాభై" = 50
9. If speech is silent, noisy, or contains no produce information, all extraction fields must be null.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json<VoiceListingResponse>(
        {
          success: false,
          data: {
            product: null,
            quantity: null,
            unit: null,
            price: null,
            location: null,
            harvestDate: null,
            availabilityDate: null,
          },
          error:
            'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in server environment variables or enter produce details manually.',
          message: 'Voice processing is currently unavailable. Please enter details manually.',
        },
        { status: 503 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let audioBuffer: Buffer | null = null;
    let audioMimeType = 'audio/webm';
    let textPrompt: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('audio') as File | null;
      const directText = formData.get('textPrompt') as string | null;

      if (directText && directText.trim()) {
        textPrompt = directText.trim();
      }

      if (file) {
        if (file.size > MAX_AUDIO_SIZE_BYTES) {
          return NextResponse.json<VoiceListingResponse>(
            {
              success: false,
              data: {
                product: null,
                quantity: null,
                unit: null,
                price: null,
                location: null,
                harvestDate: null,
                availabilityDate: null,
              },
              error: 'Audio recording exceeds 10MB limit.',
              message: 'Audio recording is too long. Please record a shorter voice note or enter details manually.',
            },
            { status: 413 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          return NextResponse.json<VoiceListingResponse>(
            {
              success: false,
              data: {
                product: null,
                quantity: null,
                unit: null,
                price: null,
                location: null,
                harvestDate: null,
                availabilityDate: null,
              },
              error: 'Empty audio recording received.',
              message: 'No speech was recorded. Please speak clearly and try again.',
            },
            { status: 400 }
          );
        }

        audioBuffer = Buffer.from(arrayBuffer);
        audioMimeType = file.type || 'audio/webm';
      }
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      if (body.textPrompt && typeof body.textPrompt === 'string') {
        textPrompt = body.textPrompt.trim();
      }

      if (body.audioBase64 && typeof body.audioBase64 === 'string') {
        audioBuffer = Buffer.from(body.audioBase64, 'base64');
        audioMimeType = body.mimeType || 'audio/webm';

        if (audioBuffer.length > MAX_AUDIO_SIZE_BYTES) {
          return NextResponse.json<VoiceListingResponse>(
            {
              success: false,
              data: {
                product: null,
                quantity: null,
                unit: null,
                price: null,
                location: null,
                harvestDate: null,
                availabilityDate: null,
              },
              error: 'Audio recording exceeds 10MB limit.',
              message: 'Audio recording is too long. Please record a shorter voice note or enter details manually.',
            },
            { status: 413 }
          );
        }
      }
    } else {
      return NextResponse.json<VoiceListingResponse>(
        {
          success: false,
          data: {
            product: null,
            quantity: null,
            unit: null,
            price: null,
            location: null,
            harvestDate: null,
            availabilityDate: null,
          },
          error: 'Unsupported content type. Expected multipart/form-data or application/json.',
          message: 'Invalid request format.',
        },
        { status: 415 }
      );
    }

    if (!audioBuffer && !textPrompt) {
      return NextResponse.json<VoiceListingResponse>(
        {
          success: false,
          data: {
            product: null,
            quantity: null,
            unit: null,
            price: null,
            location: null,
            harvestDate: null,
            availabilityDate: null,
          },
          error: 'No audio or text content received.',
          message: 'No voice input detected. Please try recording again.',
        },
        { status: 400 }
      );
    }

    // Clean MIME type (remove parameters like codecs=opus)
    const baseMimeType = audioMimeType.split(';')[0].trim().toLowerCase();
    const isMimeAllowed = ALLOWED_AUDIO_MIME_TYPES.some((m) => baseMimeType.startsWith(m) || baseMimeType.startsWith('audio/'));
    if (audioBuffer && !isMimeAllowed) {
      return NextResponse.json<VoiceListingResponse>(
        {
          success: false,
          data: {
            product: null,
            quantity: null,
            unit: null,
            price: null,
            location: null,
            harvestDate: null,
            availabilityDate: null,
          },
          error: `Unsupported audio format: ${audioMimeType}`,
          message: 'Unsupported audio format. Please try again or enter details manually.',
        },
        { status: 415 }
      );
    }

    // Initialize Google Gen AI client
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    // Build content parts
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (textPrompt) {
      parts.push({
        text: `Farmer spoken statement to extract details from:\n"${textPrompt}"`,
      });
    }

    if (audioBuffer) {
      parts.push({
        text: 'Listen carefully to the farmer audio. Identify produce name, quantity, unit, price, and location according to the instructions.',
      });
      parts.push({
        inlineData: {
          mimeType: baseMimeType || 'audio/webm',
          data: audioBuffer.toString('base64'),
        },
      });
    }

    // Call Gemini API with structured JSON output schema
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: parts as any,
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            product: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            price: { type: Type.NUMBER },
            location: { type: Type.STRING },
            harvestDate: { type: Type.STRING },
            availabilityDate: { type: Type.STRING },
            rawTranscription: { type: Type.STRING },
            detectedLanguage: { type: Type.STRING },
          },
          required: [
            'product',
            'quantity',
            'unit',
            'price',
            'location',
            'harvestDate',
            'availabilityDate',
          ],
        },
        temperature: 0.1, // High determinism for factual agricultural extraction
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini API returned an empty response.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new Error('Failed to parse structured JSON from Gemini response.');
    }

    const sanitizedData = sanitizeVoiceExtraction(parsed);

    return NextResponse.json<VoiceListingResponse>({
      success: true,
      data: sanitizedData,
      message: 'Please check your details before publishing.',
    });
  } catch (err: unknown) {
    console.error('[AgriLink Voice Listing Error]:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown processing error';

    return NextResponse.json<VoiceListingResponse>(
      {
        success: false,
        data: {
          product: null,
          quantity: null,
          unit: null,
          price: null,
          location: null,
          harvestDate: null,
          availabilityDate: null,
        },
        error: errorMessage,
        message: 'Voice processing failed. Please try again or enter the details manually.',
      },
      { status: 500 }
    );
  }
}
