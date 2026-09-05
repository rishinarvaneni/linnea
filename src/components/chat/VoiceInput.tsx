'use client'

import React, { useEffect, forwardRef, useImperativeHandle } from 'react'
import { Mic, MicOff, Square, Loader2 } from 'lucide-react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

export interface VoiceInputHandle {
  startListening: () => void
}

interface VoiceInputProps {
  onTranscriptComplete: (transcript: string) => void
  onStateChange?: (isListening: boolean, interimTranscript: string, finalTranscript: string) => void
  disabled?: boolean
  highlight?: boolean
}

export const VoiceInput = forwardRef<VoiceInputHandle, VoiceInputProps>(({ onTranscriptComplete, onStateChange, disabled, highlight }, ref) => {
  const {
    speechState,
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    error,
    reset
  } = useSpeechRecognition()

  useImperativeHandle(ref, () => ({
    startListening
  }))

  useEffect(() => {
    // When recognition finishes and goes back to IDLE, pass final transcript if available
    if (speechState === 'IDLE' && transcript.trim().length > 0) {
      onTranscriptComplete(transcript.trim())
      reset()
    }
  }, [speechState, transcript, onTranscriptComplete, reset])

  useEffect(() => {
    if (onStateChange) {
      onStateChange(speechState === 'LISTENING', interimTranscript, transcript)
    }
  }, [speechState, interimTranscript, transcript, onStateChange])

  if (speechState === 'UNSUPPORTED') {
    return (
      <button 
        type="button"
        disabled
        className="p-2 rounded-full text-slate-300 cursor-not-allowed flex-shrink-0"
        title="Voice input isn't supported in this browser."
      >
        <MicOff className="w-5 h-5" />
      </button>
    )
  }

  const isListening = speechState === 'LISTENING'
  const isProcessing = speechState === 'PROCESSING'

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        disabled={disabled || isProcessing}
        onClick={isListening ? stopListening : startListening}
        className={`p-2 rounded-full transition-all flex items-center justify-center ${
          isListening 
            ? 'text-red-500 bg-red-50 hover:bg-red-100 ring-2 ring-red-500 ring-offset-1 animate-pulse' 
            : highlight
              ? 'text-blue-500 bg-blue-50 hover:bg-blue-100 animate-pulse ring-2 ring-blue-500 ring-offset-2'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
        } ${(disabled || isProcessing) ? 'opacity-50 cursor-not-allowed animate-none ring-0' : ''}`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <Square className="w-5 h-5 fill-current" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {error && (
        <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  )
})
