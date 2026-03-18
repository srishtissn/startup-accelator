import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Brain, Send, Loader2, TrendingUp, Zap, BarChart3, RefreshCw } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getScoreColor } from '@/lib/utils'
import { analyzePitchDeck, estimateValuation, chatWithAI } from '@/lib/ai'
import type { Startup } from '@/lib/database.types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AIInsightsPage() {
  const { user } = useAuthStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [valuation, setValuation] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your AI startup advisor. I can help you with fundraising strategy, pitch feedback, growth tactics, and more. What would you like to discuss?" }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('startups').select('*').eq('user_id', user!.id).single()
      setStartup(data)
      if (data?.ai_summary) {
        setAnalysis({ summary: data.ai_summary, strengths: data.ai_strengths, weaknesses: data.ai_weaknesses, score: data.ai_score })
      }
      setLoading(false)
    }
    if (user) load()
  }, [user])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const runAnalysis = async () => {
    if (!startup) return
    setAnalyzing(true)
    try {
      const result = await analyzePitchDeck(
        startup.name, startup.description || '', startup.sector, startup.stage,
        startup.funding_goal || 0, startup.revenue, startup.team_size
      )
      setAnalysis(result)
      await supabase.from('startups').update({
        ai_summary: result.summary, ai_strengths: result.strengths,
        ai_weaknesses: result.weaknesses, ai_score: result.score,
      }).eq('id', startup.id)
    } finally {
      setAnalyzing(false)
    }
  }

  const runValuation = async () => {
    if (!startup) return
    setEstimating(true)
    try {
      const result = await estimateValuation(
        startup.sector, startup.stage, startup.revenue,
        15, startup.team_size, (startup.funding_goal || 0) * 10
      )
      setValuation(result)
    } finally {
      setEstimating(false)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: msg }])
    setChatLoading(true)

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }))
      const reply = await chatWithAI(msg, 'startup', history)
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-brand-400" />
            AI Insights
          </h1>
          <p className="text-white/40 text-sm mt-1">Powered by Claude AI</p>
        </div>

        {!startup ? (
          <div className="card p-10 text-center">
            <p className="text-white/40">Create your startup profile first to get AI insights.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              {/* Pitch Analysis */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-brand-400" />
                    <h2 className="font-semibold text-white text-sm">Pitch Deck Analysis</h2>
                  </div>
                  <button onClick={runAnalysis} disabled={analyzing} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                    {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {analyzing ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze'}
                  </button>
                </div>

                {analysis ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`text-4xl font-bold ${getScoreColor(analysis.score)}`}>{analysis.score}</div>
                      <div>
                        <div className="text-xs text-white/40">Overall Score</div>
                        <div className="w-32 h-1.5 bg-white/5 rounded-full mt-1">
                          <div className={`h-full rounded-full ${analysis.score >= 70 ? 'bg-accent-green' : analysis.score >= 50 ? 'bg-accent-amber' : 'bg-red-400'}`}
                            style={{ width: `${analysis.score}%` }} />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-white/55 leading-relaxed">{analysis.summary}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-accent-green mb-2">✓ Strengths</p>
                        {analysis.strengths?.map((s: string) => <p key={s} className="text-xs text-white/40 mb-1">• {s}</p>)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-red-400 mb-2">✗ Improve</p>
                        {analysis.weaknesses?.map((w: string) => <p key={w} className="text-xs text-white/40 mb-1">• {w}</p>)}
                      </div>
                    </div>
                    {analysis.recommendations && (
                      <div className="pt-3 border-t border-white/5">
                        <p className="text-xs font-semibold text-brand-400 mb-2">Recommendations</p>
                        {analysis.recommendations.map((r: string) => <p key={r} className="text-xs text-white/40 mb-1">→ {r}</p>)}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-10 h-10 text-white/10 mx-auto mb-3" />
                    <p className="text-xs text-white/30">Click Analyze to get AI-powered feedback on your startup</p>
                  </div>
                )}
              </div>

              {/* Valuation */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-accent-amber" />
                    <h2 className="font-semibold text-white text-sm">Valuation Estimate</h2>
                  </div>
                  <button onClick={runValuation} disabled={estimating} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                    {estimating ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                    {estimating ? 'Calculating...' : valuation ? 'Recalculate' : 'Estimate'}
                  </button>
                </div>

                {valuation ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="text-3xl font-bold text-accent-amber">{formatCurrency(valuation.estimated_valuation)}</div>
                    <p className="text-xs text-white/40">{valuation.methodology}</p>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <div className="text-white/30">Low</div>
                        <div className="font-medium text-white/60">{formatCurrency(valuation.range_low)}</div>
                      </div>
                      <div className="w-px bg-white/10" />
                      <div>
                        <div className="text-white/30">High</div>
                        <div className="font-medium text-white/60">{formatCurrency(valuation.range_high)}</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/5">
                      <p className="text-xs font-semibold text-white/50 mb-1.5">Key Factors</p>
                      {valuation.factors?.map((f: string) => <p key={f} className="text-xs text-white/35 mb-1">• {f}</p>)}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-10 h-10 text-white/10 mx-auto mb-3" />
                    <p className="text-xs text-white/30">Get an AI-powered valuation estimate based on your metrics</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column — AI Chat */}
            <div className="card flex flex-col h-[600px]">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center">
                  <Brain className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">AI Advisor</p>
                  <p className="text-xs text-accent-green flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-green inline-block" /> Online
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs text-sm px-3.5 py-2.5 rounded-2xl leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-500 text-white rounded-br-sm'
                        : 'bg-dark-700 text-white/75 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-dark-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-white/5">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                    placeholder="Ask about fundraising, pitch strategy..."
                    className="input flex-1 py-2.5 text-sm"
                  />
                  <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading}
                    className="p-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-40 rounded-xl transition-colors">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
