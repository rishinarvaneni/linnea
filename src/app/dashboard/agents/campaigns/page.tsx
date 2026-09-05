'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { generateCampaignPlan } from '@/lib/ai/campaigns'
import { executeCampaign } from '@/app/actions/campaigns'
import { CheckCircle2, Megaphone, Loader2, Send } from 'lucide-react'

export default function CampaignOrchestratorPage() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) {
      setError('Please enter a campaign description.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await generateCampaignPlan(prompt)
      setPlan(result)
      setExecutionResult(null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while generating the campaign plan.')
      setPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    if (!plan || !plan.id) return
    setExecuting(true)
    try {
      const result = await executeCampaign(plan.id)
      setExecutionResult(result)
      setPlan({ ...plan, status: result.status })
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error executing campaign')
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <PageHeader 
        title="Campaign Orchestrator" 
        subtitle="Turn natural language ideas into data-backed revenue campaigns."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/60 p-6 rounded-xl shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-500" />
              Describe your campaign
            </h3>
            <p className="text-sm text-slate-500">
              Tell the orchestrator who you want to target and what you want to achieve. It will find the real audience and draft the message.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Create a campaign for customers who bought headphones but haven't bought speakers."
                className="w-full h-32 p-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none bg-white shadow-inner"
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Orchestrating...' : 'Generate Campaign Plan'}
              </button>
            </form>
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        <div>
          {plan ? (
            <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
              <div className="border-b border-slate-200/60 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Campaign Plan
                </h3>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
                  {plan.status === 'PLANNED' ? 'CAMPAIGN PLAN CREATED' : 'DRAFT'}
                </span>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Audience</span>
                    <p className="text-xl font-semibold text-slate-900">{plan.audienceCount} <span className="text-sm font-medium text-slate-500">customers</span></p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Opportunity Value</span>
                    <p className="text-xl font-semibold text-emerald-600">{plan.opportunityValue}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audience Criteria</span>
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-sm font-medium text-slate-700">
                    <span className="text-slate-500 font-normal">Bought:</span> {plan.audienceBoughtCategory || 'Any'} <br/>
                    <span className="text-slate-500 font-normal">Not Bought:</span> {plan.audienceNotBoughtCategory || 'Any'}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Promoted Product</span>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-sm font-medium text-slate-700">
                    {plan.targetProductImage && (
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-200 flex-shrink-0">
                        <img src={plan.targetProductImage} alt="Product" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <div>{plan.targetProduct}</div>
                      {plan.targetProductPrice && <div className="text-xs text-slate-500 font-semibold">{plan.targetProductPrice}</div>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Generated Message</span>
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-sm">
                    {plan.message}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Call to Action</span>
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-sm font-medium text-slate-700 inline-block">
                    {plan.cta}
                  </div>
                </div>

                {!executionResult ? (
                  <button
                    onClick={handleExecute}
                    disabled={executing || plan.audienceCount === 0}
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg text-sm transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {executing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {executing ? 'Sending Campaign...' : `Send to ${plan.audienceCount} Eligible Customers`}
                  </button>
                ) : (
                  <div className="mt-6 p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      Execution Results
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Status</div>
                        <div className={`font-semibold ${executionResult.status === 'SENT' ? 'text-emerald-600' : executionResult.status === 'PARTIALLY_SENT' ? 'text-amber-600' : executionResult.status === 'NOT_SENT' ? 'text-slate-600' : 'text-red-600'}`}>
                          {executionResult.status}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Attempted</div>
                        <div className="font-semibold text-slate-900">{executionResult.attemptedCount ?? 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Accepted</div>
                        <div className="font-semibold text-slate-900">{executionResult.successCount ?? 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Failed</div>
                        <div className="font-semibold text-slate-900">{executionResult.failedCount ?? 0}</div>
                      </div>
                    </div>
                    {executionResult.message && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm font-medium">
                        {executionResult.message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-8 text-center text-sm text-slate-500 min-h-[400px]">
              Describe a campaign on the left to see the generated plan, audience count, and opportunity value.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
