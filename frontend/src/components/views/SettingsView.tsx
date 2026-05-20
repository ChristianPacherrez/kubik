'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  User, Shield, Bell, Palette, CreditCard,
  Building2, Users as UsersIcon, Upload, Check,
  Globe, Zap, Lock, Eye, EyeOff,
} from 'lucide-react'
import { UserAvatar as Avatar } from '@/components/ui/UserAvatar'
import { useOfficeStore } from '@/store/office.store'
import { useTheme, type Theme } from '@/context/ThemeContext'
import { STATUS_LABELS, STATUS_COLORS } from '@/types'

// ─── Design primitives ────────────────────────────────────────────────────────

function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--color-text-secondary)]">
        {label}
        {required && <span className="text-error-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[var(--color-text-quaternary)] leading-relaxed">{hint}</p>}
    </div>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-[var(--color-border-primary)]',
        'bg-[var(--color-bg-primary)] px-3 text-sm text-[var(--color-text-primary)]',
        'placeholder:text-[var(--color-text-quaternary)] shadow-xs',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-border-brand)]/30',
        'focus:border-[var(--color-border-brand)] transition-all duration-150',
        'disabled:cursor-not-allowed disabled:bg-[var(--color-bg-secondary)]',
        'disabled:text-[var(--color-text-quaternary)] disabled:border-[var(--color-border-secondary)]',
        className
      )}
      {...props}
    />
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-brand)] focus-visible:ring-offset-2',
        checked ? 'bg-[var(--color-bg-brand-solid)]' : 'bg-[var(--color-border-primary)]'
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
        checked ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  )
}

// ─── Layout components ────────────────────────────────────────────────────────

function SettingsCard({
  title,
  description,
  footer,
  children,
  noPadding,
}: {
  title?: string
  description?: string
  footer?: React.ReactNode
  children: React.ReactNode
  noPadding?: boolean
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] shadow-xs overflow-hidden">
      {(title || description) && (
        <div className="px-6 py-4 border-b border-[var(--color-border-secondary)]">
          {title && <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>}
          {description && <p className="text-sm text-[var(--color-text-quaternary)] mt-0.5">{description}</p>}
        </div>
      )}
      <div className={noPadding ? '' : 'px-6 divide-y divide-[var(--color-border-secondary)]'}>
        {children}
      </div>
      {footer && (
        <div className="px-6 py-3 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-secondary)] flex items-center justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  )
}

function SettingsRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
        {description && (
          <p className="text-sm text-[var(--color-text-quaternary)] mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
      {description && (
        <p className="text-sm text-[var(--color-text-quaternary)] mt-1 leading-relaxed">{description}</p>
      )}
    </div>
  )
}

// ─── Button variants ──────────────────────────────────────────────────────────

function BtnPrimary({ children, onClick, type = 'button' }: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'
}) {
  return (
    <button type={type} onClick={onClick}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold
        bg-[var(--color-bg-brand-solid)] text-white hover:bg-[var(--color-bg-brand-solid_hover)]
        shadow-xs transition-all duration-100 whitespace-nowrap">
      {children}
    </button>
  )
}

function BtnSecondary({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold
        bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] shadow-xs
        text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary_hover)]
        transition-all duration-100 whitespace-nowrap">
      {children}
    </button>
  )
}

