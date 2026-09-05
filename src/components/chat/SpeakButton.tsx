'use client'

import React, { useEffect, useRef } from 'react'
import { Volume2, Square } from 'lucide-react'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

interface SpeakButtonProps {
  text: string
  autoSpeak?: boolean
}

export function SpeakButton({ text, autoSpeak = false }: SpeakButtonProps) {
  const { speechState, speak, stop, error } = useSpeechSynthesis()
  const hasAutoSpoken = useRef(false)

  useEffect(() => {
    // Only auto-speak if speech isn't currently happening, hasn't auto-spoken this block, and isn't unsupported
    if (autoSpeak && !hasAutoSpoken.current && text && speechState !== 'UNSUPPORTED') {
      hasAutoSpoken.current = true
      speak(text)
    }
  }, [autoSpeak, text, speak, speechState])

  if (speechState === 'UNSUPPORTED') return null

  const isSpeaking = speechState === 'SPEAKING'

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => isSpeaking ? stop() : speak(text)}
        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-1 mt-1"
        title={isSpeaking ? 'Stop speaking' : 'Speak message'}
      >
        {isSpeaking ? (
          <Square className="w-4 h-4 fill-current" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
