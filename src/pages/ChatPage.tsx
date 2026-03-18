import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Send, Paperclip, Search, MessageSquare, Loader2 } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { timeAgo, generateAvatarUrl } from '@/lib/utils'
import type { Conversation, Message, Profile } from '@/lib/database.types'

interface ConversationWithProfile extends Conversation {
  other_user: Profile
  unread_count?: number
}

interface MessageWithSender extends Message {
  sender: Profile
}

export default function ChatPage() {
  const { user } = useAuthStore()
  const { conversationId } = useParams()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<ConversationWithProfile[]>([])
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [activeConv, setActiveConv] = useState<ConversationWithProfile | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadConversations()
  }, [user])

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationId)
      if (conv) setActiveConv(conv)
    }
  }, [conversationId, conversations])

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id)
      subscribeToMessages(activeConv.id)
    }
  }, [activeConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    if (!user) return
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (data) {
      const withProfiles = await Promise.all(data.map(async (conv) => {
        const otherId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherId).single()
        return { ...conv, other_user: profile } as ConversationWithProfile
      }))
      setConversations(withProfiles.filter(c => c.other_user))
    }
    setLoading(false)
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages((data as any) || [])

    // Mark as read
    await supabase.from('messages').update({ is_read: true })
      .eq('conversation_id', convId)
      .neq('sender_id', user!.id)
  }

  function subscribeToMessages(convId: string) {
    const sub = supabase.channel(`messages:${convId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, async (payload) => {
        const { data: sender } = await supabase.from('profiles').select('*').eq('id', payload.new.sender_id).single()
        setMessages(prev => [...prev, { ...payload.new, sender } as MessageWithSender])
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv || sending) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    try {
      await supabase.from('messages').insert({
        conversation_id: activeConv.id,
        sender_id: user!.id,
        content,
      })
      await supabase.from('conversations').update({
        last_message: content,
        last_message_at: new Date().toISOString(),
      }).eq('id', activeConv.id)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const selectConv = (conv: ConversationWithProfile) => {
    setActiveConv(conv)
    navigate(`/chat/${conv.id}`)
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-112px)] flex rounded-2xl overflow-hidden border border-white/5">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 bg-dark-800 border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h2 className="font-semibold text-white text-sm mb-3">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
              <input placeholder="Search conversations..." className="input pl-9 py-2 text-sm" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageSquare className="w-8 h-8 text-white/15 mx-auto mb-2" />
                <p className="text-xs text-white/30">No conversations yet</p>
              </div>
            ) : conversations.map(conv => (
              <button key={conv.id} onClick={() => selectConv(conv)}
                className={`w-full px-4 py-3.5 text-left transition-colors flex items-center gap-3 hover:bg-white/3 ${activeConv?.id === conv.id ? 'bg-brand-500/8 border-r-2 border-brand-500' : ''}`}>
                <img src={conv.other_user?.avatar_url || generateAvatarUrl(conv.other_user?.full_name || 'U')}
                  alt="" className="w-9 h-9 rounded-full flex-shrink-0 object-cover bg-dark-600" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-white truncate">{conv.other_user?.full_name}</span>
                    {conv.last_message_at && <span className="text-xs text-white/25 flex-shrink-0 ml-2">{timeAgo(conv.last_message_at)}</span>}
                  </div>
                  {conv.last_message && <p className="text-xs text-white/35 truncate mt-0.5">{conv.last_message}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-dark-900">
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
              <img src={activeConv.other_user?.avatar_url || generateAvatarUrl(activeConv.other_user?.full_name || 'U')}
                alt="" className="w-8 h-8 rounded-full object-cover bg-dark-600" />
              <div>
                <p className="text-sm font-semibold text-white">{activeConv.other_user?.full_name}</p>
                <p className="text-xs text-white/35 capitalize">{activeConv.other_user?.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      isMe ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-dark-700 text-white/80 rounded-bl-sm'
                    }`}>
                      {msg.content}
                      <div className={`text-xs mt-1 ${isMe ? 'text-white/50' : 'text-white/25'}`}>
                        {timeAgo(msg.created_at)}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button className="p-2 text-white/25 hover:text-white/50 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  ref={inputRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="input flex-1 py-2.5 text-sm"
                />
                <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                  className="p-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-40 rounded-xl transition-colors">
                  {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-dark-900">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-sm">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
