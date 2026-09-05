'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CreditCard, CheckCircle2, Trash2, AlertCircle } from 'lucide-react'
import { AddPaymentMethodModal } from '@/components/customer/AddPaymentMethodModal'
import { removePaymentMethod, setDefaultPaymentMethod } from '@/lib/actions/payment-methods'
import { updateAIPurchaseEnabled } from '@/lib/actions/customer'

export default function CustomerSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isTogglingAi, setIsTogglingAi] = useState(false)

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/customer/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
      } else {
        router.push('/login?role=CUSTOMER')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-slate-500">Loading settings...</div>
      </div>
    )
  }

  if (!profile) return null

  const savedPaymentMethods = profile.savedPaymentMethods || []
  const defaultMethod = savedPaymentMethods.find((m: any) => m.isDefault) || savedPaymentMethods[0]
  const disableAiToggle = savedPaymentMethods.length === 0

  const handleAiPurchaseToggle = async (enabled: boolean) => {
    if (disableAiToggle) return
    
    // Optimistic update
    const previousState = profile.aiPurchaseEnabled;
    setProfile({ ...profile, aiPurchaseEnabled: enabled })
    setIsTogglingAi(true)
    
    try {
      await updateAIPurchaseEnabled(enabled)
    } catch (err: any) {
      console.error(err)
      // Revert on error
      setProfile({ ...profile, aiPurchaseEnabled: previousState })
      alert(err.message || 'Failed to update preference')
    } finally {
      setIsTogglingAi(false)
    }
  }

  const handleRemoveMethod = async (method: any) => {
    const brand = method.brand || 'Visa'
    const last4 = method.last4 || '4242'
    if (!confirm(`Remove ${brand} •••• ${last4}?`)) return
    try {
      const res = await removePaymentMethod(method.id)
      if (res.success) {
        fetchProfile()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await setDefaultPaymentMethod(id)
      if (res.success) {
        fetchProfile()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your shopping preferences and payment methods.</p>
        </div>

        {/* AI Agent Settings */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            AI Assistant Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">Allow AI to purchase using my saved payment method</p>
                <p className="text-sm text-slate-500 mt-1">
                  When enabled, the AI shopping agent can complete checkouts on your behalf during chat.
                </p>
                {disableAiToggle ? (
                  <p className="text-sm text-amber-600 font-medium mt-2">
                    Add a payment method below to enable AI purchasing preferences.
                  </p>
                ) : defaultMethod?.provider === 'DEMO' ? (
                  <p className="text-xs text-slate-500 font-medium mt-2">
                    Test payment method active. Autonomous checkout will route through Razorpay payment authorization during chat.
                  </p>
                ) : null}
              </div>
              <label className={`relative inline-flex items-center cursor-pointer flex-shrink-0 ${disableAiToggle ? 'opacity-50' : ''}`}>
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={profile.aiPurchaseEnabled && !disableAiToggle}
                  onChange={(e) => {
                    if (disableAiToggle) {
                      alert("Please add a test payment method below before enabling AI purchasing.");
                      return;
                    }
                    handleAiPurchaseToggle(e.target.checked);
                  }}
                  disabled={isTogglingAi}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Payment Methods</h2>
              <p className="text-sm text-slate-500 mt-1">Manage the payment methods available to your AI shopping preferences.</p>
            </div>
            {savedPaymentMethods.length > 0 && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add method
              </button>
            )}
          </div>

          <div className="space-y-4">
            {savedPaymentMethods.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-900 font-medium">No payment method saved</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">Add a test payment method to try out the flow.</p>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add test payment method
                </button>
              </div>
            ) : (
              savedPaymentMethods.map((method: any) => (
                <div key={method.id} className={`p-5 rounded-xl border ${method.isDefault ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm h-min">
                        <CreditCard className="w-6 h-6 text-slate-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-slate-900">{method.brand} •••• {method.last4}</p>
                          {method.isDefault && (
                            <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </div>
                        
                        {method.provider === 'DEMO' && (
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="font-semibold text-slate-700 text-xs tracking-wider uppercase">TEST PAYMENT METHOD</p>
                            <p className="text-xs text-slate-500">Provider: <span className="font-mono">DEMO</span></p>
                            <p className="text-xs font-medium text-amber-600">Status: Not eligible for autonomous charging</p>
                          </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">Added {new Date(method.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <button 
                          onClick={() => handleSetDefault(method.id)}
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Set as default
                        </button>
                      )}
                      <button 
                        onClick={() => handleRemoveMethod(method)}
                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove method"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <AddPaymentMethodModal 
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          fetchProfile()
        }}
      />
    </div>
  )
}
