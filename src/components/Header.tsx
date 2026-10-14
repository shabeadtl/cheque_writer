import { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Crosshair,
  Settings,
  WifiOff,
  Download,
  LogOut,
  User as UserIcon,
  History,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/lib/theme';

export const NAV_TABS = [
  { value: 'write', label: 'Write Cheque', icon: FileText },
  { value: 'printer', label: 'Printer', icon: Printer },
  { value: 'layout', label: 'Layout & Calibration', icon: Crosshair },
  { value: 'audit', label: 'Audit Log', icon: History },
  { value: 'settings', label: 'Settings', icon: Settings },
] as const;

interface HeaderProps {
  version: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Header({ version, activeTab, onTabChange }: HeaderProps) {
  const { user, signOut, isOffline } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if launched as installed standalone PWA
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs transition-colors dark:border-slate-800/90 dark:bg-slate-900/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Top row: identity + status + theme toggle + user controls */}
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#007267] to-[#004d40] shadow-md shadow-[#007267]/20">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="6" y1="10" x2="14" y2="10" />
                <line x1="6" y1="14" x2="10" y2="14" />
                <circle cx="17" cy="13" r="2" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                Check Writer
              </h1>
              <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                Cheque Printing System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {installPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#007267] bg-[#007267]/10 px-3 py-1 text-xs font-semibold text-[#007267] hover:bg-[#007267] hover:text-white transition-all shadow-xs cursor-pointer dark:border-[#009688] dark:text-[#00c4b4] dark:bg-[#007267]/20 dark:hover:bg-[#007267]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Install PWA
              </button>
            )}
            {isOffline && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400"
              >
                <WifiOff className="h-3 w-3" aria-hidden="true" />
                {isInstalled ? 'PWA Offline' : 'Offline'}
              </span>
            )}

            {/* Version Badge */}
            <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 lg:inline">
              v{version}
            </span>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007267] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white cursor-pointer"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600 transition-transform duration-200 hover:-rotate-12" />
              )}
            </button>

            {/* Authenticated user badge and sign-out */}
            {user && (
              <div className="ml-1 flex items-center gap-1.5 border-l border-slate-200 pl-2.5 dark:border-slate-700">
                <span
                  title={user.email || 'Authenticated User'}
                  className="hidden md:inline-flex items-center gap-1.5 max-w-[180px] truncate text-xs font-medium text-slate-700 bg-slate-100 rounded-full px-2.5 py-1 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700"
                >
                  <UserIcon className="h-3.5 w-3.5 text-[#007267] dark:text-[#00c4b4] shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  title="Sign Out"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:border-red-900 dark:hover:text-red-400"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nav tabs with refined modern styling */}
        <nav className="flex gap-1 overflow-x-auto pb-px" role="tablist" aria-label="Main navigation">
          {NAV_TABS.map(({ value, label, icon: Icon }) => {
            const isActive = activeTab === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={isActive}
                id={`tab-${value}`}
                aria-controls={`panel-${value}`}
                onClick={() => onTabChange(value)}
                className={cn(
                  'relative inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 text-xs font-medium transition-all cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007267]',
                  isActive
                    ? 'border-[#007267] text-[#007267] bg-[#007267]/5 dark:border-[#00c4b4] dark:text-[#00c4b4] dark:bg-[#007267]/15 font-semibold'
                    : 'border-transparent text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-[#007267] dark:text-[#00c4b4]' : 'text-slate-400 dark:text-slate-500')} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
