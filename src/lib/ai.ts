// AI Service - Uses Anthropic Claude API for various AI features

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    console.warn('Anthropic API key not set. Using mock AI responses.')
    return getMockResponse(prompt)
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt || 'You are an expert startup analyst and investor advisor. Provide concise, actionable insights.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.content[0]?.text || ''
}

function getMockResponse(prompt: string): string {
  if (prompt.includes('analyze')) {
    return JSON.stringify({
      summary: 'This startup shows strong potential in its target market with a clear value proposition. The team has relevant experience and the product addresses a genuine pain point.',
      strengths: ['Clear market need', 'Experienced founding team', 'Scalable business model'],
      weaknesses: ['Early-stage traction', 'Competitive market', 'Requires significant capital'],
      score: 72,
      valuation_estimate: 2500000,
    })
  }
  return 'AI analysis complete. Configure your Anthropic API key for real AI insights.'
}

// ============================================
// PITCH DECK ANALYSIS
// ============================================

export interface PitchDeckAnalysis {
  summary: string
  strengths: string[]
  weaknesses: string[]
  score: number
  valuation_estimate: number
  recommendations: string[]
}

export async function analyzePitchDeck(
  startupName: string,
  description: string,
  sector: string,
  stage: string,
  fundingGoal: number,
  revenue: number,
  teamSize: number
): Promise<PitchDeckAnalysis> {
  const prompt = `
Analyze this startup and provide a detailed assessment. Return ONLY a JSON object with no markdown or extra text.

Startup: ${startupName}
Sector: ${sector}
Stage: ${stage}
Description: ${description}
Funding Goal: ₹${fundingGoal?.toLocaleString() || 'Not specified'}
Current Revenue: ₹${revenue?.toLocaleString() || 0}
Team Size: ${teamSize}

Return JSON with these exact keys:
{
  "summary": "2-3 sentence executive summary",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "score": <integer 0-100>,
  "valuation_estimate": <number in rupees>,
  "recommendations": ["rec1", "rec2", "rec3"]
}
`

  try {
    const response = await callClaude(prompt)
    const clean = response.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as PitchDeckAnalysis
  } catch {
    return {
      summary: 'AI analysis unavailable. Please configure your Anthropic API key.',
      strengths: ['Configure AI for real insights'],
      weaknesses: ['API key not configured'],
      score: 0,
      valuation_estimate: 0,
      recommendations: ['Add VITE_ANTHROPIC_API_KEY to your .env file'],
    }
  }
}

// ============================================
// STARTUP-INVESTOR MATCHING
// ============================================

export interface MatchResult {
  score: number
  reasons: string[]
  recommendation: string
}

export async function matchStartupToInvestor(
  startup: {
    name: string
    sector: string
    stage: string
    funding_goal: number
    description: string
    traction_score: number
  },
  investor: {
    firm_name: string | null
    investment_thesis: string | null
    sectors_of_interest: string[] | null
    stages_of_interest: string[] | null
    min_investment: number | null
    max_investment: number | null
  }
): Promise<MatchResult> {
  const prompt = `
Calculate the match score between this startup and investor. Return ONLY JSON, no markdown.

STARTUP:
- Name: ${startup.name}
- Sector: ${startup.sector}
- Stage: ${startup.stage}
- Funding Goal: ₹${startup.funding_goal?.toLocaleString()}
- Traction Score: ${startup.traction_score}/100
- Description: ${startup.description}

INVESTOR:
- Firm: ${investor.firm_name || 'Individual Investor'}
- Thesis: ${investor.investment_thesis || 'General'}
- Interested Sectors: ${investor.sectors_of_interest?.join(', ') || 'All'}
- Preferred Stages: ${investor.stages_of_interest?.join(', ') || 'All'}
- Investment Range: ₹${investor.min_investment?.toLocaleString()} - ₹${investor.max_investment?.toLocaleString()}

Return JSON:
{
  "score": <integer 0-100>,
  "reasons": ["reason1", "reason2", "reason3"],
  "recommendation": "one sentence recommendation"
}
`

  try {
    const response = await callClaude(prompt)
    const clean = response.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as MatchResult
  } catch {
    // Fallback: rule-based matching
    let score = 50
    const reasons: string[] = []

    if (investor.sectors_of_interest?.includes(startup.sector)) {
      score += 20
      reasons.push(`Investor focuses on ${startup.sector} sector`)
    }
    if (investor.stages_of_interest?.includes(startup.stage)) {
      score += 15
      reasons.push(`Investor targets ${startup.stage} stage startups`)
    }
    if (investor.min_investment && investor.max_investment) {
      if (startup.funding_goal >= investor.min_investment && startup.funding_goal <= investor.max_investment) {
        score += 15
        reasons.push('Funding requirements align with investor capacity')
      }
    }

    return {
      score: Math.min(score, 100),
      reasons: reasons.length ? reasons : ['General interest match'],
      recommendation: 'Consider this opportunity based on portfolio fit.',
    }
  }
}

// ============================================
// STARTUP VALUATION
// ============================================

export interface ValuationResult {
  estimated_valuation: number
  methodology: string
  range_low: number
  range_high: number
  factors: string[]
}

export async function estimateValuation(
  sector: string,
  stage: string,
  revenue: number,
  growth_rate: number,
  team_size: number,
  market_size: number
): Promise<ValuationResult> {
  const prompt = `
Estimate startup valuation. Return ONLY JSON, no markdown.

Sector: ${sector}
Stage: ${stage}
Annual Revenue: ₹${revenue?.toLocaleString()}
Growth Rate: ${growth_rate}% per month
Team Size: ${team_size}
Target Market Size: ₹${market_size?.toLocaleString()}

Return JSON:
{
  "estimated_valuation": <number>,
  "methodology": "one sentence explanation",
  "range_low": <number>,
  "range_high": <number>,
  "factors": ["factor1", "factor2", "factor3"]
}
`

  try {
    const response = await callClaude(prompt)
    const clean = response.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as ValuationResult
  } catch {
    const baseMultiple = stage === 'scale' ? 10 : stage === 'growth' ? 7 : stage === 'early-traction' ? 5 : 3
    const estimated = revenue * baseMultiple || 1000000

    return {
      estimated_valuation: estimated,
      methodology: 'Revenue multiple based valuation',
      range_low: estimated * 0.7,
      range_high: estimated * 1.5,
      factors: ['Revenue multiple', 'Stage premium', 'Sector benchmark'],
    }
  }
}

// ============================================
// AI CHAT ASSISTANT
// ============================================

export async function chatWithAI(
  userMessage: string,
  context: 'startup' | 'investor',
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const systemPrompt = context === 'startup'
    ? 'You are an expert startup advisor helping founders build and scale their companies. Provide practical, actionable advice on fundraising, product development, and growth strategies. Be concise and specific.'
    : 'You are an expert investment advisor helping investors discover and evaluate startups. Provide insights on due diligence, portfolio management, market trends, and investment strategies. Be concise and data-driven.'

  if (!ANTHROPIC_API_KEY) {
    return "I'm your AI advisor! Configure your Anthropic API key in .env to unlock full AI capabilities. For now, I'm here to help you navigate the platform."
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ],
    }),
  })

  if (!response.ok) throw new Error('AI chat error')
  const data = await response.json()
  return data.content[0]?.text || 'Unable to get response'
}
