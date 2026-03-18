import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, Search, MessageSquare, ShoppingBag,
  Brain, Settings, LogOut, Bell, ChevronDown, Menu, X, Rocket, TrendingUp,
  User, Star
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

const startupNav: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/startup/dashboard' },
  { icon: Rocket, label: 'My Profile', href: '/startup/profile' },
  { icon: Brain, label: 'AI Insights', href: '/startup/ai-insights' },
  { icon: ShoppingBag, label: 'Marketplace', href: '/marketplace' },
  { icon: MessageSquare, label: 'Messages', href: '/chat' },
]

const investorNav: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/investor/dashboard' },
  { icon: Search, label: 'Discover', href: '/investor/discover' },
  { icon: Briefcase, label: 'Portfolio', href: '/investor/dashboard' },
  { icon: Star, label: 'Recommendations', href: '/investor/discover' },
  { icon: ShoppingBag, label: 'Marketplace', href: '/marketplace' },
  { icon: MessageSquare, label: 'Messages', href: '/chat' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navItems = user?.role === 'investor' ? investorNav : startupNav

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">VentureLink</span>
        </Link>
      </div>

      {/* User role badge */}
      <div className="px-5 py-3 border-b border-white/5">
        <div className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
          user?.role === 'investor' ? 'bg-accent-amber/10 text-accent-amber' : 'bg-brand-500/10 text-brand-300'
        )}>
          {user?.role === 'investor' ? <Briefcase className="w-3 h-3" /> : <Rocket className="w-3 h-3" />}
          {user?.role === 'investor' ? 'Investor' : 'Startup'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href + item.label}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn('sidebar-link', isActive && 'active')}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/5 space-y-0.5">
        <Link to="/settings" className="sidebar-link" onClick={() => setSidebarOpen(false)}>
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button onClick={handleSignOut} className="sidebar-link w-full text-left text-red-400/70 hover:text-red-400 hover:bg-red-400/5">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-900 mesh-bg">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-64 bg-dark-800 border-r border-white/5 z-50 lg:hidden"
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:flex lg:flex-col bg-dark-800 border-r border-white/5 z-30">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-dark-900/80 backdrop-blur-xl border-b border-white/5 px-4 lg:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-sm font-medium text-white/40">
              {navItems.find(n => n.href === location.pathname)?.label || 'VentureLink'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-pink rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <span className="hidden sm:block text-sm text-white/70 font-medium max-w-24 truncate">
                  {user?.full_name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-white/30" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-dark-700 border border-white/8 rounded-xl shadow-xl overflow-hidden z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                      <p className="text-xs text-white/40 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-400/5 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 min-h-[calc(100vh-56px)]">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
