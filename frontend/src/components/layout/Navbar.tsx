import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  KeyRound,
  FileText,
  Wallet,
  BarChart3,
  LogOut,
  User as UserIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useExpiringDocuments } from '@/hooks/useExpiringDocuments'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/', label: 'Vault', icon: KeyRound, end: true },
  { to: '/documents', label: 'Documents', icon: FileText, end: false },
  { to: '/expenses', label: 'Expenses', icon: Wallet, end: false },
  { to: '/statements', label: 'Statements', icon: BarChart3, end: false },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const { count: expiringCount } = useExpiringDocuments()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
              <KeyRound className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-slate-900">
              Password Manager
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
                {to === '/documents' && expiringCount > 0 && (
                  <span
                    title={`${expiringCount} document(s) expiring within 10 days`}
                    className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white"
                  >
                    {expiringCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
            <UserIcon className="h-4 w-4 text-slate-400" />
            <span className="max-w-[200px] truncate">{user?.email}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            loading={loggingOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