function BtnGhost({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold
        text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-primary_hover)]
        hover:text-[var(--color-text-secondary)] transition-all duration-100 whitespace-nowrap">
      {children}
    </button>
  )
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileSettings() {
  const { user } = useUser()
  const userStatus = useOfficeStore((s) => s.userStatus)
  const name   = user?.fullName ?? user?.username ?? 'Usuario'
  const email  = user?.primaryEmailAddress?.emailAddress ?? ''
  const avatar = user?.imageUrl ?? null

  return (
    <div className="space-y-5">
      <PageHeader
        title="Perfil"
        description="Tu información pública visible para los miembros del workspace."
      />

      {/* Avatar */}
      <SettingsCard>
        <div className="py-4">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <Avatar name={name} avatarUrl={avatar} status={userStatus} size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BtnSecondary><Upload size={13} />Subir foto</BtnSecondary>
                <BtnGhost>Eliminar</BtnGhost>
              </div>
              <p className="text-xs text-[var(--color-text-quaternary)]">
                JPG, PNG o GIF · Máximo 4 MB
              </p>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Personal info */}
      <SettingsCard
        title="Información personal"
        description="Nombre, email y cargo visibles para el equipo."
        footer={
          <>
            <BtnGhost>Cancelar</BtnGhost>
            <BtnPrimary>Guardar cambios</BtnPrimary>
          </>
        }
      >
        <div className="py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre completo" required>
              <Input defaultValue={name} placeholder="Tu nombre completo" />
            </FormField>
            <FormField label="Usuario">
              <Input defaultValue={user?.username ?? ''} placeholder="@usuario" />
            </FormField>
          </div>
          <FormField
            label="Email"
            hint="El email se gestiona directamente desde Clerk y no puede cambiarse aquí."
          >
            <Input defaultValue={email} disabled />
          </FormField>
          <FormField
            label="Cargo"
            hint="Aparece en el mapa y en los paneles de presencia del equipo."
          >
            <Input placeholder="p.ej. Product Designer, Backend Engineer..." />
          </FormField>
          <FormField label="Zona horaria">
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-quaternary)] pointer-events-none" />
              <Input defaultValue="Europe/Madrid (UTC+1)" className="pl-8" />
            </div>
          </FormField>
        </div>
      </SettingsCard>

      {/* Status */}
      <SettingsCard title="Estado">
        <div className="py-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_COLORS[userStatus]}`} />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{STATUS_LABELS[userStatus]}</span>
            <span className="text-xs text-[var(--color-text-quaternary)] ml-auto">Cambia tu estado desde el mapa virtual</span>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}

// ─── Security ─────────────────────────────────────────────────────────────────

function SecuritySettings() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)

  return (
    <div className="space-y-5">
      <PageHeader title="Seguridad" description="Gestiona tu contraseña, 2FA y sesiones activas." />

      <SettingsCard
        title="Contraseña"
        description="Actualiza tu contraseña regularmente para mantener tu cuenta segura."
        footer={<BtnPrimary>Actualizar contraseña</BtnPrimary>}
      >
        <div className="py-5 space-y-4">
          <FormField label="Contraseña actual">
            <div className="relative">
              <Input type={showCurrent ? 'text' : 'password'} placeholder="••••••••" className="pr-10" />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-quaternary)] hover:text-[var(--color-text-tertiary)] transition-colors">
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>
          <FormField label="Nueva contraseña" hint="Mínimo 8 caracteres con mayúsculas y números.">
            <div className="relative">
              <Input type={showNew ? 'text' : 'password'} placeholder="••••••••" className="pr-10" />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-quaternary)] hover:text-[var(--color-text-tertiary)] transition-colors">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>
          <FormField label="Confirmar contraseña">
            <Input type="password" placeholder="••••••••" />
          </FormField>
        </div>
      </SettingsCard>

      {/* 2FA */}
      <SettingsCard title="Autenticación en dos factores" description="Añade una capa extra de seguridad a tu cuenta.">
        <SettingsRow label="App autenticadora (TOTP)" description="Google Authenticator, Authy u otra app TOTP.">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full
            bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] text-[var(--color-text-quaternary)]">
            No activado
          </span>
        </SettingsRow>
        <SettingsRow label="SMS de respaldo" description="Recibe un código por SMS si pierdes acceso a tu app.">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full
            bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] text-[var(--color-text-quaternary)]">
            No activado
          </span>
        </SettingsRow>
      </SettingsCard>

      {/* Sessions */}
      <SettingsCard title="Sesiones activas" description="Dispositivos con sesión iniciada en tu cuenta.">
        {[
          { device: 'MacBook Pro · Chrome 124', location: 'Madrid, España', current: true,  time: 'Ahora' },
          { device: 'iPhone 15 Pro · Safari',   location: 'Madrid, España', current: false, time: 'hace 2 días' },
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg border border-[var(--color-border-secondary)]
                bg-[var(--color-bg-secondary)] flex items-center justify-center flex-shrink-0">
                <Lock size={13} className="text-[var(--color-fg-quaternary)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{s.device}</p>
                  {s.current && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                      bg-utility-green-50 text-utility-green-700 ring-1 ring-inset ring-utility-green-200">
                      Actual
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-quaternary)] mt-0.5">{s.location} · {s.time}</p>
              </div>
            </div>
            {!s.current && (
              <button className="text-xs font-medium text-[var(--color-text-tertiary)] hover:text-error-600 transition-colors duration-100">
                Cerrar sesión
              </button>
            )}
          </div>
        ))}
      </SettingsCard>

      {/* Danger zone */}
      <div className="rounded-xl border border-error-200 bg-error-25 overflow-hidden">
        <div className="px-6 py-4 border-b border-error-100">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Zona peligrosa</h3>
          <p className="text-sm text-[var(--color-text-quaternary)] mt-0.5">Acciones permanentes e irreversibles.</p>
        </div>
        <div className="px-6">
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Eliminar cuenta</p>
              <p className="text-sm text-[var(--color-text-quaternary)] mt-0.5">
                Borra permanentemente tu cuenta y todos los datos asociados.
              </p>
            </div>
            <button className="h-9 px-3.5 rounded-lg text-sm font-semibold flex-shrink-0
              border border-error-300 bg-white text-error-700 hover:bg-error-50
              shadow-xs transition-all duration-100">
              Eliminar cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────

