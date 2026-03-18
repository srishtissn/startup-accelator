import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = '₹'): string {
  if (amount >= 10000000) return `${currency}${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `${currency}${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(1)}K`
  return `${currency}${amount.toLocaleString()}`
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function timeAgo(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return then.toLocaleDateString()
}

export const SECTORS = [
  'FinTech', 'HealthTech', 'EdTech', 'AgriTech', 'E-commerce',
  'AI/ML', 'SaaS', 'CleanTech', 'RetailTech', 'LogisticsTech',
  'PropTech', 'InsurTech', 'FoodTech', 'SpaceTech', 'BioTech',
  'Cybersecurity', 'Blockchain', 'Gaming', 'Media', 'Other'
]

export const STAGES = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'mvp', label: 'MVP' },
  { value: 'early-traction', label: 'Early Traction' },
  { value: 'growth', label: 'Growth' },
  { value: 'scale', label: 'Scale' },
]

export const INVESTMENT_TYPES = [
  { value: 'equity', label: 'Equity' },
  { value: 'debt', label: 'Debt' },
  { value: 'grant', label: 'Grant' },
  { value: 'convertible', label: 'Convertible Note' },
]

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    idea: 'text-gray-400 bg-gray-400/10',
    mvp: 'text-blue-400 bg-blue-400/10',
    'early-traction': 'text-yellow-400 bg-yellow-400/10',
    growth: 'text-green-400 bg-green-400/10',
    scale: 'text-purple-400 bg-purple-400/10',
  }
  return colors[stage] || 'text-gray-400 bg-gray-400/10'
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-accent-green'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export function generateAvatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6d4dff&textColor=ffffff`
}
