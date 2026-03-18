import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { TrendingUp, Users, DollarSign, Target, ArrowRight, Zap, Brain, Upload, Star } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getStageColor, cn } from '@/lib/utils'
import type { Startup, MarketplaceListing } from '@/lib/database.types'

const mockTraction = [
  { month: 'Oct', users: 120, revenue: 45000 },
  { month: 'Nov', users: 180, revenue: 72000 },
  { month: 'Dec', users: 290, revenue: 98000 },
  { month: 'Jan', users: 410, revenue: 145000 },
  { month: 'Feb', users: 590, revenue: 210000 },
  { month: 'Mar', users: 780, revenue: 310000 },
]

const radarData = [
  { subject: 'Product', value: 80 },
  { subject: 'Team', value: 70 },
  { subject: 'Market', value: 85 },
  { subject: 'Traction', value: 60 },
  { subject: 'Finance', value: 55 },
  { subject: 'IP', value: 65 },
]

export default function StartupDashboard() {
  const { user } = useAuthStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: startupData } = await supabase
        .from('startups')
        .select('*')
        .eq('user_id', user!.id)
        .single()
      setStartup(startupData)

      if (startupData) {
        const { data: listingData } = await supabase
          .from('marketplace_listings')
          .select('*')
          .eq('startup_id', startupData.id)
          .limit(3)
        setListings(listingData || [])
      }
      setLoading(false)
    }
    if (user) load()
  }, [user])

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  )

  if (!startup) return (
    <Layout>
      <div className="max-w-lg mx-auto mt-16 text-center card p-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-5">
          <Zap className="w-7 h-7 text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Complete your startup profile</h2>
        <p className="text-white/40 mb-6 text-sm">Add your startup details to start getting discovered by investors.</p>
        <Link to="/startup/profile" className="btn-primary inline-flex items-center gap-2">
          Set Up Profile <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Layout>
  )

  const fundingPercent = startup.funding_goal
    ? Math.min((startup.funding_raised / startup.funding_goal) * 100, 100)
    : 0

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{startup.name}</h1>
            <p className="text-white/40 text-sm mt-1">{startup.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('badge', getStageColor(startup.stage))}>{startup.stage}</span>
            <Link to="/startup/ai-insights" className="btn-primary text-sm flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> AI Insights
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: 'Funding Raised', value: formatCurrency(startup.funding_raised), change: '+12.8%', color: 'text-accent-green' },
            { icon: Target, label: 'Funding Goal', value: formatCurrency(startup.funding_goal || 0), change: `${fundingPercent.toFixed(0)}% reached`, color: 'text-brand-400' },
            { icon: Users, label: 'Team Size', value: startup.team_size.toString(), change: 'members', color: 'text-accent-blue' },
            { icon: TrendingUp, label: 'Traction Score', value: `${startup.ai_score || startup.traction_score}/100`, change: 'AI scored', color: 'text-accent-amber' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/40 font-medium">{stat.label}</span>
                <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className={`text-xs mt-1 ${stat.color}`}>{stat.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Funding Progress */}
        {startup.funding_goal && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white text-sm">Funding Progress</h3>
              <span className="text-xs text-white/40">{fundingPercent.toFixed(0)}% of goal</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fundingPercent}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-brand-500 to-brand-light rounded-full"
              />
            </div>
            <div className="flex justify-between text-xs text-white/30 mt-2">
              <span>{formatCurrency(startup.funding_raised)} raised</span>
              <span>Goal: {formatCurrency(startup.funding_goal)}</span>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Traction chart */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Growth Trajectory</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mockTraction}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6d4dff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6d4dff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#5a5a75', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a5a75', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', color: '#fff' }} />
                <Area type="monotone" dataKey="users" stroke="#6d4dff" fill="url(#userGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Radar chart */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Startup Health Score</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#5a5a75', fontSize: 11 }} />
                <Radar dataKey="value" stroke="#6d4dff" fill="#6d4dff" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Summary */}
        {startup.ai_summary && (
          <div className="card p-5 border-brand-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-brand-400" />
              <h3 className="font-semibold text-white text-sm">AI Analysis Summary</h3>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">{startup.ai_summary}</p>
            {startup.ai_strengths && (
              <div className="mt-4 flex flex-wrap gap-2">
                {startup.ai_strengths.map(s => (
                  <span key={s} className="badge bg-accent-green/10 text-accent-green text-xs">
                    <Star className="w-3 h-3" /> {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Upload, label: 'Upload Pitch Deck', desc: 'Get AI feedback', href: '/startup/profile', color: 'text-brand-400 bg-brand-500/10' },
            { icon: Brain, label: 'Run AI Analysis', desc: 'Score your startup', href: '/startup/ai-insights', color: 'text-accent-green bg-accent-green/10' },
            { icon: Target, label: 'Post to Marketplace', desc: 'Find investors', href: '/marketplace', color: 'text-accent-amber bg-accent-amber/10' },
          ].map(action => (
            <Link key={action.label} to={action.href} className="card-hover p-5 flex items-center gap-4 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">{action.label}</div>
                <div className="text-xs text-white/40">{action.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 ml-auto transition-all group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}