function NotificationsSettings() {
  const [s, setS] = useState({
    messages: true, mentions: true, presence: false,
    sounds: true,   dnd: false,    emailDigest: false,
  })
  const toggle = (k: keyof typeof s) => setS(p => ({ ...p, [k]: !p[k] }))

  return (
    <div className="space-y-5">
      <PageHeader title="Notificaciones" description="Controla cuándo y cómo te avisamos de actividad." />

      <SettingsCard title="En app">
        <SettingsRow label="Mensajes directos" description="Notificaciones cuando recibes mensajes nuevos.">
          <Toggle checked={s.messages} onChange={() => toggle('messages')} />
        </SettingsRow>
        <SettingsRow label="Menciones" description="Cuando alguien te menciona con @.">
          <Toggle checked={s.mentions} onChange={() => toggle('mentions')} />
        </SettingsRow>
        <SettingsRow label="Cambios de presencia" description="Cuando un compañero entra o sale del workspace.">
          <Toggle checked={s.presence} onChange={() => toggle('presence')} />
        </SettingsRow>
        <SettingsRow label="Sonidos" description="Efectos de sonido para notificaciones y eventos.">
          <Toggle checked={s.sounds} onChange={() => toggle('sounds')} />
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="No Molestar">
        <SettingsRow
          label="Activar en reuniones"
          description="Silencia notificaciones automáticamente en salas de reunión."
        >
          <Toggle checked={s.dnd} onChange={() => toggle('dnd')} />
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="Email">
        <SettingsRow
          label="Resumen diario"
          description="Recibe un resumen de la actividad del workspace cada mañana."
        >
          <Toggle checked={s.emailDigest} onChange={() => toggle('emailDigest')} />
        </SettingsRow>
      </SettingsCard>
    </div>
  )
}

// ─── Appearance ───────────────────────────────────────────────────────────────

const THEMES: { value: Theme; label: string; desc: string }[] = [
  { value: 'light', label: 'Claro',  desc: 'Ideal para entornos iluminados' },
  { value: 'dark',  label: 'Oscuro', desc: 'Perfecto para trabajar de noche' },
]

