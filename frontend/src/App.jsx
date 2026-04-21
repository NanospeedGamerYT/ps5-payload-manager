import React, { useState, useEffect, useRef, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Settings,
  Terminal,
  CloudDownload,
  Upload,
  Trash2,
  Cpu,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  LayoutDashboard,
  Database,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Package,
  Power,
  Zap,
  Info,
  ChevronUp,
  ChevronDown,
  Heart,
  Menu,
  X
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import './App.css'

// --- Utilities ---
const isPS5 = /PlayStation/i.test(navigator.userAgent);

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const parsePayloadName = (path) => {
  if (!path) return { displayName: '', version: null };
  if (path.startsWith('!')) {
    const ms = parseInt(path.substring(1));
    return { displayName: `Delay (${ms / 1000}s)`, version: null, isDelay: true };
  }

  let name = path.split('/').pop().replace(/\.(elf|bin|lua)$/i, '');

  // Try to find version pattern like _v1.0 or -v1.0 or _1.0
  const versionMatch = name.match(/[_-](v?\d+[\d.a-z-]+)/i);
  let version = null;

  if (versionMatch) {
    version = versionMatch[1];
    name = name.replace(versionMatch[0], '');
  }

  return {
    displayName: name.replace(/_/g, ' ').replace(/-/g, ' '),
    version: version,
    isDelay: false
  };
};

const PayloadName = ({ path, className, versionClassName, stacked = false }) => {
  const { displayName, version, isDelay } = parsePayloadName(path);
  return (
    <div className={cn("flex min-w-0 flex-1", stacked ? "flex-col items-start" : "items-center space-x-3", className)}>
      <div className="flex items-center space-x-2 min-w-0">
        {isDelay && <Zap className="w-4 h-4 text-ps-blue shrink-0" />}
        <span className="font-extrabold truncate shrink leading-tight">{displayName}</span>
      </div>
      {version && (
        <span className={cn(
          stacked
            ? "text-[11px] font-bold tracking-wider text-ps-blue mt-1 opacity-90"
            : "text-[10px] px-2 py-0.5 bg-ps-blue/10 text-ps-blue font-bold rounded-md border border-ps-blue/20 shrink-0",
          versionClassName)}>
          {version}
        </span>
      )}
    </div>
  );
};

// --- Custom Hook for Gamepad Navigation ---
function useGamepadNavigation(view, setView) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Basic d-pad navigation support can be added here if needed
      // For now we rely on standard browser focus cycling
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view])
}

// --- Components ---

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={cn(
      "fixed top-8 right-8 z-[1000] flex items-center space-x-4 p-5 rounded-2xl border shadow-2xl animate-in slide-in-from-right duration-300 pointer-events-auto",
      type === 'success' ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-400" : "bg-red-950/90 border-red-500/50 text-red-400"
    )}>
      {type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
      <span className="font-bold uppercase tracking-tight">{message}</span>
    </div>
  )
}

const Modal = ({ show, title, children, onClose, footer }) => {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass-panel w-full max-w-xl p-10 rounded-ps-3xl border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in duration-300">
        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-8">{title}</h3>
        <div className="text-zinc-300 mb-10 text-xl font-medium leading-relaxed">
          {children}
        </div>
        {footer && <div className="flex space-x-4">{footer}</div>}
      </div>
    </div>
  )
}

const NavButton = ({ active, onClick, icon: Icon, label, mobileLabel, className, sidebar, sidebarExpanded, showSeparator }) => {
  const isDonate = label === 'Donate';
  return (
    <div className="flex items-center flex-1 md:flex-none">
      {showSeparator && <div className="w-px h-6 bg-white/10 md:hidden" />}
      <button
        onClick={onClick}
        className={cn(
          "flex items-center transition-all border group relative outline-none",
          sidebar
            ? cn("w-full p-4 mb-2 rounded-2xl border-none", sidebarExpanded ? "justify-start space-x-4" : "justify-center")
            : (isPS5 ? "flex-row space-x-3 px-6 py-3 rounded-2xl" : "flex-col md:flex-row md:space-x-3 px-4 md:px-6 py-2 md:py-3 rounded-2xl border-none flex-1 md:flex-none"),
          active
            ? (sidebar
              ? (isDonate ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]" : "bg-ps-blue text-white shadow-[0_0_20px_rgba(0,112,209,0.3)]")
              : (isDonate ? "text-red-500" : "text-ps-blue font-black"))
            : (isDonate ? "text-red-500/60" : "bg-transparent text-zinc-400 hover:text-white"),
          className
        )}
      >
        <Icon className={cn(
          "w-6 h-6 shrink-0 group-hover:scale-110 transition-transform",
          active ? (sidebar ? "text-current" : (isDonate ? "text-red-500" : "text-ps-blue")) : (isDonate ? "text-red-500" : "")
        )} />
        <span className={cn(
          "uppercase tracking-tighter transition-all duration-300 whitespace-nowrap overflow-hidden",
          sidebar
            ? (sidebarExpanded ? "opacity-100 w-auto font-bold text-sm" : "opacity-0 w-0")
            : (isPS5 ? "text-sm font-bold" : "text-[10px] md:text-sm")
        )}>
          <span className={cn((isPS5 || sidebar) ? "inline" : "hidden md:inline")}>{label}</span>
          {!isPS5 && !sidebar && <span className={cn("inline md:hidden", active ? (isDonate ? "text-red-500" : "text-ps-blue") : "font-medium text-zinc-500")}>{mobileLabel}</span>}
        </span>
      </button>
    </div>
  )
}

const PayloadButton = ({ path, onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="group glass-card p-6 rounded-ps-xl flex flex-col border border-white/5 hover:border-ps-blue hover:bg-ps-blue/5 transition-all text-left relative overflow-hidden"
    >
      <div className="flex items-start justify-between w-full z-10">
        <PayloadName path={path} className="text-white text-xl" stacked />
        {isLoading && <Loader2 className="w-6 h-6 animate-spin text-ps-blue shrink-0" />}
      </div>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-ps-blue/0 group-hover:bg-ps-blue/5 transition-colors z-0 pointer-events-none" />
    </button>
  )
}

