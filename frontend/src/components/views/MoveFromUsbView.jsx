import React, { useState, useEffect } from 'react'
import { ArrowLeft, HardDrive, Cpu, AlertTriangle, CheckCircle2, Loader2, Info, Usb } from 'lucide-react'
import { cn } from '../../utils/helpers'

const MoveFromUsbView = ({ path, onBack, onComplete, addToast }) => {
  const [status, setStatus] = useState('loading')
  const [details, setDetails] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    checkPayload()
  }, [path])

  const checkPayload = async () => {
    setStatus('loading')
    try {
      const res = await fetch(`/usb_move_check?path=${encodeURIComponent(path)}`)
      const data = await res.json()
      if (data.error) {
        setErrorMsg(data.error)
        setStatus('error')
      } else {
        setDetails(data)
        if (data.status === 'exists_same') setStatus('exists_same')
        else if (data.status === 'exists_different' || data.folder_exists) setStatus('exists_different')
        else setStatus('confirm')
      }
    } catch (e) {
      setErrorMsg("No se pudo conectar con el backend")
      setStatus('error')
    }
  }

  const performMove = async (overwrite = false, keepOriginal = false) => {
    setStatus('processing')
    try {
      const res = await fetch(`/usb_move_perform?path=${encodeURIComponent(path)}&overwrite=${overwrite}&keep_original=${keepOriginal}`)
      const data = await res.json()
      if (data.error) {
        setErrorMsg(data.error)
        setStatus('error')
      } else {
        setStatus('success')
        addToast(data.warning || (keepOriginal ? "Payload copiado a la memoria interna" : "Payload movido a la memoria interna"))
        setTimeout(() => {
          onComplete()
        }, 2000)
      }
    } catch (e) {
      setErrorMsg("La operación falló")
      setStatus('error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      <button onClick={onBack} className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors group">
        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold uppercase tracking-widest text-sm">Volver a Gestión</span>
      </button>

      <div className="space-y-4">
        <h2 className="text-4xl font-extrabold text-white tracking-tight">
          Importar <span className="text-ps-blue">a Memoria Interna</span>
        </h2>
        <p className="text-zinc-500 max-w-2xl">Importa el payload seleccionado desde tu USB a la memoria interna de la PS5.</p>
      </div>

      <div className="glass-card p-6 md:p-10 rounded-ps-3xl border-white/10 bg-white/[0.02] space-y-8 md:space-y-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8 text-center sm:text-left">
          <div className="p-4 md:p-6 bg-ps-blue/20 rounded-3xl border border-ps-blue/30 shrink-0">
            <Usb className="w-8 h-8 md:w-10 md:h-10 text-ps-blue" />
          </div>
          <div className="space-y-1 md:space-y-2 min-w-0 flex-1">
            <p className="label-caps !text-ps-blue">Ruta de Origen</p>
            <p className="text-xl md:text-2xl font-black text-white italic tracking-tight truncate w-full">{path}</p>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {status === 'loading' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-12 h-12 text-ps-blue animate-spin" />
            <p className="label-caps animate-pulse text-zinc-500">Comprobando memoria interna...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-6">
            <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
            <div className="space-y-2">
              <p className="text-lg font-bold text-white">Algo salió mal</p>
              <p className="text-red-400/80 leading-relaxed">{errorMsg}</p>
              <button onClick={checkPayload} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-sm">Reintentar</button>
            </div>
          </div>
        )}

        {status === 'exists_same' && (
          <div className="space-y-6 md:space-y-8">
            <div className="p-6 md:p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
              <div className="space-y-2">
                <p className="text-lg font-bold text-white">Ya existe un archivo idéntico</p>
                <p className="text-sm md:text-lg text-emerald-400/80 leading-relaxed">
                  Ya tienes un payload con el mismo nombre y contenido (SHA256: {details?.sha256?.substring(0, 12)}...) en tu biblioteca interna. No es necesario hacer nada.
                </p>
              </div>
            </div>
            <button onClick={onBack} className="w-full py-4 md:py-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase italic text-lg md:text-xl transition-all border border-white/10">Volver a Storage Hub</button>
          </div>
        )}

        {status === 'exists_different' && (
          <div className="space-y-6 md:space-y-8">
            <div className="p-6 md:p-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
              <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
              <div className="space-y-2">
                <p className="text-lg font-bold text-white">Versión anterior detectada</p>
                <p className="text-sm md:text-lg text-amber-400/80 leading-relaxed">
                  Ya existe una versión de <strong>{details?.folder_name || details?.filename}</strong> en la memoria interna. Importar esta la reemplazará. ¿Quieres continuar?
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onBack} className="flex-1 py-4 md:py-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase transition-all">Cancelar</button>
              <div className="flex flex-1 gap-2">
                <button onClick={() => performMove(true, true)} className="flex-1 py-4 md:py-6 rounded-2xl bg-ps-blue/50 hover:bg-ps-blue/70 text-white font-black uppercase italic text-sm md:text-lg transition-all border border-ps-blue/30">Sobrescribir y Copiar</button>
                <button onClick={() => performMove(true, false)} className="flex-1 py-4 md:py-6 rounded-2xl bg-ps-blue hover:bg-ps-blue/80 text-white font-black uppercase italic text-sm md:text-lg transition-all shadow-xl shadow-ps-blue/20">Sobrescribir y Mover</button>
              </div>
            </div>
          </div>
        )}

        {status === 'confirm' && (
          <div className="space-y-6 md:space-y-8">
            <div className="p-6 md:p-8 bg-ps-blue/5 border border-ps-blue/10 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
              <Info className="w-8 h-8 text-ps-blue shrink-0" />
              <div className="space-y-2">
                <p className="text-lg font-bold text-white">Listo para importar</p>
                <p className="text-sm md:text-lg text-zinc-400 leading-relaxed">
                  El payload se importará a la memoria interna. Puedes copiarlo (manteniendo el original en USB) o moverlo (eliminando el original).
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => performMove(false, true)} className="flex-1 py-4 md:py-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black uppercase italic text-lg md:text-xl transition-all border border-white/20">Copiar a Interna</button>
              <button onClick={() => performMove(false, false)} className="flex-1 py-4 md:py-6 rounded-2xl bg-ps-blue hover:bg-ps-blue/80 text-white font-black uppercase italic text-lg md:text-xl transition-all shadow-2xl shadow-ps-blue/30">Mover a Interna</button>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className="py-20 flex flex-col items-center justify-center space-y-8 text-center">
            <div className="ps5-robust-spinner" />
            <div className="space-y-2">
              <p className="text-2xl font-black text-white uppercase italic tracking-tighter animate-pulse">Importando Payload...</p>
              <p className="text-zinc-500">Copiando datos y verificando integridad.</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="py-20 flex flex-col items-center justify-center space-y-8 text-center">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-black text-white uppercase italic tracking-tighter">¡Éxito!</p>
              <p className="text-zinc-500">El payload se ha importado correctamente a la memoria interna.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MoveFromUsbView