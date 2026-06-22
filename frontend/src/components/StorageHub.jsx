import React, { useState, useEffect, useMemo } from 'react'
import { CloudDownload, Upload, Package, Database, RefreshCw, Trash2, Loader2, AlertTriangle, HardDrive, Usb, ChevronDown, Globe } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { cn, isPS5, isIOS, parsePayloadName } from '../../utils/helpers'
import PayloadName from '../ui/PayloadName'

const StorageHub = ({ payloads, payloadMeta, onInstall, onDelete, onUpload, onImportFromUsb, config, ip, scrollTarget, onClearScrollTarget }) => {
  const multiSources = config?.MULTI_SOURCES_ENABLED === true

  const [repoData, setRepoData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [expandedSource, setExpandedSource] = useState(null)

  const fetchRemote = async (force = false) => {
    setLoading(true)
    setError(false)
    try {
      const endpoint = force ? '/repository_refresh' : '/repository_payloads'
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRepoData(data)

      if (data?.sources?.length > 0 && expandedSource === null) {
        const first = data.sources.find(s => s.payloads?.length > 0)
        if (first) setExpandedSource(first.id)
      }

      if (!force && data?.last_update) {
        const now = Math.floor(Date.now() / 1000)
        if (now - Number(data.last_update) > 24 * 60 * 60) {
          await fetchRemote(true)
          return
        }
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRemote() }, [])

  useEffect(() => {
    if (scrollTarget) {
      const timer = setTimeout(() => {
        const element = document.getElementById(scrollTarget);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
        if (onClearScrollTarget) onClearScrollTarget();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [scrollTarget]);

  const localFilenames = useMemo(() => payloads.map(p => p.split('/').pop()), [payloads])
  const internalPayloads = payloads.filter(p => !p.includes('/mnt/usb'))

  const getBaseName = (filename) => {
    if (!filename) return '';
    let clean = filename.replace(/\.(elf|bin)$/i, '');
    const versionMatch = clean.match(/[_-]v?(\d+[\d.a-z-]+)/i);
    if (versionMatch) clean = clean.replace(versionMatch[0], '');
    return clean.replace(/[_-]ps[45]$/i, '');
  }

  const enrichPayloads = (list) =>
    list.map(p => {
      const isInstalled = p.filename ? localFilenames.includes(p.filename) : false
      const baseName = getBaseName(p.filename)
      const installedVersion = localFilenames.find(f => getBaseName(f) === baseName)
      const isUpdate = !isInstalled && !!installedVersion
      return { ...p, isInstalled, isUpdate, installedFilename: installedVersion }
    }).sort((a, b) => {
      if (a.isUpdate && !b.isUpdate) return -1
      if (!a.isUpdate && b.isUpdate) return 1
      
      const nameA = (a.name || a.filename || '').toLowerCase()
      const nameB = (b.name || b.filename || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

  const enrichedSources = useMemo(() => {
    if (multiSources && repoData?.sources) {
      return repoData.sources.map(src => ({
        ...src,
        id: src.id || src.url,
        payloads: enrichPayloads(src.payloads || [])
      }))
    } else if (!multiSources && repoData?.payloads) {
      return [{
        id: 'legacy-repo',
        name: 'Repositorio Predeterminado',
        url: repoData.repo_url || '',
        last_update: repoData.last_update || 0,
        payloads: enrichPayloads(repoData.payloads)
      }]
    }
    return []
  }, [repoData, multiSources, localFilenames])

  const legacyRepoUrl = repoData?.repo_url || ''

  const getSourceBadge = (fileName) => {
    if (!multiSources || !payloadMeta) return null
    const meta = payloadMeta[fileName]
    return meta?.source_name || meta?.install_source_detail || null
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <h2 className="text-4xl font-extrabold text-white tracking-tight">
          Gestión de <span className="text-ps-blue">Payloads</span>
        </h2>

        {!isPS5 && (
          <label className="inline-flex items-center space-x-4 px-10 py-5 bg-ps-blue hover:bg-ps-blue/80 text-white rounded-[1.25rem] font-bold tracking-tight text-xl cursor-pointer transition-all shrink-0 transform active:scale-95">
            <Upload className="w-7 h-7" />
            <span>Subir Payload ELF</span>
            <input type="file" className="hidden" onChange={onUpload} accept={isIOS ? undefined : ".elf,.bin"} />
          </label>
        )}
      </div>

      {/* Installed Payloads Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="label-caps !text-white flex items-center space-x-4 text-lg">
            <Database className="w-6 h-6 text-ps-blue" />
            <span>Payloads Instalados</span>
          </h3>
          <span className="bg-white/5 px-4 py-1 rounded-full text-zinc-500 font-bold text-xs">
            {internalPayloads.length} Archivos
          </span>
        </div>

        <div className={cn("grid gap-4", isPS5 ? "grid-cols-2" : "grid-cols-1 lg:grid-cols-2")}>
          {internalPayloads.length === 0 ? (
            <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-ps-3xl flex flex-col items-center justify-center space-y-4 bg-white/[0.01]">
              <Package className="w-16 h-16 text-white/5" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm italic">Biblioteca Vacía</p>
            </div>
          ) : (
            internalPayloads.map((path) => {
              const fileName = path.split('/').pop()
              const sourceBadge = getSourceBadge(fileName)
              const allRemote = enrichedSources.flatMap(s => s.payloads)
              const remoteMatch = allRemote.find(rp => rp.filename === fileName || rp.installedFilename === fileName)
              const remoteVersion = remoteMatch?.filename ? parsePayloadName(remoteMatch.filename).version : null
              return (
                <div key={path} className="group flex flex-col justify-center p-4 md:p-6 glass-card rounded-ps-2xl border-white/10 hover:border-ps-blue/30 gap-3 md:gap-4 relative overflow-hidden">
                  <div className="flex flex-row items-center justify-between w-full gap-4">
                    <div className="flex items-center space-x-4 md:space-x-6 min-w-0 flex-1">
                      <div className="p-3 md:p-4 bg-white/5 rounded-2xl group-hover:bg-ps-blue/10 transition-colors shrink-0">
                        <Package className="w-6 h-6 md:w-8 md:h-8 text-zinc-400 group-hover:text-ps-blue transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <PayloadName path={fileName} className="text-xl md:text-2xl text-white" stacked />
                        {sourceBadge && (
                          <div className="flex items-center gap-1 text-zinc-500 text-[11px] select-none font-medium">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{sourceBadge}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => onDelete(fileName)}
                        className="p-3 md:p-4 rounded-xl bg-red-950/20 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all"
                        title="Eliminar Payload"
                      >
                        <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                    </div>
                  </div>
                  {remoteMatch?.isUpdate && (
                    <button
                      onClick={() => onInstall(remoteMatch, remoteMatch.source_id, legacyRepoUrl)}
                      className="w-full flex items-center justify-center space-x-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs md:text-sm transition-all"
                    >
                      <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                      <span>Actualizar{remoteVersion ? ` (a v${remoteVersion.replace(/^v/i, '')})` : ''}</span>
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Cloud Repository Section */}
      <section id="cloud-repository" className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="label-caps !text-white flex items-center space-x-4 text-lg" >
            <CloudDownload className="w-6 h-6 text-ps-blue" />
            <span>Repositorio en la Nube</span>
          </h3>
          <button onClick={() => fetchRemote(true)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-ps-blue">
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>

        {loading && !repoData ? (
          <div className="py-24 glass-panel rounded-ps-3xl border-white/5 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-16 h-16 text-ps-blue animate-spin" />
            <p className="label-caps">Sincronizando con el Repositorio...</p>
          </div>
        ) : error ? (
          <div className="py-20 glass-card rounded-ps-3xl border-red-500/20 flex flex-col items-center justify-center space-y-6 bg-red-950/5">
            <AlertTriangle className="w-16 h-16 text-red-500 opacity-50" />
            <div className="text-center">
              <p className="text-xl font-bold text-white uppercase tracking-tight">Repositorio No Disponible</p>
              <p className="text-zinc-500 mt-1">Revisa tu conexión a internet e inténtalo de nuevo.</p>
            </div>
            <button onClick={() => fetchRemote(true)} className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold uppercase text-xs transition-all">Reintentar Conexión</button>
          </div>
        ) : enrichedSources.length > 0 ? (
          <div className="space-y-4">
            {enrichedSources.map(src => {
              const availablePayloads = src.payloads.filter(p => !p.isInstalled || p.isUpdate)
              const isExpanded = (enrichedSources.length === 1) || expandedSource === src.id

              return (
                <div key={src.id} className={cn(
                  multiSources ? "bg-ps-card border border-ps-border rounded-ps-3xl overflow-hidden" : "flex flex-col space-y-4"
                )}>
                  {multiSources && (
                    <button
                      onClick={() => setExpandedSource(isExpanded ? null : src.id)}
                      className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2.5 bg-ps-blue/10 rounded-xl">
                          <Globe className="w-5 h-5 text-ps-blue" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white text-lg">{src.name}</p>
                          {src.error && (
                            <p className="text-xs text-red-400 flex items-center space-x-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Error al obtener</span>
                            </p>
                          )}
                          {src.last_update > 0 && (
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
                              Actualizado {new Date(src.last_update * 1000).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 rounded-full bg-white/5 text-zinc-500 text-xs font-bold">
                          {availablePayloads.length} disponibles
                        </span>
                        {enrichedSources.length > 1 && (
                          <ChevronDown className={cn("w-5 h-5 text-zinc-500 transition-transform", isExpanded && "rotate-180")} />
                        )}
                      </div>
                    </button>
                  )}

                  {isExpanded && (
                    <div className={cn(
                      multiSources ? "border-t border-white/5 divide-y divide-white/5" : "grid grid-cols-1 gap-4"
                    )}>
                      {src.payloads.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-zinc-600">
                          <p className="text-sm font-bold uppercase tracking-widest italic">El repositorio está vacío</p>
                        </div>
                      ) : availablePayloads.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-zinc-600">
                          <p className="text-sm font-bold uppercase tracking-widest italic">Todos los payloads están instalados</p>
                        </div>
                      ) : (
                        availablePayloads.map(p => (
                          <div
                            key={p.filename}
                            className={cn(
                              "flex flex-col md:flex-row justify-between gap-4 md:gap-8 p-6 md:p-8 transition-all",
                              multiSources
                                ? "hover:bg-white/[0.03]"
                                : "glass-card rounded-ps-3xl border border-white/10 hover:border-ps-blue/20 bg-white/[0.01]",
                              isPS5 ? "flex-row items-center" : "items-start md:items-center"
                            )}
                          >
                            <div className="space-y-2 min-w-0">
                              <PayloadName path={p.filename} className="text-xl md:text-2xl text-white" stacked lastUpdate={p.last_update} />
                              {p.description && (
                                <p className="text-sm md:text-base text-zinc-400 font-medium leading-relaxed">{p.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => onInstall(p, src.id === 'legacy-repo' ? null : src.id, src.url)}
                              className={cn(
                                "flex items-center justify-center space-x-3 px-6 md:px-8 py-3 md:py-5 rounded-2xl font-bold text-lg transition-all shrink-0 transform active:scale-95",
                                isPS5 ? "w-auto px-12" : "w-full md:w-auto",
                                p.isUpdate
                                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                  : "bg-ps-blue hover:bg-ps-blue/80 text-white"
                              )}
                            >
                              <CloudDownload className="w-5 h-5 md:w-6 md:h-6" />
                              <span>{p.isUpdate ? "Actualizar" : "Instalar"}</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-20 border-2 border-dashed border-white/5 rounded-ps-3xl flex flex-col items-center justify-center space-y-4 bg-white/[0.01]">
            <CloudDownload className="w-16 h-16 text-white/5" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm italic">El repositorio está vacío</p>
          </div>
        )}
      </section>

      {/* USB Storage Section */}
      <section id="usb-storage" className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="label-caps !text-ps-blue flex items-center space-x-4 text-lg">
            <HardDrive className="w-6 h-6" />
            <span>Almacenamiento USB</span>
          </h3>
          <span className="bg-ps-blue/5 px-4 py-1 rounded-full text-ps-blue font-bold text-xs border border-ps-blue/20">
            {payloads.filter(p => p.includes('/mnt/usb')).length} Archivos
          </span>
        </div>

        <div className={cn("grid gap-4", isPS5 ? "grid-cols-2" : "grid-cols-1 lg:grid-cols-2")}>
          {payloads.filter(p => p.includes('/mnt/usb')).length === 0 ? (
            <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-ps-3xl flex flex-col items-center justify-center space-y-6 bg-white/[0.01]">
              <div className="relative">
                <HardDrive className="w-16 h-16 text-white/5" />
                {!config.SCAN_USB_PAYLOADS && (
                  <div className="absolute -top-1 -right-1 bg-amber-500/20 rounded-full p-1 border border-amber-500/50">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                )}
              </div>
              <div className="text-center space-y-2">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm italic">No se encontraron Payloads en USB</p>
                {!config.SCAN_USB_PAYLOADS && (
                  <p className="text-xs text-zinc-600 max-w-xs mx-auto leading-relaxed">
                    El escaneo extendido de USB está desactivado.<br />
                    Activa <strong>"Escanear Payloads USB"</strong> en Ajustes.
                  </p>
                )}
              </div>
            </div>
          ) : (
            payloads.filter(p => p.includes('/mnt/usb')).map((path) => {
              return (
                <div key={path} className="group flex flex-row items-center justify-between p-4 md:p-6 glass-card rounded-ps-2xl border-white/10 hover:border-ps-blue/30 gap-4">
                  <div className="flex items-center space-x-4 md:space-x-6 min-w-0">
                    <div className="p-3 md:p-4 bg-white/5 rounded-2xl group-hover:bg-ps-blue/10 transition-colors shrink-0">
                      <Usb className="w-6 h-6 md:w-8 md:h-8 text-zinc-400 group-hover:text-ps-blue transition-colors" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <PayloadName path={path} className="text-xl md:text-2xl text-white" stacked hideIcon={true} />
                      <p className="text-[10px] text-zinc-600 font-medium font-mono uppercase tracking-tighter opacity-60 truncate">{path}</p>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => onImportFromUsb(path)}
                      className="flex items-center space-x-2 md:space-x-3 px-4 md:px-6 py-3 md:py-4 bg-white/5 hover:bg-ps-blue text-white rounded-xl font-bold text-xs md:text-sm transition-all border border-white/10 hover:border-ps-blue group/btn"
                    >
                      <Database className="w-4 h-4 md:w-5 md:h-5 text-ps-blue group-hover/btn:text-white transition-colors" />
                      <span>Mover a Interno</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Footer Info for PS5 */}
      {isPS5 && (
        <div className={cn(
          "glass-card p-6 md:p-10 rounded-ps-3xl flex items-center gap-8 md:gap-12 border-white/10 bg-black/40 mt-12 md:mt-16",
          isPS5 ? "flex-row" : "flex-col md:flex-row"
        )}>
          <div className="flex flex-col items-center space-y-4 md:space-y-6 shrink-0">
            <div className="bg-white p-4 md:p-6 rounded-3xl">
              <QRCodeSVG value={`http://${ip}:8084`} size={isPS5 ? 160 : 120} level="M" />
            </div>
            <code className="text-white font-mono text-base md:text-lg font-black opacity-90 italic tracking-tight uppercase">{ip}:8084</code>
          </div>
          <div className="flex-1 space-y-3 md:space-y-4 text-center md:text-left">
            <h4 className="label-caps !text-white !opacity-100 text-xl md:text-2xl tracking-widest flex items-center justify-center md:justify-start space-x-3 md:space-x-4">
              <div className="w-1.5 h-6 md:w-2 md:h-8 bg-ps-blue rounded-full" />
              <span>Gestión Remota</span>
            </h4>
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed italic font-medium max-w-3xl">
              Accede a este panel desde tu PC o teléfono para gestionar y subir payloads desde tu red local.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default StorageHub