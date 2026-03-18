import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, Eye, EyeOff, Rocket, Briefcase, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<'signin' | 'signup'>(
    searchParams.get('tab') === 'signup' ? 'signup' : 'signin'
  )
  const [role, setRole] = useState<'startup' | 'investor'>(
    (searchParams.get('role') as 'startup' | 'investor') || 'startup'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (tab === 'signin') {
        const result = await signIn(email, password)
        if (result.error) setError(result.error)
        else navigate('/dashboard')
      } else {
        if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return }
        if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }
        const result = await signUp(email, password, fullName, role)
        if (result.error) setError(result.error)
        else navigate('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 mesh-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">VentureLink</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          {/* Tabs */}
          <div className="flex bg-dark-600 rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  tab === t ? 'bg-brand-500 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Role selector (signup only) */}
          {tab === 'signup' && (
            <div className="mb-6">
              <label className="label">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'startup', icon: Rocket, label: 'Founder', desc: 'Building a startup' },
                  { value: 'investor', icon: Briefcase, label: 'Investor', desc: 'Looking to invest' },
                ] as const).map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      role === r.value
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-white/5 bg-dark-600 hover:border-white/15'
                    }`}
                  >
                    <r.icon className={`w-5 h-5 mb-2 ${role === r.value ? 'text-brand-400' : 'text-white/40'}`} />
                    <div className={`text-sm font-semibold ${role === r.value ? 'text-white' : 'text-white/60'}`}>{r.label}</div>
                    <div className="text-xs text-white/30 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="input"
                  required
                />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={tab === 'signup' ? 'Min. 6 characters' : 'Your password'}
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-6">
            {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setError('') }}
              className="text-brand-400 hover:text-brand-300 font-medium"
            >
              {tab === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
