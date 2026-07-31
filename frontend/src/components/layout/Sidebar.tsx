import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  KeyRound,
  FileText,
  Wallet,
  BarChart3,
  ShoppingCart,
  Dumbbell,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useExpiringDocuments } from '@/hooks/useExpiringDocuments'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/', label: 'Vault', icon: KeyRound, end: true },
  { to: '/documents', label: 'Documents', icon: FileText, end: false },
  { to: '/expenses', label: 'Expenses', icon: Wallet, end: false },
  { to: '/statements', label: 'Statements', icon: BarChart3, end: false },
  { to: '/grocery', label: 'Grocery', icon: ShoppingCart, end: false },
  { to: '/gym', label: 'Gym Tracker', icon: Dumbbell, end: false },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const { count: expiringCount } = useExpiringDocuments()
  const { theme, toggleTheme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
            <KeyRound className="h-5 w-5" />
          </div>
          <span className="text-base font-semibold text-slate-900 dark:text-white">
            Password Manager
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container (Desktop fixed left & Mobile slide-out drawer) */}
      <aside
        className={cn(
          'fixed bottom-0 top-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-md">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              Password Manager
            </h1>
            <p className="text-[11px] font-medium text-slate-500">Personal Vault</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Main Menu
          </p>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-900/40 dark:text-primary-300 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>{label}</span>
              </div>

              {to === '/documents' && expiringCount > 0 && (
                <span
                  title={`${expiringCount} document(s) expiring within 10 days`}
                  className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-sm"
                >
                  {expiringCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Footer Profile & Settings */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-3">
          {/* User Email & Theme Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                {user?.email}
              </span>
            </div>

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Logout Button */}
          <Button
            variant="secondary"
            className="w-full justify-center gap-2 text-xs"
            onClick={handleLogout}
            loading={loggingOut}
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </Button>
        </div>
      </aside>
    </>
  )
}
