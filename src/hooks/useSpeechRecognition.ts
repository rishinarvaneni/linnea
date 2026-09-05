import { useState, useEffect, useCallback, useRef } from 'react'

export type SpeechState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'ERROR' | 'UNSUPPORTED'

export function useSpeechRecognition() {
  const [speechState, setSpeechState] = useState<SpeechState>('IDLE')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechState('UNSUPPORTED')
      setError("Voice input isn't supported in this browser.")
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setSpeechState('LISTENING')
        setError(null)
      }

      recognition.onresult = (event: any) => {
        let finalStr = ''
        let interimStr = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i]
          if (item.isFinal) {
            finalStr += item[0].transcript
          } else {
            interimStr += item[0].transcript
          }
        }
        if (finalStr) {
          setTranscript(prev => {
            const next = prev ? prev + ' ' + finalStr.trim() : finalStr.trim()
            transcriptRef.current = next
            return next
          })
        }
        setInterimTranscript(interimStr)
      }

      recognition.onerror = (event: any) => {
        const errName = event.error
        if (errName === 'not-allowed' || errName === 'permission-denied') {
          setError('Microphone access is blocked. Allow microphone access for localhost:3000 in your browser settings and try again.')
          setSpeechState('ERROR')
        } else if (errName === 'audio-capture' || errName === 'no-mic') {
          setError('No microphone was detected.')
          setSpeechState('ERROR')
        } else if (errName === 'no-speech') {
          // Gracefully return to IDLE without treating as a fatal crash
          setSpeechState('IDLE')
        } else if (errName === 'network') {
          setError('Speech recognition network error.')
          setSpeechState('ERROR')
        } else if (errName === 'aborted') {
          setSpeechState('IDLE')
        } else {
          setError('Voice input unavailable. Check microphone permissions.')
          setSpeechState('ERROR')
        }
      }

      recognition.onend = () => {
        setSpeechState('IDLE')
        setInterimTranscript('')
      }

      recognitionRef.current = recognition
    } catch (err) {
      setSpeechState('UNSUPPORTED')
      setError("Voice input isn't supported in this browser.")
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (_) {}
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (speechState === 'UNSUPPORTED' || !recognitionRef.current) return
    setError(null)
    setTranscript('')
    transcriptRef.current = ''
    setInterimTranscript('')
    try {
      recognitionRef.current.start()
    } catch (err) {
      // If already started, ignore or restart
      setError('Failed to start voice input. Please try again.')
      setSpeechState('ERROR')
    }
  }, [speechState])

  const stopListening = useCallback(() => {
    if (speechState === 'UNSUPPORTED' || !recognitionRef.current) return
    setSpeechState('PROCESSING')
    try {
      recognitionRef.current.stop()
    } catch (_) {}
  }, [speechState])

  const reset = useCallback(() => {
    if (speechState !== 'UNSUPPORTED') {
      setSpeechState('IDLE')
    }
    setTranscript('')
    transcriptRef.current = ''
    setInterimTranscript('')
    setError(null)
  }, [speechState])

  return {
    speechState,
    startListening,
    stopListening,
    reset,
    transcript,
    interimTranscript,
    error,
  }
}
