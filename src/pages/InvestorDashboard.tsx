import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts'
import { DollarSign, TrendingUp, Briefcase, Star, ArrowRight, Search, Zap } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { formatCurrency, cn } from '@/lib/utils'
import type { Investor, Recommendation, Startup } from '@/lib/database.types'

const portfolioData = [
  { name: 'FinTech', value: 40, color: '#6d4dff' },
  { name: 'AI/ML', value: 25, color: '#00b4ff' },
  { name: 'HealthTech', value: 20, color: '#00e5a0' },
  { name: 'E-commerce', value: 15, color: '#ffb800' },
]

const performanceData = [
  { month: 'Jan', value: 30000 }, { month: 'Feb', value: 38000 }, { month: 'Mar', value: 35000 },
  { month: 'Apr', value: 42000 }, { month: 'May', value: 58000 }, { month: 'Jun', value: 65000 },
]

const riskData = [
  { subject: 'FinTech', value: 75 }, { subject: 'AI', value: 60 }, { subject: 'HealthTech', value: 45 },
  { subject: 'E-commerce', value: 85 }, { subject: 'SaaS', value: 55 },
]

interface RecommendedStartup extends Recommendation {
  startup: Startup
}

export default function InvestorDashboard() {
  const { user } = useAuthStore()
  const [investor, setInvestor] = useState<Investor | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedStartup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: investorData } = await supabase
        .from('investors')
        .select('*')
        .eq('user_id', user!.id)
        .single()
      setInvestor(investorData)

      if (investorData) {
        const { data: recs } = await supabase
          .from('recommendations')
          .select('*, startup:startups(*)')
          .eq('investor_id', investorData.id)
          .order('match_score', { ascending: false })
          .limit(3)
        setRecommendations((recs as any) || [])
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

  const stats = investor ? [
    { icon: DollarSign, label: 'Total Invested', value: formatCurrency(investor.total_invested), change: '+12%', color: 'text-brand-400' },
    { icon: TrendingUp, label: 'Portfolio Value', value: formatCurrency(investor.portfolio_value), change: '+18%', color: 'text-accent-green' },
    { icon: Briefcase, label: 'ROI', value: `${investor.roi}x`, change: '+9%', color: 'text-accent-amber' },
    { icon: Star, label: 'Portfolio Size', value: investor.portfolio_size.toString(), change: 'companies', color: 'text-accent-blue' },
  ] : []

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Investor Dashboard</h1>
            <p className="text-white/40 text-sm mt-0.5">{investor?.firm_name || user?.full_name}</p>
          </div>
          <Link to="/investor/discover" className="btn-primary text-sm flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" /> Discover Startups
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/40">{stat.label}</span>
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className={`text-xs mt-1 ${stat.color}`}>{stat.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Portfolio allocation */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Portfolio Allocation</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {portfolioData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {portfolioData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-white/50">{d.name} — {d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Investment performance */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Investment Performance</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={performanceData}>
                <XAxis dataKey="month" tick={{ fill: '#5a5a75', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a5a75', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', color: '#fff' }} />
                <Line type="monotone" dataKey="value" stroke="#6d4dff" strokeWidth={2.5} dot={{ fill: '#6d4dff', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Risk distribution */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={riskData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#5a5a75', fontSize: 10 }} />
                <Radar dataKey="value" stroke="#ff3d9a" fill="#ff3d9a" fillOpacity={0.12} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommended Startups */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-400" />
              <h3 className="font-semibold text-white text-sm">AI Recommended Startups</h3>
            </div>
            <Link to="/investor/discover" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/30 text-sm">No recommendations yet. Discover startups to get AI-powered matches.</p>
              <Link to="/investor/discover" className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                <Search className="w-3.5 h-3.5" /> Browse Startups
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 hover:border-brand-500/20 transition-colors">
                  <div>
                    <div className="font-medium text-white text-sm">{rec.startup?.name}</div>
                    <div className="text-xs text-white/40 mt-0.5">{rec.startup?.sector} • {rec.startup?.stage}</div>
                    <div className="text-xs text-white/30 mt-1">Traction Score: {rec.startup?.traction_score}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${rec.match_score >= 80 ? 'text-accent-green' : rec.match_score >= 60 ? 'text-accent-amber' : 'text-white/60'}`}>
                        {rec.match_score}%
                      </div>
                      <div className="text-xs text-white/30">match</div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button className="btn-primary text-xs px-3 py-1.5">Invest Now</button>
                      <Link to="/chat" className="btn-secondary text-xs px-3 py-1.5 text-center">Chat</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