const AutoloadOverlay = ({ status, onCancel, onFinish, isPS5 }) => {
  const isCountdown = status.remaining > 0;
  const isExecuting = status.remaining === 0 && status.current !== 'DONE';
  const isDone = status.current === 'DONE';
  const payloadList = status.list ? status.list.split(',') : [];
  const listRef = useRef(null);
  const progress = status.total > 0 ? (status.done / status.total) : 0;

  useEffect(() => {
    if (listRef.current) {
      const activeItem = listRef.current.querySelector('[data-active="true"]');
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [status.done]);

  return (
    <div className="fixed inset-0 bg-black/98 z-[9999] flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto custom-scrollbar">
      <div className={cn(
        "relative w-full max-w-[1400px] flex flex-col items-center",
        isPS5 ? "flex-row items-center justify-center space-x-24 space-y-0" : "md:flex-row md:items-start md:justify-center md:space-x-24 md:space-y-0 space-y-12"
      )}>

        {/* LEFT COLUMN: Status, Countdown, Success, Actions */}
        <div className={cn(
          "w-full max-w-md flex flex-col items-center space-y-10",
          !isPS5 && "md:sticky md:top-0"
        )}>
          {/* Conflict Warning */}
          {!isDone && (payloadList.some(p => p.toLowerCase().includes('etahen')) &&
            payloadList.some(p => p.toLowerCase().includes('kstuff'))) && (
              <div className="w-full p-4 bg-amber-500/10 border border-amber-500/50 rounded-2xl flex items-center justify-center space-x-3 text-amber-500 animate-in fade-in">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold uppercase tracking-tight text-xs">Conflict: etaHEN + KStuff active</span>
              </div>
            )}

          {/* Status Header */}
          <div className="h-[320px] w-full flex flex-col items-center justify-center">
            {isCountdown && (
              <div className="space-y-8 animate-in fade-in zoom-in duration-300 text-center">
                <p className="text-ps-blue font-extrabold tracking-[0.2em] uppercase text-xl">Autoloading</p>
                <div className="relative h-56 w-56 mx-auto flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 scale-110">
                    <circle cx="112" cy="112" r="100" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                    <circle
                      cx="112" cy="112" r="100"
                      fill="none" stroke="currentColor" strokeWidth="8"
                      strokeDasharray="628"
                      strokeDashoffset={628 - (628 * (status.remaining / (status.delay || 5)))}
                      className="text-ps-blue transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="text-8xl font-bold text-white tabular-nums leading-none">
                    {status.remaining}
                  </span>
                </div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Waiting for manual abort...</p>
              </div>
            )}

            {isExecuting && (
              <div className="space-y-8 animate-in fade-in zoom-in duration-300 text-center">
                <p className="text-ps-blue font-black tracking-[0.4em] uppercase text-xl">Executing</p>
                <div className="relative h-56 w-56 mx-auto flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 scale-110">
                    <circle cx="112" cy="112" r="100" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                    <circle
                      cx="112" cy="112" r="100"
                      fill="none" stroke="currentColor" strokeWidth="8"
                      strokeDasharray="628"
                      strokeDashoffset={628 - (628 * progress)}
                      className="text-ps-blue transition-all duration-500 ease-out"
                    />
                  </svg>
                  <span className="text-6xl font-black text-white tabular-nums leading-none">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm italic">Loading Payloads...</p>
              </div>
            )}

            {isDone && (
              <div className="flex flex-col items-center space-y-8 animate-in zoom-in duration-500">
                <div className="bg-emerald-500 text-white p-10 rounded-full shadow-[0_0_80px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 className="w-20 h-20" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter">Autoload<br />Done</h2>
                  <p className="text-zinc-500 font-bold uppercase text-sm tracking-[0.2em]">All payloads loaded</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full pt-4">
            {isDone ? (
              <button
                onClick={onFinish}
                className="w-full py-8 bg-ps-blue text-white text-3xl font-extrabold rounded-3xl hover:bg-white hover:text-ps-blue transition-all transform active:scale-95 shadow-[0_0_50px_rgba(0,149,255,0.3)]"
              >
                Return to Dashboard
              </button>
            ) : isCountdown ? (
              <button
                onClick={onCancel}
                autoFocus
                className="w-full py-8 bg-white/10 text-white border border-white/10 text-3xl font-black uppercase rounded-3xl hover:bg-red-600 hover:border-red-600 transition-all transform active:scale-95"
              >
                Abort Autoload
              </button>
            ) : (
              <div className="h-[92px] w-full flex items-center justify-center">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-ps-blue rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-ps-blue rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-ps-blue rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-xl flex flex-col min-h-0">
          <div
            ref={listRef}
            className={cn(
              "w-full space-y-4 overflow-y-auto custom-scrollbar p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl scroll-smooth",
              isPS5 ? "h-[650px]" : "h-[400px] md:h-[650px]"
            )}
          >
            <div className="flex items-center justify-between mb-6 px-2 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-10 rounded-2xl border-b border-white/5">
              <h3 className="label-caps !text-white !opacity-100 text-sm tracking-widest flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-ps-blue" />
                <span>Payload Checklist</span>
              </h3>
              <span className="bg-white/10 px-4 py-1 rounded-full text-zinc-300 font-black text-xs">
                {isDone ? status.total : status.done} / {status.total}
              </span>
            </div>

            <div className="space-y-3">
              {payloadList.map((name, i) => {
                const active = !isDone && isExecuting && i === status.done;
                const done = isDone || i < status.done;
                return (
                  <div
                    key={i}
                    data-active={active}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border transition-all duration-500",
                      active ? 'bg-ps-blue/20 border-ps-blue shadow-[0_0_40px_rgba(0,149,255,0.15)] scale-[1.02] z-10' :
                        done ? 'bg-emerald-500/5 border-emerald-500/20 opacity-90' : 'bg-white/5 border-white/10 opacity-40'
                    )}>
                    <div className="flex items-center space-x-5">
                      {done ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
                        active ? <Loader2 className="w-6 h-6 text-ps-blue animate-spin" /> :
                          <div className="w-6 h-6 rounded-full border-2 border-white/10" />}
                      <PayloadName
                        path={name}
                        className={cn("text-xl font-bold", active ? 'text-white' : 'text-zinc-400')}
                        versionClassName={active ? 'bg-ps-blue text-white border-transparent' : ''}
                      />
                    </div>
                    {done && (
                      <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest italic">
                        Success
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

const StorageHub = ({ payloads, onInstall, onDelete, onUpload, ip }) => {
  const [remotePayloads, setRemotePayloads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(0)

  const PAYLOAD_REPO_URL = 'https://itsplk.github.io/ps5_payloads/ps5_payloads.json'

  const fetchRemote = async (force = false) => {
    setLoading(true)
    setError(false)
    try {
      let data

      if (force) {
        // Browser fetches JSON over HTTPS (no TLS issues in the browser),
        // then POSTs it to the daemon which stores it as the local cache.
        const ghRes = await fetch(PAYLOAD_REPO_URL)
        if (!ghRes.ok) throw new Error('GitHub fetch failed')
        const rawJson = await ghRes.text()

        const pushRes = await fetch('/repository_push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: rawJson,
        })
        if (!pushRes.ok) throw new Error('Push to daemon failed')
        data = await pushRes.json()
      } else {
        // Normal load: read from the daemon's local cache
        const res = await fetch('/repository_payloads')
        if (!res.ok) throw new Error()
        data = await res.json()
      }

      if (!Array.isArray(data?.payloads)) throw new Error()
      setRemotePayloads(data.payloads)
      setLastUpdate(Number(data.last_update || 0))
    } catch (e) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRemote()
  }, [])

  const localFilenames = useMemo(() => payloads.map(p => p.split('/').pop()), [payloads])
  const internalPayloads = payloads.filter(p => !p.includes('/mnt/usb'))

  const getBaseName = (filename) => {
    if (!filename) return '';
    const clean = filename.replace(/\.(elf|bin|lua)$/i, '');
    const versionMatch = clean.match(/[_-](v?\d+[\d.a-z-]+)/i);
    return versionMatch ? clean.replace(versionMatch[0], '') : clean;
  }

  const remoteStatus = useMemo(() => {
    if (!Array.isArray(remotePayloads)) return []
    return remotePayloads.map(p => {
      const isInstalled = p.filename ? localFilenames.includes(p.filename) : false
      const baseName = getBaseName(p.filename)
      const installedVersion = localFilenames.find(f => getBaseName(f) === baseName)
      const isUpdate = !isInstalled && !!installedVersion

      return { ...p, isInstalled, isUpdate, installedFilename: installedVersion }
    }).sort((a, b) => {
      if (a.isUpdate && !b.isUpdate) return -1
      if (!a.isUpdate && b.isUpdate) return 1
      return 0
    })
  }, [remotePayloads, localFilenames])

  const cloudItems = remoteStatus.filter(p => !p.isInstalled || p.isUpdate);

  return (
    <div className="space-y-12 animate-fade-in pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <h2 className="text-5xl font-extrabold text-white tracking-tight">
          Payload <span className="text-ps-blue">Management</span>
        </h2>

        {!isPS5 && (
          <label className="inline-flex items-center space-x-4 px-10 py-5 bg-ps-blue hover:bg-ps-blue/80 text-white rounded-[1.25rem] font-bold tracking-tight text-xl cursor-pointer transition-all shadow-2xl shadow-ps-blue/20 shrink-0 transform active:scale-95">
            <Upload className="w-7 h-7" />
            <span>Upload ELF Payload</span>
            <input type="file" className="hidden" onChange={onUpload} accept=".elf,.bin,.lua" />
          </label>
        )}
      </div>

      {/* Installed Payloads Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="label-caps !text-white flex items-center space-x-4 text-lg">
            <Database className="w-6 h-6 text-ps-blue" />
            <span>Installed Payloads</span>
          </h3>
          <span className="bg-white/5 px-4 py-1 rounded-full text-zinc-500 font-bold text-xs">
            {internalPayloads.length} Files
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {internalPayloads.length === 0 ? (
            <div className="py-20 border-2 border-dashed border-white/5 rounded-ps-3xl flex flex-col items-center justify-center space-y-4 bg-white/[0.01]">
              <Package className="w-16 h-16 text-white/5" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm italic">Library Empty</p>
            </div>
          ) : (
            internalPayloads.map((path, i) => {
              const fileName = path.split('/').pop()
              const remoteMatch = remoteStatus.find(rp => rp.filename === fileName || rp.installedFilename === fileName)
              return (
                <div key={i} className="group flex items-center justify-between p-6 glass-card rounded-ps-2xl border-white/10 hover:border-ps-blue/30">
                  <div className="flex items-center space-x-6">
                    <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-ps-blue/10 transition-colors">
                      <Package className="w-8 h-8 text-zinc-400 group-hover:text-ps-blue transition-colors" />
                    </div>
                    <div>
                      <PayloadName path={fileName} className="text-2xl" versionClassName="text-sm px-3 py-1 bg-ps-blue/10 text-ps-blue border-ps-blue/20" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {remoteMatch?.isUpdate && (
                      <button
                        onClick={() => onInstall(remoteMatch)}
                        className="flex items-center space-x-3 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-xl shadow-emerald-900/20"
                      >
                        <RefreshCw className="w-5 h-5 animate-spin-slow" />
                        <span>Update Available</span>
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(fileName)}
                      className="p-4 rounded-xl bg-red-950/20 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all shadow-xl"
                      title="Remove Payload"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Cloud Repository Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="label-caps !text-white flex items-center space-x-4 text-lg" >
            <CloudDownload className="w-6 h-6 text-ps-blue" />
            <span>Cloud Repository</span>
          </h3>
          <button onClick={() => fetchRemote(true)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-ps-blue">
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
        {lastUpdate > 0 && (
          <p className="px-2 text-xs uppercase tracking-widest text-zinc-500">
            Last Sync: {new Date(lastUpdate * 1000).toLocaleString()}
          </p>
        )}

        {loading && remotePayloads.length === 0 ? (
          <div className="py-24 glass-panel rounded-ps-3xl border-white/5 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-16 h-16 text-ps-blue animate-spin" />
            <p className="label-caps animate-pulse">Syncing with Repository...</p>
          </div>
        ) : error ? (
          <div className="py-20 glass-card rounded-ps-3xl border-red-500/20 flex flex-col items-center justify-center space-y-6 bg-red-950/5">
            <AlertTriangle className="w-16 h-16 text-red-500 opacity-50" />
            <div className="text-center">
              <p className="text-xl font-bold text-white uppercase tracking-tight">Repository Unavailable</p>
              <p className="text-zinc-500 mt-1">Check your internet connection and try again.</p>
            </div>
            <button onClick={() => fetchRemote(true)} className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold uppercase text-xs transition-all">Retry Connection</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {cloudItems.length === 0 ? (
              <div className="py-20 border-2 border-dashed border-white/5 rounded-ps-3xl flex flex-col items-center justify-center space-y-4 bg-white/[0.01]">
                <ShieldCheck className="w-16 h-16 text-emerald-500/10" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm italic">Repository Up to Date</p>
              </div>
            ) : (
              cloudItems.map((p, i) => (
                <div key={i} className={cn(
                  "glass-card p-8 rounded-ps-3xl flex justify-between gap-8 border-white/10 hover:border-ps-blue/20 transition-all bg-white/[0.01]",
                  isPS5 ? "flex-row items-center" : "flex-col md:flex-row md:items-center"
                )}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <PayloadName path={p.filename} className="text-2xl" versionClassName="text-sm px-3 py-1 bg-ps-blue/10 text-ps-blue border-ps-blue/20" />
                    </div>
                    <p className="text-lg text-zinc-400 font-medium max-w-3xl leading-relaxed">{p.description}</p>
                  </div>

                  <button
                    onClick={() => onInstall(p)}
                    className={cn(
                      "flex items-center justify-center space-x-4 px-8 py-5 rounded-2xl font-bold text-xl transition-all shadow-2xl shrink-0 transform active:scale-95",
                      p.isUpdate ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20" : "bg-ps-blue hover:bg-ps-blue/80 text-white shadow-ps-blue/20"
                    )}
                  >
                    <CloudDownload className="w-7 h-7" />
                    <span>{p.isUpdate ? "Update" : "Install"}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Footer Info for PS5 */}
      {isPS5 && (
        <div className="glass-card p-10 rounded-ps-3xl flex items-center space-x-12 border-white/10 bg-black/40 mt-16">
          <div className="flex flex-col items-center space-y-6 shrink-0">
            <div className="bg-white p-6 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.1)]">
              <QRCodeSVG value={`http://${ip}:8084`} size={160} level="M" />
            </div>
            <code className="text-white font-mono text-lg font-black opacity-90 italic tracking-tight uppercase">{ip}:8084</code>
          </div>
          <div className="flex-1 space-y-4">
            <h4 className="label-caps !text-white !opacity-100 text-2xl tracking-widest flex items-center space-x-4">
              <div className="w-2 h-8 bg-ps-blue rounded-full" />
              <span>Remote Management</span>
            </h4>
            <p className="text-xl text-zinc-400 leading-relaxed italic font-medium max-w-3xl">
              Access this dashboard from your computer or phone to manage and upload payloads directly from your local network.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

const AutoloadView = ({ payloads, config, onSaveConfig, onToast }) => {
  const [subView, setSubView] = useState('list')
  const [enabled, setEnabled] = useState(false)
  const [autoloadList, setAutoloadList] = useState([])
  const [showDelayModal, setShowDelayModal] = useState(false)
  const [customDelay, setCustomDelay] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (config) {
      setEnabled(config.AUTOLOAD_ENABLED === true || config.AUTOLOAD_ENABLED === "true")
      setAutoloadList(config.AUTOLOAD_LIST ? config.AUTOLOAD_LIST.split(',').filter(x => x) : [])
    }
  }, [config])

  const internalPayloads = payloads.filter(p => !p.includes('/mnt/usb')).map(p => p.split('/').pop())
  const availablePayloads = internalPayloads.filter(p => !autoloadList.includes(p))

  const handleToggle = (val) => {
    setEnabled(val)
    onSaveConfig({ AUTOLOAD_ENABLED: val, AUTOLOAD_LIST: autoloadList.join(',') })
  }

  const addPayload = (p) => {
    const isKstuff = p.toLowerCase().includes('kstuff');
    if (isKstuff) {
      const existing = autoloadList.find(x => x.toLowerCase().includes('kstuff'));
      if (existing) {
        onToast(`Conflict: Multiple KStuff payloads detected.`, 'error');
        return;
      }
    }
    setAutoloadList([...autoloadList, p]);
    setSubView('list')
  }

  const addDelay = (ms) => {
    setAutoloadList([...autoloadList, `!${ms}`])
    setShowDelayModal(false)
    setSubView('list')
  }

  const moveUp = (index) => {
    if (index === 0) return
    const newList = [...autoloadList]
      ;[newList[index - 1], newList[index]] = [newList[index], newList[index - 1]]
    setAutoloadList(newList)
  }

  const moveDown = (index) => {
    if (index === autoloadList.length - 1) return
    const newList = [...autoloadList]
      ;[newList[index + 1], newList[index]] = [newList[index], newList[index + 1]]
    setAutoloadList(newList)
  }

  const handleSave = async () => {
    const shouldEnable = autoloadList.length > 0 && enabled
    if (autoloadList.length === 0) setEnabled(false)
    const finalList = autoloadList.map(p => p === 'DELAY' ? '!1000' : p)
    const success = await onSaveConfig({ AUTOLOAD_ENABLED: shouldEnable, AUTOLOAD_LIST: finalList.join(',') })
    if (success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const renderAvailable = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {subView === 'add' && (
            <button onClick={() => setSubView('list')} className="p-2 bg-white/5 rounded-xl border border-white/10 md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h3 className="label-caps !text-white !opacity-100 text-xl tracking-widest">Available Payloads</h3>
        </div>
        {subView === 'list' && (
          <button
            onClick={() => handleToggle(false)}
            className="px-6 py-2 rounded-xl font-black uppercase italic tracking-tighter bg-red-600/10 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white transition-all shadow-lg text-xs"
          >
            Disable Autoload
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4">
        {availablePayloads.map(p => {
          const isKstuff = p.toLowerCase().includes('kstuff');
          const hasKstuff = autoloadList.some(x => x.toLowerCase().includes('kstuff'));
          const isBlocked = isKstuff && hasKstuff;

          return (
            <button
              key={p}
              onClick={() => !isBlocked && addPayload(p)}
              disabled={isBlocked}
              className={cn(
                "flex items-center justify-between p-6 glass-card rounded-2xl border-white/20 transition-all text-left",
                isBlocked ? "opacity-40 cursor-not-allowed" : "bg-white/[0.03] hover:border-ps-blue group"
              )}
            >
              <PayloadName path={p} className={cn("text-xl", isBlocked ? "text-zinc-500" : "text-white")} />
              <ArrowRight className={cn("w-6 h-6 transition-all", isBlocked ? "text-zinc-800" : "text-zinc-500 group-hover:text-ps-blue group-hover:translate-x-2")} />
            </button>
          )
        })}
        <div className="pt-4 border-t border-white/10 mt-4">
          <button
            onClick={() => setShowDelayModal(true)}
            className="w-full flex items-center justify-between p-6 bg-white/[0.03] rounded-2xl border border-dashed border-white/20 hover:border-ps-blue group transition-all"
          >
            <div className="flex items-center space-x-4">
              <Zap className="w-6 h-6 text-ps-blue" />
              <span className="font-bold text-white uppercase tracking-tight text-xl">Add Delay</span>
            </div>
            <ArrowRight className="w-6 h-6 text-zinc-500 group-hover:text-ps-blue group-hover:translate-x-2 transition-all" />
          </button>
        </div>
      </div>
    </div>
  )

  const renderSequence = () => (
    <div className="space-y-8 animate-fade-in flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-extrabold text-white tracking-tight">
          Autoload <span className="text-ps-blue">Sequence</span>
        </h2>
        <button
          onClick={() => setSubView('add')}
          className={cn(
            "flex items-center space-x-2 px-6 py-3 bg-ps-blue text-white rounded-xl font-bold uppercase tracking-tight shadow-xl",
            isPS5 ? "hidden" : "md:hidden"
          )}
        >
          <Activity className="w-5 h-5" />
          <span>Add Item</span>
        </button>
      </div>

      <div className="glass-panel p-6 rounded-ps-3xl border-white/10 flex-1 overflow-hidden flex flex-col min-h-[400px]">
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 mb-6">
          {autoloadList.map((p, i) => (
            <div key={`${p}-${i}`} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 animate-in slide-in-from-left duration-200">
              <div className="flex items-center space-x-4">
                <span className="text-ps-blue font-black italic">{i + 1}</span>
                <PayloadName path={p} className="text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => moveUp(i)} disabled={i === 0} className="p-2 bg-white/10 text-zinc-400 hover:bg-ps-blue hover:text-white rounded-xl disabled:opacity-5">
                  <ChevronUp className="w-5 h-5" />
                </button>
                <button onClick={() => moveDown(i)} disabled={i === autoloadList.length - 1} className="p-2 bg-white/10 text-zinc-400 hover:bg-ps-blue hover:text-white rounded-xl disabled:opacity-5">
                  <ChevronDown className="w-5 h-5" />
                </button>
                <button onClick={() => setAutoloadList(autoloadList.filter((_, idx) => idx !== i))} className="p-2 bg-white/10 text-zinc-400 hover:bg-red-600 hover:text-white rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {autoloadList.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-10 italic py-20">
              <RefreshCw className="w-16 h-16 mb-4" />
              <p className="text-2xl font-bold">Sequence Empty</p>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className={cn(
            "w-full py-5 rounded-2xl font-bold tracking-tight text-xl transition-all shadow-2xl flex items-center justify-center space-x-3",
            saved ? "bg-emerald-600 text-white" : "bg-ps-blue hover:bg-ps-blue/80 text-white"
          )}
        >
          {saved ? <CheckCircle2 className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          <span>{saved ? "Configuration Saved" : "Save Sequence"}</span>
        </button>
      </div>
    </div>
  )

  if (!enabled) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fade-in text-center p-6 md:p-12">
        <div className="relative h-24 w-24 md:h-32 md:w-32 mx-auto">
          <div className="absolute inset-0 bg-ps-blue/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative flex items-center justify-center h-full w-full bg-black/40 border border-white/10 rounded-3xl md:rounded-[2.5rem] shadow-2xl">
            <RefreshCw className="w-10 h-10 md:w-16 md:h-16 text-ps-blue" />
          </div>
        </div>
        <div className="space-y-3 md:space-y-4 px-4 max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
            Autoload <span className="text-ps-blue">Sequence</span>
          </h2>
          <p className="text-md md:text-xl text-zinc-400 font-medium leading-relaxed">
            Chain multiple payloads to be executed automatically every time Next Menu starts.
          </p>
        </div>
        <button
          onClick={() => handleToggle(true)}
          className="px-8 md:px-12 py-5 md:py-6 bg-ps-blue text-white text-lg md:text-2xl font-extrabold rounded-2xl md:rounded-[1.5rem] hover:bg-ps-blue/80 transition-all transform active:scale-95 shadow-[0_0_40px_rgba(0,149,255,0.3)]"
        >
          Enable Autoload
        </button>
      </div>
    )
  }

  return (
    <div className={cn(
      "overflow-hidden md:overflow-visible animate-fade-in",
      isPS5 ? "h-full" : "h-[calc(100vh-250px)] md:h-auto"
    )}>
      <div className={cn(
        "gap-12 items-start h-full",
        isPS5 ? "grid grid-cols-2" : "hidden md:grid md:grid-cols-2"
      )}>
        {renderAvailable()}
        {renderSequence()}
      </div>
      <div className={cn(
        "h-full flex flex-col",
        isPS5 ? "hidden" : "md:hidden"
      )}>
        {subView === 'list' ? renderSequence() : renderAvailable()}
      </div>

      <Modal
        show={showDelayModal}
        title="Configure Delay"
        onClose={() => setShowDelayModal(false)}
        footer={
          <button
            onClick={() => setShowDelayModal(false)}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold uppercase tracking-tight transition-all"
          >
            Cancel
          </button>
        }
      >
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-4">
            {[1, 3, 5].map(s => (
              <button
                key={s}
                onClick={() => addDelay(s * 1000)}
                className="py-6 bg-ps-blue/20 hover:bg-ps-blue border border-ps-blue/30 text-white rounded-2xl font-black text-2xl transition-all shadow-lg"
              >
                {s}s
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <p className="label-caps !text-zinc-500">Custom Delay (milliseconds)</p>
            <div className="flex space-x-4">
              <input
                type="number"
                placeholder="e.g. 2500"
                value={customDelay}
                onChange={(e) => setCustomDelay(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-mono text-2xl focus:border-ps-blue outline-none transition-all"
              />
              <button
                onClick={() => customDelay && addDelay(parseInt(customDelay))}
                className="px-10 bg-ps-blue text-white rounded-2xl font-black uppercase italic tracking-tighter text-xl shadow-2xl hover:bg-ps-blue/80 transition-all"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

const LogViewer = ({ logs }) => {
  const scrollRef = useRef(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNewLogs, setHasNewLogs] = useState(false)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const atBottom = scrollHeight - scrollTop - clientHeight < 100
    setIsAtBottom(atBottom)
    if (atBottom) setHasNewLogs(false)
  }

  useEffect(() => {
    if (isAtBottom) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' })
    } else {
      setHasNewLogs(true)
    }
  }, [logs, isAtBottom])

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    setIsAtBottom(true)
    setHasNewLogs(false)
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col relative group h-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 custom-scrollbar scroll-smooth"
      >
        {logs.map((log, i) => (
          <div key={i} className="flex space-x-3 opacity-90 border-l-2 border-transparent hover:border-ps-blue hover:bg-white/5 px-2 transition-all">
            <span className="text-zinc-600 select-none font-bold shrink-0 w-8">{i + 1}</span>
            <span className="text-ps-blue/60 font-bold">»</span>
            <span className="text-zinc-300 break-all leading-relaxed">{log}</span>
          </div>
        ))}
      </div>

      {!isAtBottom && hasNewLogs && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-ps-blue text-white rounded-full font-bold uppercase tracking-widest text-[10px] z-50 flex items-center space-x-2 border border-white/20 shadow-2xl animate-bounce"
        >
          <ChevronDown className="w-4 h-4" />
          <span>New Activity Below</span>
        </button>
      )}
    </div>
  )
}

const DonateView = () => {
  const donateUrl = 'https://github.com/itsPLK/ps5_next_menu/blob/main/DONATE.md';
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 md:space-y-12 animate-fade-in max-w-4xl mx-auto py-10 md:py-20">
      <div className="p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-red-600/10 border border-red-600/20 text-red-500 shadow-2xl">
        <Heart className="w-16 h-16 md:w-24 md:h-24 fill-current animate-pulse" />
      </div>
      <div className="space-y-4 md:space-y-6 px-4">
        <h3 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">Support <span className="text-red-500">Project</span></h3>
        <p className="text-lg md:text-2xl text-zinc-400 font-medium leading-relaxed italic">
          Maintaining Next Menu takes significant time and effort. Your support helps keep the project alive and free for everyone. It's much appreciated!
        </p>
      </div>

      {isPS5 ? (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-[0_0_60px_rgba(220,38,38,0.3)] mx-4">
          <QRCodeSVG value={donateUrl} size={isPS5 ? 250 : 180} level="H" />
        </div>
      ) : (
        <a
          href={donateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-10 md:px-16 py-6 md:py-8 bg-red-600 text-white text-xl md:text-3xl font-black uppercase rounded-2xl md:rounded-[2rem] hover:bg-red-500 transition-all transform active:scale-95 shadow-[0_0_50px_rgba(220,38,38,0.4)]"
        >
          View Donation Options
        </a>
      )}
    </div>
  )
}

const SettingsView = ({ config, onSaveConfig, isPS5, logs, setLogs }) => {
  const [showLogs, setShowLogs] = useState(false)

  const autoOpen = config.AUTO_BROWSER_OPEN !== false
  const autoloadDelay = config.AUTOLOAD_DELAY || 5

  useEffect(() => {
    if (!showLogs) return
    const eventSource = new EventSource('/events')
    eventSource.onmessage = (e) => {
      setLogs(prev => [...prev, e.data].slice(-100))
    }
    return () => eventSource.close()
  }, [showLogs])

  return (
    <div className="space-y-12 animate-fade-in pb-32">
      <h2 className="text-4xl font-extrabold text-white tracking-tight">
        System <span className="text-ps-blue">Settings</span>
      </h2>

      <div className={cn(
        "grid gap-8",
        isPS5 ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2"
      )}>
        {/* Startup Settings */}
        <div className="glass-card p-10 rounded-ps-2xl space-y-8 border-white/10 flex flex-col">
          <h3 className="label-caps !text-white !opacity-100 flex items-center space-x-3">
            <Zap className="w-6 h-6 text-ps-blue" />
            <span>Startup & Automation</span>
          </h3>

          <div className="space-y-8 flex-1">
            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
              <div className="space-y-1">
                <p className="font-bold text-white uppercase text-sm tracking-tight">Auto-open Browser</p>
                <p className="text-xs text-zinc-500 max-w-[200px]">Launch browser to this menu on startup.</p>
              </div>
              <button
                onClick={() => onSaveConfig({ AUTO_BROWSER_OPEN: !autoOpen })}
                className={cn(
                  "w-16 h-8 rounded-full transition-all relative overflow-hidden p-1",
                  autoOpen ? "bg-ps-blue" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "w-6 h-6 bg-white rounded-full transition-all shadow-lg",
                  autoOpen ? "translate-x-8" : "translate-x-0"
                )} />
              </button>
            </div>

            <div className="space-y-6 p-6 bg-white/5 rounded-2xl border border-white/10 transition-all">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="font-bold text-white uppercase text-sm tracking-tight">Autoload Delay</p>
                  <p className="text-xs text-zinc-500">Wait time before sequence starts.</p>
                </div>
                <span className="text-ps-blue font-black text-2xl">{autoloadDelay}s</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[3, 5, 10].map(s => (
                  <button
                    key={s}
                    onClick={() => onSaveConfig({ AUTOLOAD_DELAY: s })}
                    className={cn(
                      "py-3 rounded-xl font-bold transition-all border",
                      autoloadDelay === s
                        ? "bg-ps-blue border-ps-blue text-white shadow-lg shadow-ps-blue/20"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                    )}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Tools */}
        <div className="glass-card p-10 rounded-ps-2xl space-y-8 border-white/10 flex flex-col">
          <h3 className="label-caps !text-white !opacity-100 flex items-center space-x-3">
            <Terminal className="w-6 h-6 text-ps-blue" />
            <span>Diagnostics</span>
          </h3>

          <div className="flex-1 space-y-6">
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
              View real-time output from the Next Menu background service for debugging.
            </p>

            <button
              onClick={() => setShowLogs(true)}
              className="w-full py-6 rounded-2xl font-black uppercase italic tracking-tighter text-xl transition-all shadow-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10"
            >
              Log Viewer
            </button>
          </div>
        </div>
      </div>

      {showLogs && (
        <div className="fixed inset-0 z-[2000] bg-black flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/80 backdrop-blur-md">
            <h3 className="label-caps !text-white !opacity-100 flex items-center space-x-3">
              <Terminal className="w-6 h-6 text-ps-blue" />
              <span>Next Menu Logs</span>
            </h3>
            <button
              onClick={() => setShowLogs(false)}
              className="p-3 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white transition-all border border-white/10"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <LogViewer logs={logs} />
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [view, setView] = useState('dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [showMobileLogs, setShowMobileLogs] = useState(false)
  const [autoloadStatus, setAutoloadStatus] = useState(null)
  const [logs, setLogs] = useState([])
  const [payloads, setPayloads] = useState([])
  const [config, setConfig] = useState({})
  const [ip, setIp] = useState('0.0.0.0')
  const [version, setVersion] = useState('Loading...')
  const [loading, setLoading] = useState(false)
  const [activeLoadingName, setActiveLoadingName] = useState('')
  const [toasts, setToasts] = useState([])
  const [loadingPayloads, setLoadingPayloads] = useState(true)
  const [downloadModal, setDownloadModal] = useState({ show: false, name: '', progress: 0 })
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null })

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const api = async (endpoint, options = {}) => {
    try {
      const response = await fetch(endpoint, options)
      if (options.method === 'POST') return response.text()
      try {
        const text = await response.text()
        if (text.toLowerCase().includes('<!doctype')) return null
        return JSON.parse(text)
      } catch (e) { return null }
    } catch (e) { return null }
  }

  const refreshPayloads = async (retryCount = 0) => {
    setLoadingPayloads(true)
    const data = await api('/list_payloads')
    if (data?.payloads) {
      setPayloads(data.payloads)
      setLoadingPayloads(false)
    } else if (retryCount < 5) {
      setTimeout(() => refreshPayloads(retryCount + 1), 1000)
    } else {
      setLoadingPayloads(false)
    }
  }

  const refreshConfig = async () => {
    const data = await api('/get_config')
    if (data) setConfig(data)
  }

  const handleAbort = async () => {
    await fetch('/abort').catch(() => { })
    setAutoloadStatus(prev => prev ? { ...prev, remaining: -1 } : null)
    addToast("Sequence Aborted", "error")
  }

  const handleFinish = async () => {
    await fetch('/autoload_clear').catch(() => { })
    setAutoloadStatus(null)
    window.location.reload()
  }

  const loadPayload = async (path) => {
    const name = path.split('/').pop().replace(/\.(elf|bin|lua)$/i, '').replace(/_/g, ' ')
    setLoading(true)
    setActiveLoadingName(name)
    try {
      await fetch(`/loadpayload:${path}`)
      addToast(`${name} launched`)
    } catch (e) { addToast("Launch failed", "error") }
    setTimeout(() => {
      setLoading(false)
      setActiveLoadingName('')
    }, 1500)
  }

  const handleDelete = (fileName) => {
    setConfirmModal({
      show: true,
      title: "Delete Payload",
      message: `Are you sure you want to remove ${fileName}?`,
      onConfirm: async () => {
        setConfirmModal({ show: false })
        await fetch(`/manage:delete?filename=${encodeURIComponent(fileName)}`)
        refreshPayloads()
        addToast(`${fileName} removed`)
      }
    })
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setDownloadModal({ show: true, name: file.name, progress: 20 })
    try {
      await fetch(`/manage:upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file
      })
      setDownloadModal(prev => ({ ...prev, progress: 100 }))
      addToast(`${file.name} uploaded`)
      refreshPayloads()
    } catch (e) { addToast("Upload failed", "error") }
    setTimeout(() => setDownloadModal({ show: false }), 800)
  }

  const handleInstall = async (p) => {
    setDownloadModal({ show: true, name: p.filename, progress: 10 })
    try {
      const elfRes = await fetch(p.url)
      if (!elfRes.ok) throw new Error('Failed to fetch payload from source')
      setDownloadModal(prev => ({ ...prev, progress: 50 }))

      const buffer = await elfRes.arrayBuffer()
      setDownloadModal(prev => ({ ...prev, progress: 70 }))

      const pushRes = await fetch(
        `/repository_install_push?filename=${encodeURIComponent(p.filename)}`,
        { method: 'POST', body: buffer }
      )
      setDownloadModal(prev => ({ ...prev, progress: 90 }))

      const data = await pushRes.json().catch(() => null)
      if (pushRes.ok && data?.ok) {
        setDownloadModal(prev => ({ ...prev, progress: 100 }))
        addToast(`${p.filename} installed`)
        refreshPayloads()
      } else throw new Error(data?.message || 'Install failed')
    } catch (e) { addToast(e.message || 'Installation failed', 'error') }
    setTimeout(() => setDownloadModal({ show: false }), 800)
  }

  const handleSaveConfig = async (newConfig) => {
    const merged = { ...config, ...newConfig }
    const success = await api('/set_config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged)
    })
    if (success) {
      refreshConfig()
      return true
    } else {
      addToast("Save failed", "error")
      return false
    }
  }

  useEffect(() => {
    const init = async () => {
      const ipRes = await fetch('/getip').then(r => r.text()).catch(() => '0.0.0.0')
      setIp(ipRes.toLowerCase().includes('<!doctype') ? '192.168.1.133' : ipRes)
      const verRes = await fetch('/version').then(r => r.text()).catch(() => '?')
      setVersion(verRes.toLowerCase().includes('<!doctype') ? '1.0.0-dev' : verRes)
      refreshPayloads()
      refreshConfig()
    }
    init()
  }, [])

  useEffect(() => {
    if (view === 'autoload' || view === 'storage') {
      refreshConfig()
      refreshPayloads()
    }
  }, [view])
  useEffect(() => {
    let statusTimeout
    const poll = async () => {
      try {
        const res = await fetch('/autoload_status')
        if (res.ok) {
          const data = await res.json()
          setAutoloadStatus(data)

          // Poll as long as countdown is active OR sequence is executing (not yet DONE)
          const isActive = data && (data.remaining >= 0 && data.current !== 'DONE')
          if (isActive) {
            // Poll faster during active execution
            const delay = (data.remaining > 0) ? 1000 : 500
            statusTimeout = setTimeout(poll, delay)
          }
        }
      } catch (e) { }
    }
    poll()
    return () => clearTimeout(statusTimeout)
  }, [])


  return (
    <div className={cn(
      "min-h-screen ps5-bg text-zinc-100 font-ps5 flex",
      isPS5 ? "flex-row overflow-hidden" : "flex-col md:flex-row md:overflow-hidden"
    )}>
      {/* Toast Container */}
      <div className="fixed top-0 right-0 p-8 z-[2000] space-y-4 pointer-events-none">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* Modals */}
      <Modal show={downloadModal.show} title="Processing Payload" onClose={() => { }}>
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <span className="text-ps-blue font-black uppercase italic tracking-tighter text-2xl">{downloadModal.name}</span>
            <span className="text-white font-bold text-xl">{downloadModal.progress}%</span>
          </div>
          <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div className="h-full bg-ps-blue rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(0,112,209,0.5)]" style={{ width: `${downloadModal.progress}%` }} />
          </div>
        </div>
      </Modal>

      <Modal
        show={confirmModal.show}
        title={confirmModal.title}
        onClose={() => setConfirmModal({ show: false })}
        footer={
          <>
            <button onClick={() => setConfirmModal({ show: false })} className="flex-1 px-8 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all uppercase tracking-tight">Cancel</button>
            <button onClick={confirmModal.onConfirm} className="flex-1 px-8 py-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all uppercase tracking-tight shadow-xl shadow-red-900/20">Confirm</button>
          </>
        }
      >
        {confirmModal.message}
      </Modal>

      {autoloadStatus && autoloadStatus.remaining >= 0 && (
        <AutoloadOverlay status={autoloadStatus} onCancel={handleAbort} onFinish={handleFinish} isPS5={isPS5} />
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className={cn(
        "flex-col bg-black/40 backdrop-blur-3xl border-r border-white/5 transition-all duration-500 z-[100] h-screen shadow-[10px_0_30px_rgba(0,0,0,0.5)]",
        isPS5 ? "flex" : "hidden md:flex",
        sidebarExpanded ? "w-80" : "w-24"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center mb-12 h-10">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-3 bg-white/5 hover:bg-ps-blue hover:text-white rounded-xl transition-all mr-4 shrink-0"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className={cn("flex items-center space-x-3 transition-all duration-500", sidebarExpanded ? "opacity-100 scale-100" : "opacity-0 scale-90 absolute pointer-events-none")}>
              <div className="p-2 bg-ps-blue rounded-xl shadow-[0_0_20px_rgba(0,112,209,0.3)]">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Next<span className="text-ps-blue">Menu</span></span>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <NavButton sidebar sidebarExpanded={sidebarExpanded} active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={LayoutDashboard} label="Dashboard" />
            <NavButton sidebar sidebarExpanded={sidebarExpanded} active={view === 'storage'} onClick={() => setView('storage')} icon={Database} label="Manage Payloads" />
            <NavButton sidebar sidebarExpanded={sidebarExpanded} active={view === 'autoload'} onClick={() => setView('autoload')} icon={RefreshCw} label="Autoload" />
            <NavButton sidebar sidebarExpanded={sidebarExpanded} active={view === 'settings'} onClick={() => setView('settings')} icon={Settings} label="Settings" />
          </nav>

          <div className="pt-6 border-t border-white/5">
            <NavButton
              sidebar
              sidebarExpanded={sidebarExpanded}
              active={view === 'donate'}
              onClick={() => setView('donate')}
              icon={Heart}
              label="Donate"
              className={view === 'donate' ? "bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)]" : "text-red-500 hover:bg-red-600/10"}
            />
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className={cn(
        "fixed bottom-0 inset-x-0 z-[100] bg-black/80 backdrop-blur-2xl border-t border-white/5 h-20 flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]",
        isPS5 ? "hidden" : "md:hidden"
      )}>
        <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={LayoutDashboard} label="Dashboard" mobileLabel="HOME" />
        <NavButton showSeparator active={view === 'storage'} onClick={() => setView('storage')} icon={Database} label="Manage Payloads" mobileLabel="MANAGE" />
        <NavButton showSeparator active={view === 'autoload'} onClick={() => setView('autoload')} icon={RefreshCw} label="Autoload" mobileLabel="AUTO" />
        <NavButton showSeparator active={view === 'settings'} onClick={() => setView('settings')} icon={Settings} label="Settings" mobileLabel="SETTINGS" />
        <NavButton
          showSeparator
          active={view === 'donate'}
          onClick={() => setView('donate')}
          icon={Heart}
          label="Donate"
          mobileLabel="DONATE"
        />
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className={cn(
        "flex flex-col relative",
        isPS5 ? "h-screen flex-1 min-h-0" : "md:h-screen md:flex-1 md:min-h-0"
      )}>
        <main className={cn(
          "custom-scrollbar pb-24 md:pb-16 max-w-[1800px] mx-auto w-full flex flex-col",
          isPS5 ? "p-16 flex-1 overflow-y-auto" : "p-6 md:p-16 md:flex-1 md:overflow-y-auto"
        )}>
          {view === 'dashboard' && (
            <div className="space-y-8 md:space-y-12">
              <h2 className="text-4xl font-extrabold text-white tracking-tight">
                Launch <span className="text-ps-blue">Payload</span>
              </h2>
              <div className={cn(
                "grid gap-4 md:gap-6",
                isPS5 ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}>
                {loadingPayloads ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="glass-card p-6 rounded-ps-xl flex flex-col space-y-2 border-white/5 animate-pulse">
                      <div className="h-7 w-40 bg-white/5 rounded-lg" />
                      <div className="h-3 w-20 bg-white/5 rounded-md opacity-50" />
                    </div>
                  ))
                ) : payloads.length === 0 ? (
                  <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-ps-xl flex flex-col items-center justify-center space-y-6 bg-white/[0.01]">
                    <Package className="w-16 h-16 text-white/10" />
                    <div className="text-center">
                      <p className="text-white font-extrabold tracking-tight text-2xl">Empty Library</p>
                      <p className="text-zinc-500 font-medium">Add payloads from the Cloud Hub to get started.</p>
                    </div>
                    <button onClick={() => setView('storage')} className="px-8 py-3 bg-ps-blue text-white rounded-xl font-bold tracking-tight shadow-xl shadow-ps-blue/20">Open Repository</button>
                  </div>
                ) : (
                  payloads.map((p, i) => (
                    <PayloadButton
                      key={i}
                      path={p}
                      onClick={() => loadPayload(p)}
                      isLoading={loading && activeLoadingName === p.split('/').pop().replace(/\.(elf|bin|lua)$/i, '').replace(/_/g, ' ')}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'storage' && (
            <StorageHub payloads={payloads} onInstall={handleInstall} onDelete={handleDelete} onUpload={handleUpload} ip={ip} />
          )}

          {view === 'autoload' && (
            <AutoloadView payloads={payloads} config={config} onSaveConfig={handleSaveConfig} onToast={addToast} />
          )}

          {view === 'settings' && (
            <SettingsView config={config} onSaveConfig={handleSaveConfig} isPS5={isPS5} logs={logs} setLogs={setLogs} />
          )}
          {view === 'donate' && <DonateView />}
        </main>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-ps-black/95 z-[9999] flex flex-col items-center justify-center space-y-12">
          <div className="ps5-robust-spinner" />
          <div className="text-center">
            <h4 className="text-4xl font-extrabold text-white tracking-tight mb-4 uppercase italic">{activeLoadingName || "Engaging Core"}</h4>
            <p className="label-caps !text-ps-blue tracking-[0.3em] font-black">LAUNCHING PAYLOAD...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