function AppearanceSettings() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-5">
      <PageHeader title="Apariencia" description="Personaliza el aspecto visual de tu Kubik." />

      <SettingsCard title="Tema de color">
        <div className="py-4">
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => {
              const isActive = theme === t.value
              const isDark = t.value === 'dark'
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'relative flex flex-col gap-3 p-4 rounded-xl border text-left transition-all duration-150',
                    isActive
                      ? 'border-[var(--color-border-brand)] ring-1 ring-[var(--color-border-brand)] bg-[var(--color-bg-primary)]'
                      : 'border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-primary)] hover:bg-[var(--color-bg-primary_hover)]'
                  )}
                >
                  {/* UI Preview */}
                  <div className={cn(
                    'w-full h-16 rounded-lg border overflow-hidden',
                    isDark ? 'bg-[#0C111D] border-[#1D2939]' : 'bg-[#F9FAFB] border-[#E4E7EC]'
                  )}>
                    <div className={cn('h-4 border-b flex items-center px-2 gap-1.5',
                      isDark ? 'bg-[#101828] border-[#1D2939]' : 'bg-white border-[#E4E7EC]')}>
                      <span className="w-1.5 h-1.5 rounded-full bg-kubik-600" />
                      <span className={cn('w-10 h-1 rounded-full', isDark ? 'bg-[#344054]' : 'bg-[#E4E7EC]')} />
                    </div>
                    <div className="flex h-12">
                      <div className={cn('w-10 border-r flex flex-col gap-1 p-1.5',
                        isDark ? 'bg-[#101828] border-[#1D2939]' : 'bg-white border-[#E4E7EC]')}>
                        {[0,1,2].map(i => <span key={i} className={cn('w-full h-1 rounded-full', isDark ? 'bg-[#1D2939]' : 'bg-[#F2F4F7]')} />)}
                      </div>
                      <div className="flex-1 p-2 flex flex-col gap-1.5">
                        <span className={cn('w-3/4 h-1.5 rounded-full', isDark ? 'bg-[#1D2939]' : 'bg-[#E4E7EC]')} />
                        <span className={cn('w-1/2 h-1 rounded-full',   isDark ? 'bg-[#344054]' : 'bg-[#F2F4F7]')} />
                        <span className={cn('w-2/3 h-1 rounded-full',   isDark ? 'bg-[#344054]' : 'bg-[#F2F4F7]')} />
                      </div>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{t.label}</p>
                      <p className="text-xs text-[var(--color-text-quaternary)] mt-0.5">{t.desc}</p>
                    </div>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-bg-brand-solid)] flex items-center justify-center flex-shrink-0">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Movimiento">
        <SettingsRow label="Reducir animaciones" description="Útil en equipos con menor rendimiento gráfico.">
          <Toggle checked={false} onChange={() => {}} />
        </SettingsRow>
      </SettingsCard>
    </div>
  )
}

// ─── Workspace ────────────────────────────────────────────────────────────────

