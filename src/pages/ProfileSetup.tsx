import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { SECTORS, STAGES } from '@/lib/utils'

export default function ProfileSetup() {
  const { user, refreshUser } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Shared
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')

  // Startup fields
  const [startupName, setStartupName] = useState('')
  const [tagline, setTagline] = useState('')
  const [sector, setSector] = useState('')
  const [stage, setStage] = useState('idea')
  const [fundingGoal, setFundingGoal] = useState('')
  const [description, setDescription] = useState('')

  // Investor fields
  const [firmName, setFirmName] = useState('')
  const [thesis, setThesis] = useState('')
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [minInvestment, setMinInvestment] = useState('')
  const [maxInvestment, setMaxInvestment] = useState('')

  const isStartup = user?.role === 'startup'

  const toggleSector = (s: string) =>
    setSelectedSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  const toggleStage = (s: string) =>
    setSelectedStages(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Update profile
      await supabase.from('profiles').update({ bio, location, website }).eq('id', user!.id)

      if (isStartup) {
        if (!startupName || !sector) { setError('Startup name and sector are required'); setLoading(false); return }
        await supabase.from('startups').insert({
          user_id: user!.id,
          name: startupName,
          tagline,
          description,
          sector,
          stage: stage as any,
          funding_goal: fundingGoal ? parseFloat(fundingGoal) : null,
        })
      } else {
        await supabase.from('investors').insert({
          user_id: user!.id,
          firm_name: firmName,
          investment_thesis: thesis,
          sectors_of_interest: selectedSectors,
          stages_of_interest: selectedStages,
          min_investment: minInvestment ? parseFloat(minInvestment) : null,
          max_investment: maxInvestment ? parseFloat(maxInvestment) : null,
        })
      }

      await refreshUser()
      navigate('/dashboard')
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 mesh-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-white/40">Tell us more about {isStartup ? 'your startup' : 'your investment interests'}</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-brand-500' : 'bg-white/10'}`} />
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-white text-lg mb-4">Basic Information</h2>
              <div>
                <label className="label">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} className="input resize-none h-20" placeholder="Tell us about yourself..." />
              </div>
              <div>
                <label className="label">Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} className="input" placeholder="City, Country" />
              </div>
              <div>
                <label className="label">Website (optional)</label>
                <input value={website} onChange={e => setWebsite(e.target.value)} className="input" placeholder="https://..." />
              </div>
              <button onClick={() => setStep(2)} className="btn-primary w-full py-3 mt-2">
                Continue →
              </button>
            </div>
          )}

          {step === 2 && isStartup && (
            <div className="space-y-4">
              <h2 className="font-semibold text-white text-lg mb-4">Your Startup</h2>
              <div>
                <label className="label">Startup Name *</label>
                <input value={startupName} onChange={e => setStartupName(e.target.value)} className="input" placeholder="e.g. FinEdge AI" />
              </div>
              <div>
                <label className="label">Tagline</label>
                <input value={tagline} onChange={e => setTagline(e.target.value)} className="input" placeholder="One sentence pitch" />
              </div>
              <div>
                <label className="label">Sector *</label>
                <select value={sector} onChange={e => setSector(e.target.value)} className="input">
                  <option value="">Select sector</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Stage</label>
                <select value={stage} onChange={e => setStage(e.target.value)} className="input">
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Funding Goal (₹)</label>
                <input type="number" value={fundingGoal} onChange={e => setFundingGoal(e.target.value)} className="input" placeholder="e.g. 5000000" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="input resize-none h-24" placeholder="Describe your startup..." />
              </div>
              {error && <div className="text-red-400 text-sm bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Back</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Finish Setup
                </button>
              </div>
            </div>
          )}

          {step === 2 && !isStartup && (
            <div className="space-y-5">
              <h2 className="font-semibold text-white text-lg mb-4">Investment Preferences</h2>
              <div>
                <label className="label">Firm / Fund Name</label>
                <input value={firmName} onChange={e => setFirmName(e.target.value)} className="input" placeholder="e.g. Sequoia India" />
              </div>
              <div>
                <label className="label">Investment Thesis</label>
                <textarea value={thesis} onChange={e => setThesis(e.target.value)} className="input resize-none h-20" placeholder="What kind of startups do you back?" />
              </div>
              <div>
                <label className="label">Sectors of Interest (select multiple)</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SECTORS.slice(0, 10).map(s => (
                    <button key={s} type="button" onClick={() => toggleSector(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedSectors.includes(s) ? 'bg-brand-500/20 border-brand-500/50 text-brand-300' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Preferred Stages</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STAGES.map(s => (
                    <button key={s.value} type="button" onClick={() => toggleStage(s.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedStages.includes(s.value) ? 'bg-brand-500/20 border-brand-500/50 text-brand-300' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Min Investment (₹)</label>
                  <input type="number" value={minInvestment} onChange={e => setMinInvestment(e.target.value)} className="input" placeholder="100000" />
                </div>
                <div>
                  <label className="label">Max Investment (₹)</label>
                  <input type="number" value={maxInvestment} onChange={e => setMaxInvestment(e.target.value)} className="input" placeholder="10000000" />
                </div>
              </div>
              {error && <div className="text-red-400 text-sm bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Back</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Finish Setup
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
