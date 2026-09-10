'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Mic,
  MicOff,
  Square,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Volume2,
  X,
  Loader2,
} from 'lucide-react';
import {
  VoiceExtractionData,
  VoiceListingResponse,
} from '@/lib/services/voiceListing';

interface VoiceListingAssistantProps {
  onDataExtracted: (data: VoiceExtractionData) => void;
  disabled?: boolean;
}

type RecordingState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'processing'
  | 'success'
  | 'error';

const MAX_RECORDING_SECONDS = 30;

export const VoiceListingAssistant: React.FC<VoiceListingAssistantProps> = ({
  onDataExtracted,
  disabled = false,
}) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [extractedData, setExtractedData] = useState<VoiceExtractionData | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up media streams and timers on unmount
  const cleanupStream = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  // Handle stopping recording and submitting to server API
  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Timer effect for recording duration limit
  useEffect(() => {
    if (state === 'recording') {
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            handleStopRecording();
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [state, handleStopRecording]);

  const sendAudioToServer = async (audioBlob: Blob) => {
    setState('processing');
    setErrorMessage(null);

    try {
      const formData = new FormData();
      // Determine file extension from mime type
      const mimeType = audioBlob.type || 'audio/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('wav') ? 'wav' : 'webm';
      formData.append('audio', audioBlob, `voice-listing.${ext}`);

      const res = await fetch('/api/voice-listing', {
        method: 'POST',
        body: formData,
      });

      const result: VoiceListingResponse = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.error || result.message || 'Voice processing failed. Please try again or enter details manually.'
        );
      }

      setExtractedData(result.data);
      setState('success');
      onDataExtracted(result.data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Voice processing failed. Please try again or enter the details manually.';
      setErrorMessage(msg);
      setState('error');
    } finally {
      cleanupStream();
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    // Check browser audio support
    if (
      typeof window === 'undefined' ||
      !navigator?.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setErrorMessage(
        'Audio recording is not supported in this browser. Please use Chrome, Safari, Firefox, or enter the details manually.'
      );
      setState('error');
      return;
    }

    try {
      setState('requesting_permission');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      // Select supported MIME type
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (finalBlob.size === 0) {
          setErrorMessage('Empty recording detected. Please speak clearly into your microphone.');
          setState('error');
          cleanupStream();
          return;
        }

        sendAudioToServer(finalBlob);
      };

      mediaRecorder.start(250); // Emit chunk every 250ms
      setState('recording');
    } catch (err: unknown) {
      cleanupStream();
      const errObj = err as { name?: string; message?: string };
      if (errObj.name === 'NotAllowedError' || errObj.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Microphone permission was denied. Please allow microphone access in your browser settings to use voice listing, or enter details manually.'
        );
      } else if (errObj.name === 'NotFoundError' || errObj.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone device found on your device. Please enter details manually.');
      } else {
        setErrorMessage('Could not start microphone recording. Please try again or enter details manually.');
      }
      setState('error');
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
    setState('idle');
    setRecordingSeconds(0);
  };

  const handleReset = () => {
    cleanupStream();
    setState('idle');
    setErrorMessage(null);
    setExtractedData(null);
    setRecordingSeconds(0);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-agri-sprout-soft/60 via-white to-agri-harvest-soft/40 border border-agri-sprout/30 p-4 space-y-3 transition-all duration-200 shadow-sm">
      {/* State: Idle / Initial */}
      {state === 'idle' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-agri-sprout" />
              <span className="text-xs font-black uppercase tracking-wider text-agri-earth-900">
                AI Voice Listing Assistant
              </span>
              <Badge variant="sprout" className="text-[10px] py-0 px-2">
                Telugu • English
              </Badge>
            </div>
            <p className="text-xs text-agri-earth-700">
              Speak in Telugu or English (e.g., &ldquo;నా దగ్గర 500 కిలోల టమాటాలు ఉన్నాయి. కిలో 25 రూపాయలు.&rdquo;). AI will fill the form for you.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={startRecording}
            disabled={disabled}
            className="gap-2 shrink-0 bg-agri-evergreen hover:bg-agri-evergreen-light text-white font-bold shadow-sm"
          >
            <Mic className="h-4 w-4 text-agri-sprout-bright" />
            <span>Use Voice to Fill Listing</span>
          </Button>
        </div>
      )}

      {/* State: Requesting Permission */}
      {state === 'requesting_permission' && (
        <div className="flex items-center justify-between gap-3 py-2 animate-pulse">
          <div className="flex items-center gap-2 text-xs font-semibold text-agri-earth-800">
            <Loader2 className="h-4 w-4 text-agri-sprout animate-spin" />
            <span>Requesting microphone permission... Please click Allow in your browser.</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleCancelRecording}>
            Cancel
          </Button>
        </div>
      )}

      {/* State: Active Recording */}
      {state === 'recording' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center h-8 w-8">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <div className="relative h-6 w-6 rounded-full bg-red-600 flex items-center justify-center text-white">
                  <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">
                    Recording Audio...
                  </span>
                  <span className="text-xs font-mono font-bold text-agri-earth-800">
                    {formatTime(recordingSeconds)} / {formatTime(MAX_RECORDING_SECONDS)}
                  </span>
                </div>
                <p className="text-[11px] text-agri-earth-700">
                  Speak clearly: produce name, quantity, unit, and expected price.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelRecording}
                className="text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleStopRecording}
                className="gap-1.5 font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                <Square className="h-3.5 w-3.5 fill-white" />
                <span>Done Recording</span>
              </Button>
            </div>
          </div>

          {/* Audio progress bar */}
          <div className="w-full bg-agri-earth-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-red-600 h-full transition-all duration-300"
              style={{ width: `${(recordingSeconds / MAX_RECORDING_SECONDS) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* State: Processing Audio with Gemini */}
      {state === 'processing' && (
        <div className="flex items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-agri-evergreen animate-spin shrink-0" />
            <div>
              <p className="text-xs font-bold text-agri-earth-900">
                Processing speech with Google Gemini AI...
              </p>
              <p className="text-[11px] text-agri-earth-700">
                Extracting produce, quantity, and pricing in Telugu / English.
              </p>
            </div>
          </div>
          <Badge variant="sprout" className="animate-pulse text-[10px]">
            AI Analyzing
          </Badge>
        </div>
      )}

      {/* State: Success Banner */}
      {state === 'success' && extractedData && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-agri-sprout shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-agri-evergreen">
                    Produce Details Extracted Successfully
                  </span>
                  {extractedData.detectedLanguage && (
                    <Badge variant="outline" className="text-[9px] py-0 uppercase">
                      {extractedData.detectedLanguage}
                    </Badge>
                  )}
                </div>

                {/* MANDATORY CONFIRMATION MESSAGE REQUIRED BY PROMPT */}
                <p className="text-xs font-bold text-agri-earth-900 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                  ⚠️ Please check your details before publishing.
                </p>

                {extractedData.rawTranscription && (
                  <p className="text-[11px] text-agri-earth-700 italic">
                    Spoken: &ldquo;{extractedData.rawTranscription}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs gap-1 shrink-0"
              title="Record again"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry Voice</span>
            </Button>
          </div>

          {/* Extracted Data Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-agri-sprout/20">
            {extractedData.product && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white text-agri-evergreen border border-agri-sprout/40 shadow-2xs">
                Product: <span className="text-agri-earth-900">{extractedData.product}</span>
              </span>
            )}
            {extractedData.quantity != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white text-agri-evergreen border border-agri-sprout/40 shadow-2xs">
                Quantity: <span className="text-agri-earth-900">{extractedData.quantity} {extractedData.unit || 'kg'}</span>
              </span>
            )}
            {extractedData.price != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white text-agri-evergreen border border-agri-sprout/40 shadow-2xs">
                Price: <span className="text-agri-evergreen font-black">₹{extractedData.price}/{extractedData.unit || 'kg'}</span>
              </span>
            )}
            {extractedData.location && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white text-agri-earth-800 border border-agri-earth-200 shadow-2xs">
                Location: <span>{extractedData.location}</span>
              </span>
            )}
            {extractedData.harvestDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white text-agri-earth-800 border border-agri-earth-200 shadow-2xs">
                Harvest: <span>{extractedData.harvestDate}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* State: Error State */}
      {state === 'error' && (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {errorMessage || 'Voice processing failed. Please try again or enter the details manually.'}
                </p>
                <p className="text-[11px] text-red-700 mt-0.5">
                  You can always fill the listing form fields manually below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startRecording}
                className="text-xs gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Try Again</span>
              </Button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1 rounded-lg text-agri-earth-600 hover:bg-agri-earth-100"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
