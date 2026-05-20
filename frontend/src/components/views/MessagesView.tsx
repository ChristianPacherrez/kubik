'use client'

// MessagesView — sección "Messages" del NAV
//
// Layout dos columnas:
//   Izquierda (280px): lista de conversaciones (DMs + Grupos)
//   Derecha   (flex): hilo DM activo o estado vacío
//
// Fuente de datos:
//   · useChatsIndex  — índice de DMs persistentes (Supabase)
//   · useDMChat      — mensajes de la conversación abierta (Supabase)
//   · useTeamDirectory — resolución de nombre/avatar del peer
//
// Estado de conversación abierta: interaction.store.openChatId (compartido con Office)
//   → Abrir DM desde TeamView o desde el mapa navega aquí con el chat ya seleccionado.

import { useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  MessageSquare,
  Users as UsersIcon,
  Hash,
  Send,
  Loader2,
  Plus,
} from 'lucide-react'
import { useInteractionStore } from '@/store/interaction.store'
import { useDMChat }            from '@/hooks/useDMChat'
import { useChatsIndex, DMPreview } from '@/hooks/useChatsIndex'
import { useTeamDirectory, TeamMember } from '@/hooks/useTeamDirectory'
import { UserAvatar }  from '@/components/ui/UserAvatar'
import { ScrollArea }  from '@/components/ui/scroll-area'
import { EmptySlate }  from '@/components/ui/kubik'
import { MOCK_CHANNELS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

// ─── MessagesView (root) ──────────────────────────────────────────────────────
//
// useTeamDirectory se llama aquí (root) para tener UNA sola instancia durante
// toda la sesión de la vista — evita re-fetches al alternar entre tabs.

export function MessagesView() {
  const { members } = useTeamDirectory()

  const openChatId   = useInteractionStore((s) => s.openChatId)
  const openChatName = useInteractionStore((s) => s.openChatName)

  // Resolver nombre y avatar del peer desde el directorio
  const peerMember  = members.find((m) => m.id === openChatId)
  const peerName    = openChatName ?? peerMember?.name ?? openChatId ?? ''
  const peerAvatar  = peerMember?.avatarUrl ?? null

  return (
    <div className="flex-1 flex overflow-hidden bg-[var(--color-bg-primary)]">

      {/* ── Columna izquierda: lista de conversaciones ─────── */}
      <ConversationSidebar members={members} />

      {/* ── Columna derecha: hilo o estado vacío ───────────── */}
      {openChatId ? (
        <DmThread
          peerId={openChatId}
          peerName={peerName}
          peerAvatarUrl={peerAvatar}
        />
      ) : (
        <EmptyThread />
      )}
    </div>
  )
}

// ─── ConversationSidebar ──────────────────────────────────────────────────────

type ListTab = 'dm' | 'groups'

function ConversationSidebar({ members }: { members: TeamMember[] }) {
  const [activeTab, setActiveTab] = useState<ListTab>('dm')
  const { dms, isLoading } = useChatsIndex()
  const { user } = useUser()
  const myId = user?.id ?? ''

  const openChatId    = useInteractionStore((s) => s.openChatId)
  const totalDmUnread = dms.reduce((acc, d) => acc + d.unreadCount, 0)
  const totalChUnread = MOCK_CHANNELS.reduce((acc, c) => acc + c.unread, 0)

  const resolvePeer = (peerId: string) => {
    const m = members.find((mem) => mem.id === peerId)
    return { name: m?.name ?? peerId, avatarUrl: m?.avatarUrl ?? null }
  }

  const tabs: Array<{ id: ListTab; label: string; icon: React.ReactNode; unread: number }> = [
    { id: 'dm',     label: 'Directos', icon: <MessageSquare className="w-3 h-3" strokeWidth={2} />, unread: totalDmUnread  },
    { id: 'groups', label: 'Grupos',   icon: <UsersIcon      className="w-3 h-3" strokeWidth={2} />, unread: totalChUnread },
  ]

  return (
    <aside className="
      w-[280px] flex-shrink-0 flex flex-col
      bg-[var(--color-bg-secondary)]
      border-r border-[var(--color-border-secondary)]
    ">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0 border-b border-[var(--color-border-secondary)]">
        <h2 className="text-[13px] font-bold text-[var(--color-text-primary)]">Mensajes</h2>
      </div>

      {/* Tabs internos */}
      <div className="flex items-center gap-px px-3 pt-2 flex-shrink-0 border-b border-[var(--color-border-secondary)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium whitespace-nowrap flex-shrink-0 border-b-2 -mb-px transition-all duration-100',
              activeTab === tab.id
                ? 'text-[var(--color-text-brand-primary)] border-[var(--color-bg-brand-solid)]'
                : 'text-[var(--color-text-quaternary)] border-transparent hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-primary)]',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.unread > 0 && activeTab !== tab.id && (
              <span className="min-w-[14px] h-3.5 px-0.5 flex items-center justify-center text-[8px] font-bold bg-[var(--color-bg-brand-solid)] text-white rounded-full leading-none">
                {tab.unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      <ScrollArea className="flex-1">
        <div className="py-2">

          {/* ── Tab: Mensajes directos ─────────────────────── */}
          {activeTab === 'dm' && (
            <>
              {isLoading ? (
                <div className="px-4 py-3 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-[var(--color-bg-primary)] flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 w-24 bg-[var(--color-bg-primary)] rounded" />
                        <div className="h-2 w-36 bg-[var(--color-bg-primary)] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : dms.length === 0 ? (
                <div className="px-4 py-4">
                  <p className="text-[11px] text-[var(--color-text-quaternary)] leading-relaxed">
                    Aún no hay conversaciones directas.
                  </p>
                  <p className="text-[11px] text-[var(--color-text-quaternary)] mt-1 leading-relaxed">
                    Ve a{' '}
                    <span className="font-semibold text-[var(--color-text-tertiary)]">Equipo</span>
                    {' '}y haz clic en{' '}
                    <span className="font-semibold text-[var(--color-text-tertiary)]">Mensaje</span>
                    {' '}en cualquier compañero.
                  </p>
                </div>
              ) : (
                <div className="space-y-px px-2">
                  {dms.map((dm) => {
                    const peer = resolvePeer(dm.peerId)
                    return (
                      <DmListItem
                        key={dm.chatId}
                        dm={dm}
                        myId={myId}
                        peerName={peer.name}
                        peerAvatarUrl={peer.avatarUrl}
                        isActive={openChatId === dm.peerId}
                        onClick={() =>
                          useInteractionStore.getState().openChat(dm.peerId, peer.name)
                        }
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Tab: Grupos / Canales ─────────────────────── */}
          {activeTab === 'groups' && (
            <>
              <div className="space-y-px px-2">
                {MOCK_CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    disabled
                    title="Próximamente"
                    className="w-full flex items-center gap-2 px-2.5 py-2.5 rounded-xl text-left opacity-60 cursor-not-allowed"
                  >
                    <Hash
                      className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-fg-quaternary)]"
                      strokeWidth={2}
                    />
                    <span className="flex-1 text-[13px] text-[var(--color-text-tertiary)] truncate">
                      {ch.name}
                    </span>
                    {ch.unread > 0 && (
                      <span className="min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[9px] font-bold bg-[var(--color-bg-brand-solid)] text-white rounded-full leading-none flex-shrink-0">
                        {ch.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="px-3 mt-3">
                <button
                  disabled
                  title="Próximamente"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--color-text-quaternary)] border border-dashed border-[var(--color-border-primary)] opacity-40 cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  Crear grupo
                </button>
              </div>
            </>
          )}

        </div>
      </ScrollArea>
    </aside>
  )
}

// ─── DmListItem ───────────────────────────────────────────────────────────────

function DmListItem({
  dm,
  myId,
  peerName,
  peerAvatarUrl,
  isActive,
  onClick,
}: {
  dm:            DMPreview
  myId:          string
  peerName:      string
  peerAvatarUrl: string | null
  isActive:      boolean
  onClick:       () => void
}) {
  const hasUnread    = dm.unreadCount > 0
  const lastMsgIsMe  = dm.lastSenderId === myId

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-colors duration-fast text-left',
        isActive
          ? 'bg-[var(--color-bg-primary)] shadow-xs'
          : 'hover:bg-[var(--color-bg-primary_hover)]',
      )}
    >
      {/* Avatar con indicador de no leídos */}
      <div className="relative flex-shrink-0">
        <UserAvatar name={peerName} avatarUrl={peerAvatarUrl} size="sm" />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full bg-[var(--color-bg-brand-solid)] ring-2 ring-[var(--color-bg-secondary)]" />
        )}
      </div>

      {/* Nombre + preview del último mensaje */}
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
            {lastMsgIsMe && (
              <span className="text-[var(--color-text-tertiary)]">Tú: </span>
            )}
            {dm.lastMessage}
          </p>
        ) : (
          <p className="text-[11px] text-[var(--color-fg-quaternary)] mt-0.5 italic">
            Nueva conversación
          </p>
        )}
      </div>

      {/* Badge de no leídos */}
      {hasUnread && (
        <span className="min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[9px] font-bold bg-[var(--color-bg-brand-solid)] text-white rounded-full leading-none flex-shrink-0">
          {dm.unreadCount}
        </span>
      )}
    </button>
  )
}

// ─── DmThread ─────────────────────────────────────────────────────────────────
// Columna derecha: hilo de mensajes del DM abierto

function DmThread({
  peerId,
  peerName,
  peerAvatarUrl,
}: {
  peerId:        string
  peerName:      string
  peerAvatarUrl: string | null
}) {
  const { user: clerkUser } = useUser()
  const myId = clerkUser?.id ?? null

  const { messages, isLoading, sendMessage, error } = useDMChat(myId, peerId)

  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al recibir mensajes nuevos
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
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-primary)]">

      {/* Header del hilo */}
      <div className="
        px-6 py-4 flex items-center gap-3 flex-shrink-0
        border-b border-[var(--color-border-secondary)]
      ">
        <UserAvatar name={peerName} avatarUrl={peerAvatarUrl} size="sm" />
        <div>
          <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{peerName}</p>
          <p className="text-[11px] text-[var(--color-text-quaternary)]">Mensaje directo</p>
        </div>
      </div>

      {/* Lista de mensajes */}
      <div className="flex-1 overflow-y-auto py-4 px-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-24 gap-2 text-[var(--color-text-quaternary)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[12px]">Cargando historial…</span>
          </div>
        ) : error ? (
          <p className="text-[12px] text-red-500 px-2">{error}</p>
        ) : messages.length === 0 ? (
          <EmptySlate
            icon={<MessageSquare className="w-5 h-5" strokeWidth={1.5} />}
            title={`Escribe a ${shortName}`}
            description="Los mensajes son directos y privados."
          />
        ) : (
          <div className="space-y-1 max-w-3xl">
            {messages.map((msg, i) => {
              const isMe         = msg.senderId === myId
              const prevMsg      = messages[i - 1]
              const isGroupStart = !prevMsg || prevMsg.senderId !== msg.senderId

              return (
                <div key={msg.id} className={cn(i > 0 && isGroupStart && 'mt-4')}>
                  {isGroupStart && (
                    <div className={cn('flex items-center gap-2 mb-1', isMe && 'flex-row-reverse')}>
                      {isMe ? (
                        <UserAvatar
                          name={clerkUser?.fullName ?? 'Tú'}
                          avatarUrl={clerkUser?.imageUrl ?? null}
                          size="xs"
                        />
                      ) : (
                        <UserAvatar name={peerName} avatarUrl={peerAvatarUrl} size="xs" />
                      )}
                      <span className={cn(
                        'text-[12px] font-semibold leading-none',
                        isMe
                          ? 'text-[var(--color-text-brand-primary)]'
                          : 'text-[var(--color-text-primary)]',
                      )}>
                        {isMe ? 'Tú' : shortName}
                      </span>
                      <span className="text-[10px] text-[var(--color-fg-quaternary)]">
                        {new Date(msg.createdAt).toLocaleTimeString('es', {
                          hour:   '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  <div className={cn(
                    'flex',
                    isMe ? 'justify-end' : 'justify-start',
                    !isGroupStart && (isMe ? 'pr-[32px]' : 'pl-[32px]'),
                  )}>
                    <span className={cn(
                      'inline-block max-w-sm text-[13px] leading-[1.55] px-3 py-2 rounded-2xl break-words',
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

      {/* ── Compositor ─────────────────────────────────────── */}
      <div className="px-6 py-4 flex-shrink-0 border-t border-[var(--color-border-secondary)]">
        <div className="
          flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]
          focus-within:border-[var(--color-border-brand)]
          focus-within:shadow-[0_0_0_3px_var(--color-bg-brand-primary)]
          transition-all duration-150
        ">
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
            className="
              flex-1 bg-transparent text-[13px] text-[var(--color-text-primary)]
              placeholder:text-[var(--color-fg-quaternary)]
              outline-none min-w-0 disabled:opacity-50
            "
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={isLoading || !input.trim()}
            title="Enviar"
            className="
              w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0
              bg-[var(--color-bg-brand-solid)] text-white
              hover:bg-[var(--color-bg-brand-solid_hover)]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            <Send className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
        <p className="text-[10px] text-[var(--color-fg-quaternary)] mt-1.5 px-1">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}

// ─── EmptyThread ──────────────────────────────────────────────────────────────
// Estado vacío cuando no hay DM seleccionado

function EmptyThread() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-bg-primary)] gap-4">
      <div className="
        w-14 h-14 rounded-2xl
        bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]
        flex items-center justify-center
      ">
        <MessageSquare
          className="w-6 h-6 text-[var(--color-text-quaternary)]"
          strokeWidth={1.4}
        />
      </div>
      <div className="text-center">
        <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] mb-1">
          Tus mensajes
        </h3>
        <p className="text-[12px] text-[var(--color-text-quaternary)] max-w-xs leading-relaxed">
          Selecciona una conversación o ve a{' '}
          <span className="font-semibold text-[var(--color-text-tertiary)]">Equipo</span>
          {' '}para iniciar un nuevo mensaje directo.
        </p>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
