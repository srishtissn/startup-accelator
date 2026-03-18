import { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, Save, Loader2, FileText, X, CheckCircle, Brain } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { SECTORS, STAGES, formatCurrency } from '@/lib/utils'
import { analyzePitchDeck } from '@/lib/ai'
import type { Startup } from '@/lib/database.types'

export default function StartupProfile() {
  const { user } = useAuthStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [aiResult, setAiResult] = useState<any>(null)

  // Form state
  const [form, setForm] = useState({
    name: '', tagline: '', description: '', sector: '', stage: 'idea',
    founded_year: '', team_size: '1', funding_goal: '', revenue: '',
    website: '', video_url: '',
  })

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('startups').select('*').eq('user_id', user!.id).single()
      if (data) {
        setStartup(data)
        setForm({
          name: data.name || '',
          tagline: data.tagline || '',
          description: data.description || '',
          sector: data.sector || '',
          stage: data.stage || 'idea',
          founded_year: data.founded_year?.toString() || '',
          team_size: data.team_size?.toString() || '1',
          funding_goal: data.funding_goal?.toString() || '',
          revenue: data.revenue?.toString() || '',
          website: data.website || '',
          video_url: data.video_url || '',
        })
        if (data.ai_summary) {
          setAiResult({
            summary: data.ai_summary,
            strengths: data.ai_strengths,
            weaknesses: data.ai_weaknesses,
            score: data.ai_score,
          })
        }
      }
      setLoading(false)
    }
    if (user) load()
  }, [user])

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setUploadedFile(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.ms-powerpoint': ['.ppt', '.pptx'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        sector: form.sector,
        stage: form.stage as any,
        founded_year: form.founded_year ? parseInt(form.founded_year) : null,
        team_size: parseInt(form.team_size) || 1,
        funding_goal: form.funding_goal ? parseFloat(form.funding_goal) : null,
        revenue: form.revenue ? parseFloat(form.revenue) : 0,
        website: form.website,
        video_url: form.video_url,
        user_id: user!.id,
      }

      let pitchDeckUrl = startup?.pitch_deck_url

      // Upload pitch deck if new file
      if (uploadedFile) {
        setUploadProgress(30)
        const path = `${user!.id}/${Date.now()}_${uploadedFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pitch-decks')
          .upload(path, uploadedFile)
        if (!uploadError && uploadData) {
          pitchDeckUrl = uploadData.path
          setUploadProgress(100)
        }
      }

      if (startup) {
        await supabase.from('startups').update({ ...payload, pitch_deck_url: pitchDeckUrl }).eq('id', startup.id)
      } else {
        const { data } = await supabase.from('startups').insert({ ...payload, pitch_deck_url: pitchDeckUrl }).select().single()
        setStartup(data)
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  const handleAIAnalysis = async () => {
    if (!startup && !form.name) return
    setAnalyzing(true)
    try {
      const result = await analyzePitchDeck(
        form.name,
        form.description,
        form.sector,
        form.stage,
        parseFloat(form.funding_goal) || 0,
        parseFloat(form.revenue) || 0,
        parseInt(form.team_size) || 1
      )
      setAiResult(result)

      if (startup) {
        await supabase.from('startups').update({
          ai_summary: result.summary,
          ai_strengths: result.strengths,
          ai_weaknesses: result.weaknesses,
          ai_score: result.score,
        }).eq('id', startup.id)
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Startup Profile</h1>
          <div className="flex gap-2">
            <button onClick={handleAIAnalysis} disabled={analyzing || !form.name} className="btn-secondary text-sm flex items-center gap-1.5">
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5 text-brand-400" />}
              {analyzing ? 'Analyzing...' : 'AI Analysis'}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white">Basic Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Startup Name *</label>
              <input value={form.name} onChange={update('name')} className="input" placeholder="Your startup name" />
            </div>
            <div>
              <label className="label">Sector *</label>
              <select value={form.sector} onChange={update('sector')} className="input">
                <option value="">Select sector</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Tagline</label>
            <input value={form.tagline} onChange={update('tagline')} className="input" placeholder="One-line pitch" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={update('description')} className="input resize-none h-28" placeholder="Describe your product, problem you solve, and market opportunity..." />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Stage</label>
              <select value={form.stage} onChange={update('stage')} className="input">
                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Founded Year</label>
              <input type="number" value={form.founded_year} onChange={update('founded_year')} className="input" placeholder="2023" />
            </div>
            <div>
              <label className="label">Team Size</label>
              <input type="number" value={form.team_size} onChange={update('team_size')} className="input" placeholder="1" min="1" />
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white">Financials</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Funding Goal (₹)</label>
              <input type="number" value={form.funding_goal} onChange={update('funding_goal')} className="input" placeholder="e.g. 5000000" />
              {form.funding_goal && <p className="text-xs text-white/30 mt-1">= {formatCurrency(parseFloat(form.funding_goal))}</p>}
            </div>
            <div>
              <label className="label">Annual Revenue (₹)</label>
              <input type="number" value={form.revenue} onChange={update('revenue')} className="input" placeholder="e.g. 1200000" />
              {form.revenue && <p className="text-xs text-white/30 mt-1">= {formatCurrency(parseFloat(form.revenue))}</p>}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Website</label>
              <input value={form.website} onChange={update('website')} className="input" placeholder="https://..." />
            </div>
            <div>
              <label className="label">Demo Video URL</label>
              <input value={form.video_url} onChange={update('video_url')} className="input" placeholder="https://youtube.com/..." />
            </div>
          </div>
        </div>

        {/* Pitch Deck Upload */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Pitch Deck</h2>
          {startup?.pitch_deck_url && !uploadedFile && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 mb-4">
              <FileText className="w-5 h-5 text-brand-400" />
              <span className="text-sm text-white/60 flex-1">Current deck uploaded</span>
              <span className="badge bg-accent-green/10 text-accent-green text-xs">Active</span>
            </div>
          )}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragActive ? 'border-brand-500 bg-brand-500/5' : 'border-white/10 hover:border-brand-500/40 hover:bg-white/2'}`}
          >
            <input {...getInputProps()} />
            {uploadedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-6 h-6 text-brand-400" />
                <span className="text-white/70 text-sm">{uploadedFile.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null) }} className="text-white/30 hover:text-white/60">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 text-sm">Drag and drop your pitch deck here</p>
                <p className="text-white/25 text-xs mt-1">PDF or PowerPoint, max 20MB</p>
              </>
            )}
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>

        {/* AI Analysis Results */}
        {aiResult && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 border-brand-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-brand-400" />
                <h2 className="font-semibold text-white">AI Analysis</h2>
              </div>
              <div className={`text-2xl font-bold ${aiResult.score >= 70 ? 'text-accent-green' : aiResult.score >= 50 ? 'text-accent-amber' : 'text-red-400'}`}>
                {aiResult.score}/100
              </div>
            </div>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">{aiResult.summary}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-accent-green uppercase tracking-wide mb-2">Strengths</h4>
                <ul className="space-y-1.5">
                  {aiResult.strengths?.map((s: string) => (
                    <li key={s} className="text-xs text-white/50 flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-accent-green mt-0.5 flex-shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Areas to Improve</h4>
                <ul className="space-y-1.5">
                  {aiResult.weaknesses?.map((w: string) => (
                    <li key={w} className="text-xs text-white/50 flex items-start gap-2">
                      <X className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />{w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {aiResult.valuation_estimate > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-xs text-white/40">Estimated Valuation: </span>
                <span className="text-sm font-semibold text-brand-300">{formatCurrency(aiResult.valuation_estimate)}</span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  )
}
