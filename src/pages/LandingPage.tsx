import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, Zap, Shield, Users, ArrowRight, CheckCircle, BarChart3, Brain, MessageSquare } from 'lucide-react'

const features = [
  { icon: Brain, title: 'AI-Powered Matching', desc: 'Our ML engine connects startups with the right investors based on sector, stage, and investment thesis.' },
  { icon: BarChart3, title: 'Pitch Deck Analysis', desc: 'Upload your deck and get instant AI feedback — strengths, weaknesses, and a traction score.' },
  { icon: TrendingUp, title: 'Valuation Insights', desc: 'Get data-driven valuation estimates using ML models trained on real funding data.' },
  { icon: MessageSquare, title: 'Real-time Messaging', desc: 'Secure, real-time communication between founders and investors with document sharing.' },
  { icon: Shield, title: 'Verified Investors', desc: 'Every investor on the platform is verified. No fake profiles, no spam.' },
  { icon: Users, title: 'Startup Marketplace', desc: 'List funding rounds, seek partnerships, or explore acquisition opportunities.' },
]

const stats = [
  { value: '2,400+', label: 'Startups' },
  { value: '340+', label: 'Active Investors' },
  { value: '₹480Cr', label: 'Funded' },
  { value: '94%', label: 'Match Rate' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">VentureLink</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/auth?tab=signup" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered Startup Accelerator
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Connect Startups<br />
              <span className="text-gradient">with the Right</span><br />
              Investors
            </h1>

            <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
              VentureLink uses AI to match founders with investors, analyze pitch decks, predict valuations, and accelerate fundraising — all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?tab=signup&role=startup" className="btn-primary text-base px-8 py-3 flex items-center gap-2 group">
                I'm a Founder
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/auth?tab=signup&role=investor" className="btn-secondary text-base px-8 py-3 flex items-center gap-2">
                I'm an Investor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="text-3xl font-bold text-gradient mb-1">{s.value}</div>
              <div className="text-sm text-white/40">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to fundraise faster</h2>
            <p className="text-white/40 text-lg">Powerful tools for founders and investors, powered by AI</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="card-hover p-6 group">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                  <f.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-12 glow-border">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-white/40 mb-8">Join thousands of founders and investors on VentureLink</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {['Free to start', 'No credit card', 'AI-powered'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle className="w-4 h-4 text-accent-green" />
                  {t}
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link to="/auth?tab=signup" className="btn-primary text-base px-10 py-3 inline-flex items-center gap-2">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-white/30 text-sm">
        © 2024 VentureLink. Built with ❤️ for the startup ecosystem.
      </footer>
    </div>
  )
}
