'use client'

import { useState, KeyboardEvent, useRef, forwardRef, useImperativeHandle } from 'react'
import { Send } from 'lucide-react'
import { VoiceInput, VoiceInputHandle } from './VoiceInput'

export interface ChatInputHandle {
  startVoice: () => void
}

type ChatInputProps = {
  onSend?: (content: string, inputType?: 'TEXT' | 'VOICE') => void
  disabled?: boolean
  highlightVoice?: boolean
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({ onSend, disabled, highlightVoice }, ref) => {
  const [value, setValue] = useState('')
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [voiceFinalText, setVoiceFinalText] = useState('')
  const [pendingInputType, setPendingInputType] = useState<'TEXT' | 'VOICE'>('TEXT')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const voiceInputRef = useRef<VoiceInputHandle>(null)

  useImperativeHandle(ref, () => ({
    startVoice: () => {
      voiceInputRef.current?.startListening()
    }
  }))

  const handleSend = () => {
    if (!value.trim() || disabled || isVoiceListening) return
    onSend?.(value.trim(), pendingInputType)
    setValue('')
    setPendingInputType('TEXT')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceStateChange = (listening: boolean, interim: string, final: string = '') => {
    setIsVoiceListening(listening)
    setInterimText(interim)
    setVoiceFinalText(final)
  }

  const handleTranscriptComplete = (transcript: string) => {
    if (transcript) {
      const updatedValue = value ? value.trim() + ' ' + transcript.trim() : transcript.trim()
      setValue(updatedValue)
      setPendingInputType('VOICE')
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
          textareaRef.current.focus()
        }
      }, 50)
    }
  }

  const currentListeningText = [voiceFinalText, interimText].filter(Boolean).join(' ')
  const displayValue = isVoiceListening 
    ? (currentListeningText ? (value ? value + ' ' + currentListeningText : currentListeningText) : (value || 'Listening...'))
    : value

  return (
    <div className="bg-white p-4 border-t border-slate-200">
      <div className={`max-w-4xl mx-auto flex items-end gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent transition-all ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <textarea 
          ref={textareaRef}
          value={displayValue}
          onChange={e => {
            if (isVoiceListening) return
            const newValue = e.target.value
            setValue(newValue)
            
            if (newValue === '') {
              setPendingInputType('TEXT')
            }
            
            e.target.style.height = 'auto'
            e.target.style.height = e.target.scrollHeight + 'px'
          }}
          onKeyDown={handleKeyDown}
          placeholder={isVoiceListening ? "Listening..." : "Type a message..."}
          className={`flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 ${isVoiceListening ? 'italic text-slate-500' : ''}`}
          rows={1}
          disabled={disabled || isVoiceListening}
        />
        <div className="flex items-center gap-2 pb-1 pr-1">
          <VoiceInput 
            ref={voiceInputRef}
            onTranscriptComplete={handleTranscriptComplete}
            onStateChange={handleVoiceStateChange}
            disabled={disabled}
            highlight={highlightVoice}
          />
          <button 
            type="button"
            onClick={handleSend}
            disabled={disabled || !value.trim() || isVoiceListening}
            className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center rounded-xl hover:bg-slate-800 transition-colors flex-shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disabled && !isVoiceListening ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>
      </div>
      <div className="text-center mt-3 text-[11px] text-slate-400 font-medium">
        AI responses may contain errors. Please verify critical actions.
      </div>
    </div>
  )
})
