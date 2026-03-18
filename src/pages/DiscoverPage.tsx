import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Zap, FileText, MessageSquare, TrendingUp, X, Loader2 } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { SECTORS, STAGES, formatCurrency, getStageColor, cn } from '@/lib/utils'
import { matchStartupToInvestor } from '@/lib/ai'
import type { Startup, Investor } from '@/lib/database.types'

export default function DiscoverPage() {
  const { user } = useAuthStore()
  const [startups, setStartups] = useState<Startup[]>([])
  const [investor, setInvestor] = useState<Investor | null>(null)
  const [loading, setLoading] = useState(true)
  const [matchingId, setMatchingId] = useState<string | null>(null)
  const [matchResults, setMatchResults] = useState<Record<string, { score: number; reasons: string[] }>>({})
  const [search, setSearch] = useState('')
  const [filterSector, setFilterSector] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: inv } = await supabase.from('investors').select('*').eq('user_id', user!.id).single()
      setInvestor(inv)

      let query = supabase.from('startups').select('*').eq('is_active', true).order('created_at', { ascending: false })
      const { data } = await query
      setStartups(data || [])
      setLoading(false)
    }
    if (user) load()
  }, [user])

  const filtered = startups.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.sector.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase())
    const matchSector = !filterSector || s.sector === filterSector
    const matchStage = !filterStage || s.stage === filterStage
    return matchSearch && matchSector && matchStage
  })

  const handleMatch = async (startup: Startup) => {
    if (!investor) return
    setMatchingId(startup.id)
    try {
      const result = await matchStartupToInvestor(
        { name: startup.name, sector: startup.sector, stage: startup.stage, funding_goal: startup.funding_goal || 0, description: startup.description || '', traction_score: startup.traction_score },
        { firm_name: investor.firm_name, investment_thesis: investor.investment_thesis, sectors_of_interest: investor.sectors_of_interest, stages_of_interest: investor.stages_of_interest, min_investment: investor.min_investment, max_investment: investor.max_investment }
      )
      setMatchResults(prev => ({ ...prev, [startup.id]: { score: result.score, reasons: result.reasons } }))

      // Save to DB
      await supabase.from('recommendations').upsert({
        investor_id: investor.id,
        startup_id: startup.id,
        match_score: result.score,
        match_reasons: result.reasons,
      }, { onConflict: 'investor_id,startup_id' })
    } finally {
      setMatchingId(null)
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Discover Startups</h1>
          <p className="text-white/40 text-sm mt-1">Find your next investment opportunity</p>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search startups by name, sector, description..."
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('btn-secondary flex items-center gap-2 text-sm', showFilters && 'border-brand-500/50 text-brand-300')}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(filterSector || filterStage) && <span className="w-2 h-2 bg-brand-500 rounded-full" />}
          </button>
        </div>

        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card p-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-36">
              <label className="label text-xs">Sector</label>
              <select value={filterSector} onChange={e => setFilterSector(e.target.value)} className="input text-sm py-2">
                <option value="">All sectors</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-36">
              <label className="label text-xs">Stage</label>
              <select value={filterStage} onChange={e => setFilterStage(e.target.value)} className="input text-sm py-2">
                <option value="">All stages</option>
                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            {(filterSector || filterStage) && (
              <button onClick={() => { setFilterSector(''); setFilterStage('') }} className="self-end btn-ghost text-sm flex items-center gap-1 text-red-400/70 hover:text-red-400 pb-2">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </motion.div>
        )}

        {/* Results count */}
        <p className="text-xs text-white/30">{filtered.length} startup{filtered.length !== 1 ? 's' : ''} found</p>

        {/* Startups Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No startups match your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((startup, i) => {
              const match = matchResults[startup.id]
              return (
                <motion.div key={startup.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="card-hover p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">{startup.name}</h3>
                        <span className={cn('badge text-xs', getStageColor(startup.stage))}>{startup.stage}</span>
                        <span className="badge bg-white/5 text-white/40 text-xs">{startup.sector}</span>
                      </div>
                      {startup.tagline && <p className="text-sm text-white/50 mb-2">{startup.tagline}</p>}
                      {startup.description && <p className="text-xs text-white/30 line-clamp-2">{startup.description}</p>}

                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/40">
                        {startup.funding_goal && <span>Seeking {formatCurrency(startup.funding_goal)}</span>}
                        {startup.revenue > 0 && <span>Revenue: {formatCurrency(startup.revenue)}/yr</span>}
                        {startup.team_size > 0 && <span>{startup.team_size} team members</span>}
                        <span>Traction: {startup.traction_score}/100</span>
                      </div>

                      {match && (
                        <div className="mt-3 p-3 rounded-xl bg-brand-500/8 border border-brand-500/15">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Zap className="w-3 h-3 text-brand-400" />
                            <span className="text-xs font-medium text-brand-300">AI Match Score: {match.score}%</span>
                          </div>
                          <ul className="space-y-0.5">
                            {match.reasons.slice(0, 2).map((r, ri) => (
                              <li key={ri} className="text-xs text-white/40">• {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleMatch(startup)}
                        disabled={matchingId === startup.id}
                        className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                      >
                        {matchingId === startup.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        {match ? `${match.score}% Match` : 'AI Match'}
                      </button>
                      <button className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> View Deck
                      </button>
                      <button className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" /> Chat
                      </button>
                      <button className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border-0">
                        <TrendingUp className="w-3 h-3" /> Invest
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
