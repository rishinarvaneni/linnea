'use client'

import { useState, useEffect, useRef } from 'react'
import { ConversationList } from './ConversationList'
import { ChatWindow } from './ChatWindow'
import { createConversation, getConversation, createMessage, deleteConversation } from '@/app/actions/chat'
import { Plus, SquarePen, Menu, X } from 'lucide-react'
import { Suggestion } from './ChatWindow'
import { ActivityTimeline } from './ActivityTimeline'

// Using Prisma generated types
type Conversation = {
  id: string
  title: string
  updatedAt: Date
  agentType: string
}

type Message = {
  id: string
  role: string
  content: string
  inputType?: string
  createdAt: Date
}

type ChatWorkspaceProps = {
  initialConversations: Conversation[]
  agentType: string
  emptyStateText: string
  initialQuery?: string
  startVoice?: boolean
  suggestions?: Suggestion[]
}

export function ChatWorkspace({ initialConversations, agentType, emptyStateText, initialQuery, startVoice, suggestions }: ChatWorkspaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedId, setSelectedId] = useState<string | undefined>(initialConversations[0]?.id)
  const [messages, setMessages] = useState<Message[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const [pendingInitialQuery, setPendingInitialQuery] = useState(initialQuery)
  const [highlightVoice, setHighlightVoice] = useState(startVoice)
  const initialized = useRef(false)

  // Hydrate sidebar state based on screen size
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      if (initialQuery || startVoice) {
        // Strip the URL parameters to prevent re-triggering on refresh
        window.history.replaceState(null, '', window.location.pathname)
        
        // If we have an initial query but no selected conversation, create one
        if (initialQuery && !selectedId) {
          handleNewConversation()
        }
      }
    }
  }, [initialQuery, startVoice, selectedId])

  // Process the pending query once we have a selected conversation
  useEffect(() => {
    if (pendingInitialQuery && selectedId) {
      handleSendMessage(pendingInitialQuery, 'TEXT')
      setPendingInitialQuery(undefined) // Clear so it only runs once
    }
  }, [pendingInitialQuery, selectedId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('autoSpeakResponses')
      if (stored === 'true') setAutoSpeak(true)
    }
  }, [])

  const toggleAutoSpeak = () => {
    setAutoSpeak(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('autoSpeakResponses', String(next))
      }
      return next
    })
  }

  useEffect(() => {
    if (selectedId) {
      loadConversation(selectedId)
      loadActions(selectedId)
      // Close sidebar on mobile when selecting a conversation
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
    } else {
      setMessages([])
      setActions([])
    }
  }, [selectedId])

  async function loadConversation(id: string) {
    setIsLoadingMessages(true)
    try {
      const conv = await getConversation(id)
      setMessages(conv.messages)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  async function loadActions(id: string) {
    // Dynamically import to avoid circular dependencies if any, though not strictly needed.
    const { getAgentActions } = await import('@/app/actions/chat')
    try {
      const act = await getAgentActions(id)
      setActions(act)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleNewConversation() {
    try {
      const newConv = await createConversation(agentType)
      setConversations(prev => [newConv, ...prev])
      setSelectedId(newConv.id)
      
      // Close sidebar on mobile
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
      
      // Focus the text input
      setTimeout(() => {
        const textarea = document.querySelector('textarea')
        if (textarea) textarea.focus()
      }, 50)
      
    } catch (error) {
      console.error(error)
    }
  }

  async function handleDeleteConversation(id: string) {
    const conversationToDelete = conversations.find(c => c.id === id)
    if (!conversationToDelete) return

    // Optimistic UI updates
    setConversations(prev => prev.filter(c => c.id !== id))
    if (selectedId === id) {
      setSelectedId(undefined)
    }

    try {
      await deleteConversation(id)
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      // Rollback optimistic updates
      setConversations(prev => {
        const newList = [...prev, conversationToDelete]
        return newList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      })
      if (selectedId === id) {
        setSelectedId(id)
      }
      alert('Failed to delete conversation. Please try again.')
    }
  }

  async function handleSendMessage(content: string, inputType: 'TEXT' | 'VOICE' = 'TEXT') {
    if (!selectedId || !content.trim() || isSending) return

    setIsSending(true)
    
    // Optimistic UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: content.trim(),
      inputType,
      createdAt: new Date()
    }
    setMessages(prev => [...prev, tempMessage])

    try {
      const result = await createMessage(selectedId, content.trim(), inputType)
      
      // Update UI with authoritative messages
      setMessages(prev => {
        // Remove optimistic message and append authoritative ones
        const filtered = prev.filter(m => m.id !== tempMessage.id)
        return [...filtered, result.userMessage, result.assistantMessage]
      })

      // Reload actions now that agent execution and DB persistence is complete
      loadActions(selectedId)

      // Update conversation title and updatedAt in the list
      // We do this outside the setState callback to keep the callback pure
      getConversation(selectedId).then(conv => {
        setConversations(current => {
          const i = current.findIndex(c => c.id === selectedId)
          if (i === -1) return current
          const newList = [...current]
          newList[i] = { ...newList[i], title: conv.title, updatedAt: new Date() }
          // Resort by updatedAt
          return newList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        })
      })
    } catch (error) {
      console.error(error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
    } finally {
      setIsSending(false)
      loadActions(selectedId)
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden relative bg-white">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed md:relative z-50 h-full bg-slate-50 border-r border-slate-200 w-72 md:w-64 flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-full md:w-0 md:border-r-0 md:hidden'
        }`}
      >
        <div className="p-5 flex flex-col gap-3">
          <button 
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-sm"
            aria-label="Start new chat"
          >
            <SquarePen className="w-4 h-4" />
            New chat
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id)
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false)
              }
            }}
            onDelete={handleDeleteConversation}
          />
        </div>
        
        <div className="p-5 border-t border-slate-200/60 bg-slate-50/50">
          <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-700">
            <input 
              type="checkbox" 
              checked={autoSpeak}
              onChange={toggleAutoSpeak}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            Auto-speak responses
          </label>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full bg-white relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-200/60 bg-white/95 backdrop-blur-md flex items-center px-6 gap-4 z-10 sticky top-0 shrink-0 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label={isSidebarOpen ? "Close conversation history" : "Open conversation history"}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-bold tracking-tight text-slate-900 text-lg">
            {agentType === 'CUSTOMER_SHOPPING' ? 'AI Shopping Agent' : 'Revenue Growth Agent'}
          </h1>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {selectedId ? (
              <ChatWindow 
                messages={messages} 
                isLoading={isLoadingMessages} 
                onSendMessage={handleSendMessage}
                isSending={isSending}
                emptyStateText={emptyStateText}
                autoSpeak={autoSpeak}
                highlightVoice={highlightVoice}
                suggestions={suggestions}
              />
          ) : (
            <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-slate-50/30">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200/60">
                  <SquarePen className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-4">No conversation selected</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  I'm your Revenue Growth Agent. How can I help you grow today?
                </p>
                <button 
                  onClick={handleNewConversation}
                  className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      
      {/* Right Sidebar (Cart / Actions) */}
      {agentType === 'MERCHANT_REVENUE' && (
        <div className="hidden xl:flex flex-col w-[340px] flex-shrink-0 bg-slate-50/50 border-l border-slate-200/60">
          <div className="p-6 border-b border-slate-200/60 bg-white sticky top-0 z-10 shadow-sm">
            <h3 className="font-bold tracking-tight text-slate-900">Agent Activity</h3>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Timeline</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <ActivityTimeline entries={actions} />
          </div>
        </div>
      )}
    </div>
  )
}
