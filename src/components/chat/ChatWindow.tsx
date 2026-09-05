import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput, ChatInputHandle } from './ChatInput'

export type Suggestion = {
  label: string
  isVoice?: boolean
}

type Message = {
  id: string
  role: string
  content: string
  createdAt: Date
}

type ChatWindowProps = {
  messages: Message[]
  isLoading?: boolean
  isSending?: boolean
  onSendMessage?: (content: string, inputType?: 'TEXT' | 'VOICE') => void
  emptyStateText?: string
  autoSpeak?: boolean
  highlightVoice?: boolean
  suggestions?: Suggestion[]
}

export function ChatWindow({ messages, isLoading, isSending, onSendMessage, emptyStateText = "How can I help you today?", autoSpeak = false, highlightVoice = false, suggestions = [] }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<ChatInputHandle>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative">
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto opacity-90 pb-8 px-4">
            <h3 className="text-xl font-semibold text-slate-900 mb-8">{emptyStateText}</h3>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (suggestion.isVoice) {
                        chatInputRef.current?.startVoice()
                      } else {
                        onSendMessage?.(suggestion.label, 'TEXT')
                      }
                    }}
                    className={`px-4 py-3 border text-sm font-medium rounded-xl transition-colors ${
                      suggestion.isVoice 
                        ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
                    }`}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isLast = index === messages.length - 1
              // We only autoSpeak if it's the very last message in the list
              return <MessageBubble key={msg.id} message={msg} autoSpeak={isLast ? autoSpeak : false} />
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
      <ChatInput ref={chatInputRef} onSend={onSendMessage} disabled={isSending} highlightVoice={highlightVoice} />
    </div>
  )
}
