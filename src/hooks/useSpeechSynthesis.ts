import { useState, useEffect, useCallback, useRef } from 'react'

export type SpeechSynthesisState = 'IDLE' | 'SPEAKING' | 'ERROR' | 'UNSUPPORTED'

function cleanTextForSpeech(text: string): string {
  let cleaned = text

  // Remove markdown bold/italic
  cleaned = cleaned.replace(/[*_~`]/g, '')
  
  // Remove markdown links but keep the text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Replace Markdown headings
  cleaned = cleaned.replace(/^#+\s+/gm, '')

  // Simplify standard URL appearances if left over
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, 'a link')

  return cleaned.trim()
}

export function useSpeechSynthesis() {
  const [speechState, setSpeechState] = useState<SpeechSynthesisState>('IDLE')
  const [error, setError] = useState<string | null>(null)
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) {
      setSpeechState('UNSUPPORTED')
      setError("Text-to-speech isn't supported in this browser.")
      return
    }

    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || speechState === 'UNSUPPORTED') return
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel()

    if (!text) return

    const cleanedText = cleanTextForSpeech(text)
    if (!cleanedText) return

    const utterance = new SpeechSynthesisUtterance(cleanedText)
    utterance.lang = 'en-IN'

    utterance.onstart = () => {
      setSpeechState('SPEAKING')
      setError(null)
    }

    utterance.onend = () => {
      setSpeechState('IDLE')
    }

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('Speech synthesis error:', e.error)
      }
      setSpeechState('ERROR')
      setError('Unable to play this response aloud.')
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [speechState])

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || speechState === 'UNSUPPORTED') return
    window.speechSynthesis.cancel()
    setSpeechState('IDLE')
  }, [speechState])

  return {
    speechState,
    speak,
    stop,
    error,
  }
}
