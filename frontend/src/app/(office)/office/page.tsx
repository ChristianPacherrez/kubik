'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Boxes, Search, Bell, ChevronRight } from 'lucide-react'
import { useInteractionStore } from '@/store/interaction.store'
import { useRealtimeStore }    from '@/store/realtime.store'

// Layout
import { Sidebar, NavSection } from '@/components/layout/Sidebar'
import { ThemeSwitcher }       from '@/components/layout/ThemeSwitcher'

// Componentes de la vista Office
import { OfficeCanvas }   from '@/components/map/OfficeCanvas'
import { OnlineUsers }    from '@/components/office/OnlineUsers'
import { ChatPanel }      from '@/components/office/ChatPanel'
import { StatusSelector } from '@/components/office/StatusSelector'

// Vistas de sección
import { TeamView }     from '@/components/views/TeamView'
import { MessagesView } from '@/components/views/MessagesView'
import { SettingsView } from '@/components/views/SettingsView'

import { cn } from '@/lib/utils'

// Títulos por sección para el TopBar
const SECTION_META: Record<NavSection, { title: string; subtitle: string }> = {
  office:   { title: 'Office',   subtitle: 'Tu espacio de trabajo virtual' },
  team:     { title: 'Team',     subtitle: 'Presencia y disponibilidad del equipo' },
  messages: { title: 'Messages', subtitle: 'Canales de comunicación' },
  settings: { title: 'Settings', subtitle: 'Configuración de tu workspace' },
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function OfficePage() {
  const { isLoaded }   = useAuth()
  const [activeSection, setActiveSection] = useState<NavSection>('office')
  const [rightTab, setRightTab] = useState<'team' | 'chat'>('team')

  // Contador online real: peers de Supabase Presence + yo mismo
  const peerCount   = useRealtimeStore((s) => Object.keys(s.peers).length)
  const onlineCount = peerCount + 1   // +1 = el usuario actual (siempre online)

  // Cuando cualquier código (mapa, equipo, mensajes) abre un DM,
  // el panel derecho cambia automáticamente a la pestaña Chat.
  // Esto unifica: burbuja del mapa, OnlineUsers y MessagesView usan la misma UI.
  const openChatId = useInteractionStore((s) => s.openChatId)
  useEffect(() => {
    if (openChatId) setRightTab('chat')
  }, [openChatId])

  // Cuando el usuario hace clic en "Mensaje" en la pestaña Equipo:
  const handleMessageUser = useCallback((userId: string, userName: string) => {
    useInteractionStore.getState().openChat(userId, userName)
    // setRightTab('chat') se dispara automáticamente por el efecto de openChatId
  }, [])

  // Loading state mientras Clerk inicializa
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-secondary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-kubik-600 flex items-center justify-center shadow-lg shadow-kubik-600/25 animate-pulse">
            <Boxes className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <p className="text-sm text-[var(--color-text-tertiary)]">Cargando Kubik...</p>
        </div>
      </div>
    )
  }

  const handleSectionChange = (section: NavSection) => {
    setActiveSection(section)
    if (section === 'team')     setRightTab('team')
    if (section === 'messages') setRightTab('chat')
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--color-bg-primary)] theme-transition">

      {/* ── 1. Sidebar ─────────────────────────────────────────── */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* ── 2. Área principal ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TopBar contextual */}
        <TopBar
          activeSection={activeSection}
          rightTab={rightTab}
          onRightTabChange={setRightTab}
          showRightTabs={activeSection === 'office'}
          onlineCount={onlineCount}
        />

        {/* Contenido según sección */}
        <div className="flex-1 flex overflow-hidden animate-fade-in">
          {activeSection === 'office' ? (
            <>
              <OfficeCanvas />
              <RightPanel
                activeTab={rightTab}
                onTabChange={setRightTab}
                onMessageUser={handleMessageUser}
              />
            </>
          ) : activeSection === 'team' ? (
            <TeamView onNavigate={handleSectionChange} />
          ) : activeSection === 'messages' ? (
            <MessagesView />
          ) : (
            <SettingsView />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TopBar contextual ────────────────────────────────────────────────────────

function TopBar({
  activeSection,
  rightTab,
  onRightTabChange,
  showRightTabs,
  onlineCount,
}: {
  activeSection:    NavSection
  rightTab:         'team' | 'chat'
  onRightTabChange: (tab: 'team' | 'chat') => void
  showRightTabs:    boolean
  onlineCount:      number
}) {
  const { title } = SECTION_META[activeSection]

  return (
    <header className="
      h-[52px] flex-shrink-0 flex items-center justify-between px-4
      bg-[var(--color-bg-primary)]
      border-b border-[var(--color-border-secondary)]
      shadow-topbar theme-transition z-10
    ">

      {/* ── Left: breadcrumb ──── */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[13px] font-medium text-[var(--color-text-quaternary)] select-none">
          Kubik
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-[var(--color-fg-quaternary)] flex-shrink-0" strokeWidth={1.8} />
        <h2 className="text-[13px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          {title}
        </h2>
      </div>

      {/* ── Center: search ──── */}
      <button className="
        hidden md:flex items-center gap-2
        h-8 px-3 rounded-lg
        bg-[var(--color-bg-secondary)]
        border border-[var(--color-border-secondary)]
        text-[var(--color-text-quaternary)] text-[12px]
        hover:border-[var(--color-border-primary)]
        hover:text-[var(--color-text-tertiary)]
        transition-colors duration-100
        shadow-xs
      ">
        <Search className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="
          hidden lg:inline-flex items-center gap-0.5
          px-1.5 py-0.5 rounded-md text-[10px] font-medium
          bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]
          text-[var(--color-fg-quaternary)]
          font-mono leading-none
        ">⌘K</kbd>
      </button>

      {/* ── Right: controls ──── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Live presence pill — dato real de Supabase Presence */}
        <div className="
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
          bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]
          shadow-xs
        ">
          <span className="relative flex h-[6px] w-[6px] flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-50" />
            <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-success-500" />
          </span>
          <span className="text-[11px] font-medium tabular-nums text-[var(--color-text-secondary)]">
            {onlineCount} online
          </span>
        </div>

        {/* Tabs Team/Chat — segmented control */}
        {showRightTabs && (
          <div className="
            flex items-center
            bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]
            rounded-lg p-[3px] gap-px
            shadow-xs
          ">
            {(['team', 'chat'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onRightTabChange(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150',
                  rightTab === tab
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-xs'
                    : 'text-[var(--color-text-quaternary)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                {tab === 'team' ? 'Equipo' : 'Chat'}
              </button>
            ))}
          </div>
        )}

        {/* Notification bell */}
        <button className="
          relative w-8 h-8 flex items-center justify-center rounded-lg
          text-[var(--color-text-quaternary)]
          hover:bg-[var(--color-bg-primary_hover)]
          hover:text-[var(--color-text-secondary)]
          transition-colors duration-100
        ">
          <Bell className="w-4 h-4" strokeWidth={1.6} />
          {/* Unread dot */}
          <span className="
            absolute top-1.5 right-1.5
            w-[5px] h-[5px] rounded-full bg-[var(--color-bg-brand-solid)]
          " />
        </button>

        <ThemeSwitcher />
        <StatusSelector />
      </div>
    </header>
  )
}

// ─── Panel derecho (Team o Chat) ──────────────────────────────────────────────

function RightPanel({
  activeTab,
  onMessageUser,
}: {
  activeTab:     'team' | 'chat'
  onTabChange:   (tab: 'team' | 'chat') => void
  onMessageUser: (userId: string, userName: string) => void
}) {
  return (
    <div className="flex flex-col flex-shrink-0 h-full">
      {activeTab === 'team'
        ? <OnlineUsers onMessageUser={onMessageUser} />
        : <ChatPanel />
      }
    </div>
  )
}