function WorkspaceSettings() {
  return (
    <div className="space-y-5">
      <PageHeader title="General" description="Configura el workspace para todo tu equipo." />

      <SettingsCard
        title="Identidad"
        footer={<BtnPrimary>Guardar cambios</BtnPrimary>}
      >
        <div className="py-5 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-[var(--color-border-secondary)]">
            <div className="w-14 h-14 rounded-xl border-2 border-dashed border-[var(--color-border-secondary)]
              bg-[var(--color-bg-secondary)] flex items-center justify-center text-2xl flex-shrink-0">
              🏢
            </div>
            <div>
              <BtnSecondary><Upload size={13} />Cambiar ícono</BtnSecondary>
              <p className="text-xs text-[var(--color-text-quaternary)] mt-1.5">PNG, JPG o SVG · 512×512px</p>
            </div>
          </div>
          <FormField label="Nombre del workspace">
            <Input defaultValue="Mi Empresa" />
          </FormField>
          <FormField label="URL del workspace" hint="Solo letras minúsculas, números y guiones.">
            <div className="flex">
              <span className="inline-flex items-center px-3 h-10 rounded-l-lg border border-r-0
                border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]
                text-sm text-[var(--color-text-quaternary)] flex-shrink-0">
                kubik.app/
              </span>
              <Input defaultValue="mi-empresa" className="rounded-l-none" />
            </div>
          </FormField>
          <FormField label="Descripción" hint="Opcional · Visible para nuevos miembros al unirse.">
            <textarea
              rows={3}
              placeholder="Describe tu workspace en pocas palabras..."
              className="w-full rounded-lg border border-[var(--color-border-primary)]
                bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm text-[var(--color-text-primary)]
                placeholder:text-[var(--color-text-quaternary)] shadow-xs resize-none
                focus:outline-none focus:ring-2 focus:ring-[var(--color-border-brand)]/30
                focus:border-[var(--color-border-brand)] transition-all duration-150"
            />
          </FormField>
        </div>
      </SettingsCard>

      <SettingsCard title="Configuración">
        <SettingsRow label="Registro público" description="Cualquier persona con el link puede unirse al workspace.">
          <Toggle checked={false} onChange={() => {}} />
        </SettingsRow>
        <SettingsRow label="Invitaciones por email" description="Los miembros pueden invitar a otros por email.">
          <Toggle checked={true} onChange={() => {}} />
        </SettingsRow>
        <SettingsRow label="Mapa interactivo" description="Muestra el mapa 2D como pantalla principal de la oficina.">
          <Toggle checked={true} onChange={() => {}} />
        </SettingsRow>
      </SettingsCard>
    </div>
  )
}

// ─── Members ──────────────────────────────────────────────────────────────────

function MembersSettings() {
  const onlineUsers = useOfficeStore((s) => s.onlineUsers)

  return (
    <div className="space-y-5">
      <PageHeader title="Miembros" description={`${onlineUsers.length} personas en el workspace.`} />

      <SettingsCard title="Miembros activos" description="Gestiona miembros, roles y permisos." noPadding>
        {/* Search + invite */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--color-border-secondary)]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-quaternary)]" size={13} strokeWidth={1.8} />
            <Input placeholder="Buscar miembro..." className="pl-9 h-9" />
          </div>
          <BtnPrimary><Zap size={13} />Invitar</BtnPrimary>
        </div>
        {/* List */}
        <div className="divide-y divide-[var(--color-border-secondary)]">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-[var(--color-bg-primary_hover)] transition-colors">
              <Avatar name={user.name} avatarUrl={user.avatarUrl} status={user.status} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--color-text-quaternary)] truncate">{user.email}</p>
              </div>
              <select className="text-xs text-[var(--color-text-tertiary)] bg-transparent border-0 focus:outline-none cursor-pointer appearance-none pr-1 hover:text-[var(--color-text-secondary)] transition-colors">
                <option>Miembro</option>
                <option>Admin</option>
                <option>Host</option>
              </select>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  )
}

// ─── Billing ──────────────────────────────────────────────────────────────────

