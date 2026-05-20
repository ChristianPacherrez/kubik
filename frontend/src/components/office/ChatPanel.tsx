'use client'

// ChatPanel — pestaña "Chat" del panel derecho
//
// Fuente de datos para DMs: Supabase (persistente, sobrevive al reload).
//   · useDMChat   — mensajes de la conversación abierta
//   · useChatsIndex — índice de todas las conversaciones DM del usuario
//
// Grupos/canales: MOCK_CHANNELS (placeholder hasta Fase siguiente).
//
// Tabs internos (lista):
//   💬 Mensajes — DMs persistentes
//   👥 Grupos   — canales del workspace (mock)
//
// Vistas de contenido:
//   HILO DM  — openChatId != null (interaction.store + useDMChat)
//   CANAL    — activeChannelId != null (local + officeStore)

import { useCallback, useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  ArrowLeft, MessageSquare, Hash,
  Users as UsersIcon,
  Send, Smile, Plus,
  Loader2,
} from 'lucide-react'
import { useInteractionStore } from '@/store/interaction.store'
import { useOfficeStore } from '@/store/office.store'
import { useDMChat, PersistedMessage }      from '@/hooks/useDMChat'
import { useChatsIndex, DMPreview }         from '@/hooks/useChatsIndex'
import { useTeamDirectory, TeamMember }     from '@/hooks/useTeamDirectory'
import { UserAvatar }   from '@/components/ui/UserAvatar'
import { ScrollArea }   from '@/components/ui/scroll-area'
import { Panel, PanelHeader, EmptySlate } from '@/components/ui/kubik'
import { ClientTime }   from '@/components/ui/ClientTime'
import { MOCK_CHANNELS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

// ─── ChatPanel (root) ─────────────────────────────────────────────────────────
//
// useTeamDirectory se llama aquí (en el root) para que exista UNA SOLA instancia
// activa durante toda la sesión del panel de chat. Evita re-fetches innecesarios
// al alternar entre DmView y ListView.

export function ChatPanel() {
  const openChatId   = useInteractionStore((s) => s.openChatId)
  const openChatName = useInteractionStore((s) => s.openChatName)
  const closeChat    = useInteractionStore((s) => s.closeChat)

  const messages   = useOfficeStore((s) => s.messages)
  const addMessage = useOfficeStore((s) => s.addMessage)

  // Directorio del equipo — cargado una vez, compartido con DmView y ListView
  const { members } = useTeamDirectory()

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)

  // ── DM view ───────────────────────────────────────────────────────────────
  if (openChatId) {
    const peerMember = members.find((m) => m.id === openChatId)
    return (
      <DmView
        peerId={openChatId}
        peerName={openChatName ?? peerMember?.name ?? openChatId}
        peerAvatarUrl={peerMember?.avatarUrl ?? null}
        onBack={closeChat}
      />
    )
  }

  // ── Channel view ──────────────────────────────────────────────────────────
  if (activeChannelId) {
    const ch         = MOCK_CHANNELS.find((c) => c.id === activeChannelId)
    const chMessages = messages.filter((m) => m.roomId === activeChannelId)
    return (
      <ChannelView
        channelId={activeChannelId}
        channelName={ch?.name ?? activeChannelId}
        messages={chMessages}
        addMessage={addMessage}
        onBack={() => setActiveChannelId(null)}
      />
    )
  }

  // ── List view (default) ───────────────────────────────────────────────────
  return (
    <ListView
      members={members}
      onOpenDm={(id, name) => useInteractionStore.getState().openChat(id, name)}
      onOpenChannel={setActiveChannelId}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA LISTA (tabs internos: Mensajes | Grupos)
// ─────────────────────────────────────────────────────────────────────────────

type ListTab = 'dm' | 'groups'

function ListView({
  members,
  onOpenDm,
  onOpenChannel,
}: {
  members:       TeamMember[]
  onOpenDm:      (id: string, name: string) => void
  onOpenChannel: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState<ListTab>('dm')

  // Supabase: índice de DMs persistentes
  const { dms, isLoading } = useChatsIndex()

  // Current user (para saber si el último mensaje es mío)
  const { user } = useUser()
  const myId = user?.id ?? ''

  const totalDmUnread  = dms.reduce((acc, d) => acc + d.unreadCount, 0)
  const totalChUnread  = MOCK_CHANNELS.reduce((acc, c) => acc + c.unread, 0)

  // Resolver nombre y avatar de un peer a partir del directorio
  const resolvePeer = (peerId: string) => {
    const m = members.find((mem) => mem.id === peerId)
    return {
      name:      m?.name      ?? peerId,
      avatarUrl: m?.avatarUrl ?? null,
    }
  }

  return (
    <Panel side="left" className="w-[268px] flex-shrink-0">

      {/* ── Header ───────────────────────────────────────────── */}
      <PanelHeader
        title="Chat"
        icon={<MessageSquare className="w-3.5 h-3.5" strokeWidth={1.8} />}
      />

      {/* ── Tabs internos ─────────────────────────────────────── */}
      <div className="flex items-center gap-px px-2.5 pb-0 border-b border-[var(--color-border-secondary)] flex-shrink-0">
        <InternalTab
          label="Mensajes"
          icon={<MessageSquare className="w-3 h-3" strokeWidth={2} />}
          isActive={activeTab === 'dm'}
          unread={totalDmUnread}
          onClick={() => setActiveTab('dm')}
        />
        <InternalTab
          label="Grupos"
          icon={<UsersIcon className="w-3 h-3" strokeWidth={2} />}
          isActive={activeTab === 'groups'}
          unread={totalChUnread}
          onClick={() => setActiveTab('groups')}
        />
      </div>

      {/* ── Contenido por tab ─────────────────────────────────── */}
      <ScrollArea className="flex-1">
        <div className="py-2">

          {/* ── TAB: Mensajes directos ──────────────────────── */}
          {activeTab === 'dm' && (
            <>
              {isLoading ? (
                // Skeleton de carga
                <div className="px-4 py-3 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 w-24 bg-[var(--color-bg-secondary)] rounded" />
                        <div className="h-2 w-36 bg-[var(--color-bg-secondary)] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : dms.length === 0 ? (
                <div className="px-4 py-4">
                  <p className="text-[11px] text-[var(--color-text-quaternary)] leading-relaxed">
                    Aún no hay conversaciones directas.
                  </p>
                  <p className="text-[11px] text-[var(--color-text-quaternary)] leading-relaxed mt-1">
                    Ve a{' '}
                    <span className="font-semibold text-[var(--color-text-tertiary)]">Equipo</span>{' '}
                    y haz clic en{' '}
                    <span className="font-semibold text-[var(--color-text-tertiary)]">Mensaje</span>{' '}
                    en cualquier compañero.
                  </p>
                </div>
              ) : (
                <div className="space-y-px px-1.5">
                  {dms.map((dm) => {
                    const peer = resolvePeer(dm.peerId)
                    return (
                      <DmRow
                        key={dm.chatId}
                        dm={dm}
                        myId={myId}
                        peerName={peer.name}
                        peerAvatarUrl={peer.avatarUrl}
                        onClick={() => onOpenDm(dm.peerId, peer.name)}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── TAB: Grupos / Canales ────────────────────────── */}
          {activeTab === 'groups' && (
            <>
              <div className="space-y-px px-1.5">
                {MOCK_CHANNELS.map((ch) => (
                  <ChannelRow
                    key={ch.id}
                    id={ch.id}
                    name={ch.name}
                    unread={ch.unread}
                    onClick={() => onOpenChannel(ch.id)}
                  />
                ))}
              </div>

              {/* Crear grupo — placeholder */}
              <div className="px-2.5 mt-3">
                <button
                  disabled
                  title="Próximamente"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--color-text-quaternary)] border border-dashed border-[var(--color-border-primary)] hover:border-[var(--color-border-brand)] hover:text-[var(--color-text-brand-primary)] hover:bg-[var(--color-bg-brand-primary)] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  Crear grupo
                </button>
              </div>
            </>
          )}

        </div>
      </ScrollArea>
    </Panel>
  )
}

// ─── InternalTab ──────────────────────────────────────────────────────────────

function InternalTab({
  label,
  icon,
  isActive,
  unread,
  onClick,
}: {
  label:    string
  icon:     React.ReactNode
  isActive: boolean
  unread:   number
  onClick:  () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium whitespace-nowrap flex-shrink-0 border-b-2 transition-all duration-100',
        isActive
          ? 'text-[var(--color-text-brand-primary)] border-[var(--color-bg-brand-solid)]'
          : 'text-[var(--color-text-quaternary)] border-transparent hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-primary)]',
      )}
    >
      {icon}
      {label}
      {unread > 0 && !isActive && (
        <span className="min-w-[14px] h-3.5 px-0.5 flex items-center justify-center text-[8px] font-bold bg-[var(--color-bg-brand-solid)] text-white rounded-full leading-none">
          {unread}
        </span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA HILO DM — mensajes persistentes via Supabase
// ─────────────────────────────────────────────────────────────────────────────

function DmView({
  peerId,
  peerName,
  peerAvatarUrl,
  onBack,
}: {
  peerId:        string
  peerName:      string
  peerAvatarUrl: string | null
  onBack:        () => void
}) {
  const { user: clerkUser } = useUser()
  const myId = clerkUser?.id ?? null

  const { messages, isLoading, chatId, sendMessage, error } = useDMChat(myId, peerId)

  const [input, setInput] = useState('')
  const endRef  = useRef<HTMLDivElement>(null)

  // Auto-scroll al llegar mensajes nuevos
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function send() {
    const text = input.trim()
    if (!text) return
    setInput('')
    await sendMessage(text)
  }

  const shortName = peerName.split(' ')[0]

  return (
    <Panel side="left" className="w-[268px] flex-shrink-0">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-[var(--color-border-secondary)] flex-shrink-0">
        <button
          onClick={onBack}
          className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--color-text-quaternary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary_hover)] transition-colors flex-shrink-0"
          title="Volver"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        </button>

        <UserAvatar name={peerName} avatarUrl={peerAvatarUrl} size="xs" />

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate leading-tight">
            {shortName}
          </p>
          <p className="text-[10px] text-[var(--color-text-quaternary)] leading-none mt-0.5">
            Mensaje directo
          </p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-16 gap-2 text-[var(--color-text-quaternary)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[11px]">Cargando historial…</span>
          </div>
        ) : error ? (
          <div className="px-4 py-4">
            <p className="text-[11px] leading-relaxed" style={{ color: '#ef4444' }}>
              {error}
            </p>
          </div>
        ) : messages.length === 0 ? (
          <EmptySlate
            icon={<MessageSquare className="w-4 h-4" strokeWidth={1.5} />}
            title={`Escribe a ${shortName}`}
            description="Los mensajes son directos y privados."
          />
        ) : (
          <div className="space-y-1 px-3">
            {messages.map((msg, i) => {
              const isMe         = msg.senderId === myId
              const prevMsg      = messages[i - 1]
              const isGroupStart = !prevMsg || prevMsg.senderId !== msg.senderId

              return (
                <div key={msg.id} className={cn(i > 0 && isGroupStart && 'mt-3')}>
                  {isGroupStart && (
                    <div className={cn('flex items-center gap-1.5 mb-0.5', isMe && 'flex-row-reverse')}>
                      {!isMe && <UserAvatar name={peerName} avatarUrl={peerAvatarUrl} size="xs" />}
                      <span className={cn(
                        'text-[11px] font-semibold leading-none',
                        isMe ? 'text-[var(--color-text-brand-primary)]' : 'text-[var(--color-text-primary)]',
                      )}>
                        {isMe ? 'Tú' : shortName}
                      </span>
                      <span className="text-[9px] text-[var(--color-fg-quaternary)]">
                        {new Date(msg.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  <div className={cn(
                    'flex',
                    isMe ? 'justify-end' : 'justify-start',
                    !isGroupStart && (isMe ? 'pr-[28px]' : 'pl-[28px]'),
                  )}>
                    <span className={cn(
                      'inline-block max-w-[200px] text-[12px] leading-[1.5] px-2.5 py-1.5 rounded-xl break-words',
                      isMe
                        ? 'bg-[var(--color-bg-brand-solid)] text-white rounded-br-sm'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-secondary)] rounded-bl-sm',
                    )}>
                      {msg.text}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ── Compositor directo — sin componente intermediario ───────────────── */}
      <div className="px-3 py-3 flex-shrink-0 border-t border-[var(--color-border-secondary)]">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] focus-within:border-[var(--color-border-brand)] transition-all duration-150 shadow-xs">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder={isLoading ? 'Conectando…' : `Escribe a ${shortName}…`}
            disabled={isLoading}
            maxLength={500}
            className="flex-1 bg-transparent text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-fg-quaternary)] outline-none min-w-0 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={isLoading || !input.trim()}
            title="Enviar"
            className="w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0 bg-[var(--color-bg-brand-solid)] text-white hover:bg-[var(--color-bg-brand-solid_hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
          >
            <Send className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>
      </div>

    </Panel>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA CANAL
// ─────────────────────────────────────────────────────────────────────────────

function ChannelView({
  channelId,
  channelName,
  messages,
  addMessage,
  onBack,
}: {
  channelId:   string
  channelName: string
  messages:    ReturnType<typeof useOfficeStore.getState>['messages']
  addMessage:  (m: Parameters<ReturnType<typeof useOfficeStore.getState>['addMessage']>[0]) => void
  onBack:      () => void
}) {
  const { user: clerkUser } = useUser()
  const [input, setInput] = useState('')
  const endRef   = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = useCallback(() => {
    const content = input.trim()
    if (!content || !clerkUser) return
    addMessage({
      userId:    clerkUser.id,
      name:      clerkUser.fullName ?? clerkUser.username ?? 'Tú',
      content,
      roomId:    channelId,
      timestamp: new Date().toISOString(),
    })
    setInput('')
    inputRef.current?.focus()
  }, [input, clerkUser, addMessage, channelId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); send() }
  }

  return (
    <Panel side="left" className="w-[268px] flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-[var(--color-border-secondary)] flex-shrink-0">
        <button
          onClick={onBack}
          className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--color-text-quaternary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary_hover)] transition-colors flex-shrink-0"
          title="Volver"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        </button>

        <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] flex items-center justify-center flex-shrink-0">
          <Hash className="w-3.5 h-3.5 text-[var(--color-text-quaternary)]" strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate leading-tight">
            {channelName}
          </p>
          <p className="text-[10px] text-[var(--color-text-quaternary)] leading-none mt-0.5">
            Canal del workspace
          </p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto py-2">
        {messages.length === 0 ? (
          <EmptySlate
            icon={<Hash className="w-4 h-4" strokeWidth={1.5} />}
            title={`#${channelName}`}
            description="Sin mensajes aún. Sé el primero."
          />
        ) : (
          <div className="space-y-0.5">
            {messages.map((msg, i) => {
              const isOwn      = msg.userId === clerkUser?.id
              const prevMsg    = messages[i - 1]
              const groupStart = !prevMsg || prevMsg.userId !== msg.userId ||
                new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 5 * 60_000

              return (
                <div
                  key={i}
                  className={cn(
                    'group px-3 py-0.5 hover:bg-[var(--color-bg-primary_hover)] rounded-lg transition-colors duration-75',
                    groupStart && i !== 0 && 'mt-3',
                  )}
                >
                  {groupStart && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <UserAvatar
                        name={msg.name}
                        avatarUrl={isOwn ? (clerkUser?.imageUrl ?? null) : null}
                        size="xs"
                      />
                      <span className={cn(
                        'text-[12px] font-semibold leading-tight',
                        isOwn ? 'text-[var(--color-text-brand-primary)]' : 'text-[var(--color-text-primary)]',
                      )}>
                        {isOwn ? 'Tú' : msg.name.split(' ')[0]}
                      </span>
                      <ClientTime
                        timestamp={msg.timestamp}
                        className="text-[10px] text-[var(--color-fg-quaternary)]"
                      />
                    </div>
                  )}
                  <p className="text-[12px] text-[var(--color-text-secondary)] leading-[1.55] break-words pl-[calc(24px+8px)]">
                    {msg.content}
                  </p>
                </div>
              )
            })}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Compositor */}
      <Composer
        value={input}
        onChange={setInput}
        onSend={send}
        onKeyDown={handleKeyDown}
        placeholder={`#${channelName}…`}
        inputRef={inputRef}
      />
    </Panel>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVAS COMPARTIDAS
// ─────────────────────────────────────────────────────────────────────────────

// ─── DmRow ────────────────────────────────────────────────────────────────────

function DmRow({
  dm,
  myId,
  peerName,
  peerAvatarUrl,
  onClick,
}: {
  dm:            DMPreview
  myId:          string
  peerName:      string
  peerAvatarUrl: string | null
  onClick:       () => void
}) {
  const hasUnread = dm.unreadCount > 0
  const lastMsgIsMe = dm.lastSenderId === myId

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[var(--color-bg-primary_hover)] transition-colors duration-fast text-left"
    >
      <div className="relative flex-shrink-0">
        <UserAvatar name={peerName} avatarUrl={peerAvatarUrl} size="sm" />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full bg-[var(--color-bg-brand-solid)] ring-2 ring-[var(--color-bg-secondary)]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <p className={cn(
            'text-[13px] truncate leading-tight',
            hasUnread
              ? 'font-bold text-[var(--color-text-primary)]'
              : 'font-semibold text-[var(--color-text-primary)]',
          )}>
            {peerName.split(' ')[0]}
          </p>
          {dm.lastTs && (
            <span className="text-[9px] text-[var(--color-fg-quaternary)] flex-shrink-0 tabular-nums">
              {formatTime(dm.lastTs)}
            </span>
          )}
        </div>

        {dm.lastMessage ? (
          <p className={cn(
            'text-[11px] truncate mt-0.5',
            hasUnread
              ? 'text-[var(--color-text-secondary)] font-medium'
              : 'text-[var(--color-text-quaternary)]',
          )}>
            {lastMsgIsMe && <span className="text-[var(--color-text-tertiary)]">Tú: </span>}
            {dm.lastMessage}
          </p>
        ) : (
          <p className="text-[11px] text-[var(--color-fg-quaternary)] mt-0.5 italic">
            Nueva conversación
          </p>
        )}
      </div>

      {hasUnread && (
        <span className="min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[9px] font-bold bg-[var(--color-bg-brand-solid)] text-white rounded-full leading-none flex-shrink-0">
          {dm.unreadCount}
        </span>
      )}
    </button>
  )
}

// ─── ChannelRow ───────────────────────────────────────────────────────────────

function ChannelRow({
  id,
  name,
  unread,
  onClick,
}: {
  id:      string
  name:    string
  unread:  number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-bg-primary_hover)] transition-colors duration-fast text-left"
    >
      <Hash
        className={cn(
          'w-3.5 h-3.5 flex-shrink-0',
          unread > 0 ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-fg-quaternary)]',
        )}
        strokeWidth={2}
      />
      <span className={cn(
        'flex-1 text-[13px] truncate',
        unread > 0
          ? 'font-semibold text-[var(--color-text-primary)]'
          : 'font-normal text-[var(--color-text-tertiary)]',
      )}>
        {name}
      </span>
      {unread > 0 && (
        <span className="min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[9px] font-bold bg-[var(--color-bg-brand-solid)] text-white rounded-full leading-none flex-shrink-0">
          {unread}
        </span>
      )}
    </button>
  )
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({
  value,
  onChange,
  onSend,
  onKeyDown,
  placeholder,
  inputRef,
  disabled = false,
}: {
  value:       string
  onChange:    (v: string) => void
  onSend:      () => void
  onKeyDown:   (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder: string
  inputRef:    React.RefObject<HTMLInputElement>
  disabled?:   boolean
}) {
  return (
    <div className="px-3 py-3 flex-shrink-0 border-t border-[var(--color-border-secondary)]">
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] focus-within:border-[var(--color-border-brand)] focus-within:shadow-[0_0_0_3px_var(--color-bg-brand-primary)] transition-all duration-150 shadow-xs">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          maxLength={500}
          disabled={disabled}
          className="flex-1 bg-transparent text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-fg-quaternary)] outline-none min-w-0 disabled:opacity-50"
        />
        <button
          type="button"
          title="Emoji"
          className="w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0 text-[var(--color-fg-quaternary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary_hover)] transition-colors duration-100"
        >
          <Smile className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || disabled}
          title="Enviar"
          className="w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0 bg-[var(--color-bg-brand-solid)] text-white hover:bg-[var(--color-bg-brand-solid_hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
        >
          <Send className="w-3 h-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
