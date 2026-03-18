import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ShoppingBag, DollarSign, Users, Zap, Building2, Loader2 } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { formatCurrency, cn } from '@/lib/utils'
import type { MarketplaceListing, Startup } from '@/lib/database.types'

type ListingType = 'funding' | 'partnership' | 'acquisition' | 'mentorship'

const typeConfig: Record<ListingType, { icon: any; label: string; color: string }> = {
  funding: { icon: DollarSign, label: 'Funding', color: 'text-brand-400 bg-brand-500/10' },
  partnership: { icon: Users, label: 'Partnership', color: 'text-accent-blue bg-accent-blue/10' },
  acquisition: { icon: Building2, label: 'Acquisition', color: 'text-accent-amber bg-accent-amber/10' },
  mentorship: { icon: Zap, label: 'Mentorship', color: 'text-accent-green bg-accent-green/10' },
}

interface ListingWithStartup extends MarketplaceListing {
  startup: Startup
}

export default function Marketplace() {
  const { user } = useAuthStore()
  const [listings, setListings] = useState<ListingWithStartup[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState<ListingType | ''>('')
  const [myStartup, setMyStartup] = useState<Startup | null>(null)

  const [form, setForm] = useState({
    listing_type: 'funding' as ListingType,
    title: '',
    description: '',
    asking_amount: '',
    equity_offered: '',
    deadline: '',
  })

  useEffect(() => {
    async function load() {
      const [{ data: listingsData }, { data: startupData }] = await Promise.all([
        supabase.from('marketplace_listings').select('*, startup:startups(*)').eq('is_active', true).order('created_at', { ascending: false }),
        user?.role === 'startup' ? supabase.from('startups').select('*').eq('user_id', user.id).single() : Promise.resolve({ data: null }),
      ])
      setListings((listingsData as any) || [])
      setMyStartup(startupData)
      setLoading(false)
    }
    if (user) load()
  }, [user])

  const handleCreate = async () => {
    if (!myStartup || !form.title) return
    setSaving(true)
    try {
      const { data } = await supabase.from('marketplace_listings').insert({
        startup_id: myStartup.id,
        listing_type: form.listing_type,
        title: form.title,
        description: form.description,
        asking_amount: form.asking_amount ? parseFloat(form.asking_amount) : null,
        equity_offered: form.equity_offered ? parseFloat(form.equity_offered) : null,
        deadline: form.deadline || null,
      }).select('*, startup:startups(*)').single()
      if (data) setListings(prev => [data as any, ...prev])
      setShowModal(false)
      setForm({ listing_type: 'funding', title: '', description: '', asking_amount: '', equity_offered: '', deadline: '' })
    } finally {
      setSaving(false)
    }
  }

  const filtered = listings.filter(l => !filterType || l.listing_type === filterType)

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Marketplace</h1>
            <p className="text-white/40 text-sm mt-0.5">Funding, partnerships, acquisitions & mentorship</p>
          </div>
          {user?.role === 'startup' && myStartup && (
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Post Listing
            </button>
          )}
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterType('')} className={cn('btn-ghost text-sm', !filterType && 'bg-white/8 text-white')}>
            All
          </button>
          {(Object.keys(typeConfig) as ListingType[]).map(type => {
            const cfg = typeConfig[type]
            return (
              <button key={type} onClick={() => setFilterType(type === filterType ? '' : type)}
                className={cn('btn-ghost text-sm flex items-center gap-1.5', filterType === type && 'bg-white/8 text-white')}>
                <cfg.icon className={`w-3.5 h-3.5 ${cfg.color.split(' ')[0]}`} />
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No listings yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((listing, i) => {
              const cfg = typeConfig[listing.listing_type]
              return (
                <motion.div key={listing.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="card-hover p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.color.split(' ')[1])}>
                      <cfg.icon className={`w-4.5 h-4.5 ${cfg.color.split(' ')[0]}`} />
                    </div>
                    <span className={cn('badge text-xs ml-auto', cfg.color)}>{cfg.label}</span>
                  </div>

                  <h3 className="font-semibold text-white mb-1">{listing.title}</h3>
                  {listing.startup && (
                    <p className="text-xs text-brand-400 mb-2">{listing.startup.name} • {listing.startup.sector}</p>
                  )}
                  {listing.description && (
                    <p className="text-xs text-white/40 line-clamp-3 mb-3 leading-relaxed">{listing.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-white/50">
                    {listing.asking_amount && <span className="font-medium text-white/70">{formatCurrency(listing.asking_amount)}</span>}
                    {listing.equity_offered && <span>{listing.equity_offered}% equity</span>}
                    {listing.deadline && <span>Deadline: {new Date(listing.deadline).toLocaleDateString()}</span>}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="btn-primary text-xs px-4 py-2 flex-1">Express Interest</button>
                    <button className="btn-secondary text-xs px-4 py-2">Message</button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-800 border border-white/8 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-white">Create Listing</h2>
                <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white/70">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Listing Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(typeConfig) as ListingType[]).map(type => {
                      const cfg = typeConfig[type]
                      return (
                        <button key={type} type="button" onClick={() => setForm(p => ({ ...p, listing_type: type }))}
                          className={cn('p-3 rounded-xl border text-left transition-all flex items-center gap-2 text-sm',
                            form.listing_type === type ? 'border-brand-500/50 bg-brand-500/10 text-white' : 'border-white/8 text-white/40 hover:border-white/15')}>
                          <cfg.icon className={`w-4 h-4 ${cfg.color.split(' ')[0]}`} />
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="label">Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="e.g. Seed Round — ₹50L for 10% equity" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input resize-none h-20" placeholder="What are you offering and what are you looking for?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Asking Amount (₹)</label>
                    <input type="number" value={form.asking_amount} onChange={e => setForm(p => ({ ...p, asking_amount: e.target.value }))} className="input" placeholder="5000000" />
                  </div>
                  <div>
                    <label className="label">Equity Offered (%)</label>
                    <input type="number" value={form.equity_offered} onChange={e => setForm(p => ({ ...p, equity_offered: e.target.value }))} className="input" placeholder="10" />
                  </div>
                </div>
                <div>
                  <label className="label">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className="input" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button onClick={handleCreate} disabled={saving || !form.title} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Post Listing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