function BillingSettings() {
  return (
    <div className="space-y-5">
      <PageHeader title="Facturación" description="Gestiona tu suscripción y métodos de pago." />

      {/* Current plan card */}
      <div className="rounded-xl border border-[var(--color-border-brand)] overflow-hidden
        bg-gradient-to-br from-kubik-50 via-white to-white
        dark:from-kubik-950 dark:via-[var(--color-bg-primary)] dark:to-[var(--color-bg-primary)]">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest
                px-2 py-0.5 rounded-full
                bg-utility-brand-50 text-utility-brand-700 ring-1 ring-inset ring-utility-brand-200">
                Plan Pro
              </span>
              <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mt-3">
                $29<span className="text-base font-normal text-[var(--color-text-quaternary)]"> / mes</span>
              </h3>
              <p className="text-sm text-[var(--color-text-quaternary)] mt-1">
                50 miembros · Mapa interactivo · Soporte prioritario
              </p>
            </div>
            <BtnSecondary>Gestionar plan</BtnSecondary>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--color-border-brand)]/30">
            <p className="text-sm text-[var(--color-text-quaternary)]">
              Próxima renovación: <span className="font-medium text-[var(--color-text-secondary)]">1 de junio, 2026</span>
            </p>
          </div>
        </div>
      </div>

      {/* Usage */}
      <SettingsCard title="Uso del plan">
        {[
          { label: 'Miembros',       used: 12,  total: 50,  unit: '' },
          { label: 'Salas activas',  used: 4,   total: 20,  unit: '' },
          { label: 'Almacenamiento', used: 1.2, total: 10,  unit: ' GB' },
        ].map((item) => (
          <div key={item.label} className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</span>
              <span className="text-xs text-[var(--color-text-quaternary)]">
                {item.used}{item.unit} / {item.total}{item.unit}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-bg-brand-solid)] transition-all duration-500"
                style={{ width: `${(item.used / item.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </SettingsCard>

      {/* Payment method */}
      <SettingsCard title="Método de pago">
        <div className="py-4 flex items-center gap-3">
          <div className="w-10 h-6 rounded-md border border-[var(--color-border-secondary)]
            bg-[var(--color-bg-secondary)] flex items-center justify-center
            text-[9px] font-bold text-[var(--color-text-tertiary)] tracking-wider flex-shrink-0">
            VISA
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">•••• •••• •••• 4242</p>
            <p className="text-xs text-[var(--color-text-quaternary)]">Vence 12/28</p>
          </div>
          <BtnGhost>Cambiar</BtnGhost>
        </div>
      </SettingsCard>
    </div>
  )
}

// ─── Navigation ───────────────────────────────────────────────────────────────

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  badge?: string
}

const NAV_SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Cuenta',
    items: [
      { id: 'profile',  label: 'Perfil',    icon: User   },
      { id: 'security', label: 'Seguridad', icon: Shield },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { id: 'workspace', label: 'General',  icon: Building2  },
      { id: 'members',   label: 'Miembros', icon: UsersIcon  },
    ],
  },
  {
    title: 'Preferencias',
    items: [
      { id: 'notifications', label: 'Notificaciones', icon: Bell    },
      { id: 'appearance',    label: 'Apariencia',     icon: Palette },
    ],
  },
  {
    title: 'Plan',
    items: [
      { id: 'billing', label: 'Facturación', icon: CreditCard, badge: 'Pro' },
    ],
  },
]

function SettingsNav({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <nav className="w-52 flex-shrink-0 flex flex-col border-r border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] overflow-y-auto">
      <div className="px-4 py-4 border-b border-[var(--color-border-secondary)] flex-shrink-0">
        <h2 className="text-[11px] font-semibold text-[var(--color-text-quaternary)] uppercase tracking-widest">
          Configuración
        </h2>
      </div>
      <div className="flex-1 p-2 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-2.5 pb-1 text-[10px] font-semibold text-[var(--color-text-quaternary)] uppercase tracking-widest">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = active === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left',
                      'transition-all duration-100',
                      isActive
                        ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-medium shadow-xs'
                        : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-primary_hover)] hover:text-[var(--color-text-secondary)]'
                    )}
                  >
                    <item.icon size={15}
                      className={isActive ? 'text-kubik-600' : 'text-[var(--color-fg-quaternary)]'} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                        bg-utility-brand-50 text-utility-brand-700 ring-1 ring-inset ring-utility-brand-200">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}

// ─── View registry ────────────────────────────────────────────────────────────

const VIEWS: Record<string, React.FC> = {
  profile:       ProfileSettings,
  security:      SecuritySettings,
  notifications: NotificationsSettings,
  appearance:    AppearanceSettings,
  workspace:     WorkspaceSettings,
  members:       MembersSettings,
  billing:       BillingSettings,
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function SettingsView() {
  const [active, setActive] = useState('profile')
  const ActiveView = VIEWS[active] ?? ProfileSettings

  return (
    <div className="flex-1 flex overflow-hidden">
      <SettingsNav active={active} onSelect={setActive} />
      <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)]">
        <div className="max-w-2xl mx-auto px-8 py-8">
          <ActiveView />
        </div>
      </div>
    </div>
  )
}
