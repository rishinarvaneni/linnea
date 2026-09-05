import { MessageSquare, Trash2 } from 'lucide-react'
import { useState } from 'react'

type Conversation = {
  id: string
  title: string
  updatedAt: Date
  agentType: string
}

type ConversationListProps = {
  conversations: Conversation[]
  selectedId?: string
  onSelect?: (id: string) => void
  onDelete?: (id: string) => void
}

function groupConversations(conversations: Conversation[]) {
  const groups: Record<string, Conversation[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous': []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  conversations.forEach(conv => {
    const d = new Date(conv.updatedAt)
    if (d >= today) {
      groups['Today'].push(conv)
    } else if (d >= yesterday) {
      groups['Yesterday'].push(conv)
    } else {
      groups['Previous'].push(conv)
    }
  })

  // Remove empty groups
  return Object.entries(groups).filter(([_, convs]) => convs.length > 0)
}

export function ConversationList({ conversations, selectedId, onSelect, onDelete }: ConversationListProps) {
  const grouped = groupConversations(conversations)
  const [confirmingId, setConfirmingId] = useState<string | undefined>()

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-6 h-full">
      {grouped.map(([label, convs]) => (
        <div key={label}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">{label}</h3>
            <div className="space-y-1">
              {convs.map(conv => (
                <div
                  key={conv.id}
                  className={`group relative w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    selectedId === conv.id 
                      ? 'bg-slate-200/60' 
                      : 'hover:bg-slate-200/50'
                  }`}
                  onClick={(e) => {
                    // Prevent select if we are interacting with delete elements
                    const target = e.target as HTMLElement
                    if (!target.closest('button.delete-action')) {
                      onSelect?.(conv.id)
                    }
                  }}
                >
                  {confirmingId === conv.id ? (
                    <div className="flex flex-col gap-2 w-full delete-action" onClick={e => e.stopPropagation()}>
                      <span className="text-xs font-semibold text-slate-700">Delete this conversation?</span>
                      <div className="flex gap-2">
                        <button 
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded font-medium transition-colors"
                          onClick={(e) => { e.stopPropagation(); setConfirmingId(undefined) }}
                        >
                          Cancel
                        </button>
                        <button 
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-medium transition-colors"
                          onClick={(e) => { e.stopPropagation(); setConfirmingId(undefined); onDelete?.(conv.id) }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedId === conv.id ? 'text-blue-500' : 'text-slate-400'}`} />
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-medium line-clamp-1 ${selectedId === conv.id ? 'text-slate-900' : 'text-slate-600'}`}>
                            {conv.title}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        className="delete-action opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-slate-300/50 text-slate-400 hover:text-red-500 transition-all flex-shrink-0 focus:opacity-100"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmingId(conv.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
  )
}
