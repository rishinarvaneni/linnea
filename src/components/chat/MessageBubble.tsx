import { Sparkles, User, Mic } from 'lucide-react'
import { SpeakButton } from './SpeakButton'
import { ProductCard, ProductView } from '@/components/ui/ProductCard'
import { CheckoutAction } from '@/components/ui/CheckoutAction'

type Message = {
  id: string
  role: string
  content: string
  inputType?: string
  createdAt: Date
}

export function MessageBubble({ message, autoSpeak = false }: { message: Message, autoSpeak?: boolean }) {
  const isAi = message.role === 'ASSISTANT' || message.role === 'assistant'
  
  const timeString = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const renderContent = (text: string) => {
    let parsedPayload: any = null
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && parsed.type === 'CUSTOMER_AGENT_RESPONSE') {
        parsedPayload = parsed
      }
    } catch(e) {}

    if (parsedPayload) {
      return (
        <div className="flex flex-col gap-4">
          <span className="whitespace-pre-wrap">{parsedPayload.text}</span>
          
          {parsedPayload.products && parsedPayload.products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {parsedPayload.products.map((p: ProductView) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {parsedPayload.cart && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 shadow-sm mt-2">
              <div className="font-semibold text-slate-800 flex justify-between items-center mb-3">
                <span>🛒 Shopping Cart</span>
                <span className="text-sm bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                  {parsedPayload.cart.items.length} item{parsedPayload.cart.items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {parsedPayload.cart.items.map((item: any) => (
                  <div key={item.productId} className="flex justify-between text-sm items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-700 font-medium">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-slate-900 font-semibold">
                      ₹{(item.subtotalPaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200 font-bold text-slate-900">
                <span>Total</span>
                <span>₹{(parsedPayload.cart.totalPaise / 100).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {parsedPayload.checkout && (
            <CheckoutAction checkout={parsedPayload.checkout} />
          )}
        </div>
      )
    }

    const rzpMatch = text.match(/(https:\/\/rzp\.io\/i\/[a-zA-Z0-9]+)/)
    
    if (rzpMatch) {
      const url = rzpMatch[1]
      const orderMatch = text.match(/(NVR-DEMO-\d+|ORD-\d+)/)
      const orderId = orderMatch ? orderMatch[1] : 'Order'
      
      return (
        <div className="flex flex-col gap-3">
          <span className="whitespace-pre-wrap">{text.replace(url, '').trim()}</span>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col gap-2 relative overflow-hidden mt-1 shadow-sm">
             <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] tracking-wider font-bold px-2 py-1 rounded-bl-lg">
                TEST MODE
             </div>
             <div className="font-semibold text-slate-800 flex items-center gap-2">
               <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
               </svg>
               Payment Link
             </div>
             <div className="text-sm text-slate-600 font-medium">Order: <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded-md">{orderId}</span></div>
             <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex justify-center items-center px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors w-full shadow-sm">
               Complete Payment
             </a>
          </div>
        </div>
      )
    }
    
    return <span className="whitespace-pre-wrap">{text}</span>
  }

  return (
    <div className={`flex gap-4 max-w-[85%] ${isAi ? '' : 'ml-auto flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAi ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
        {isAi ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      <div className={`flex flex-col gap-1 ${isAi ? '' : 'items-end'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isAi ? 'bg-white border border-slate-200/60 text-slate-700 rounded-tl-sm shadow-sm' : 'bg-slate-900 text-white rounded-tr-sm shadow-sm'}`}>
          {renderContent(message.content)}
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-slate-400 font-medium">{timeString}</span>
          {!isAi && message.inputType === 'VOICE' && (
            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded-full">
              <Mic className="w-3 h-3" /> Voice
            </div>
          )}
          {isAi && (
            <SpeakButton text={(() => {
              try {
                const parsed = JSON.parse(message.content)
                if (parsed.text) return parsed.text
                return message.content
              } catch(e) {
                return message.content
              }
            })()} autoSpeak={autoSpeak} />
          )}
        </div>
      </div>
    </div>
  )
}
