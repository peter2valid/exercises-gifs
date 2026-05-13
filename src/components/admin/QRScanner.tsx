'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface CheckInResult {
  ok: boolean;
  memberId?: string;
  checkedInAt?: string;
  error?: string;
}

interface Props {
  gymId: string;
  gymName: string;
}

type ScannerState = 'idle' | 'requesting' | 'scanning' | 'processing' | 'denied';

export function QRScanner({ gymId, gymName }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanRef = useRef<string | null>(null); // prevent double-fire on same code

  const [state, setState] = useState<ScannerState>('idle');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const handleQrFound = useCallback(async (payload: string) => {
    if (lastScanRef.current === payload || cooldown) return;
    lastScanRef.current = payload;
    setState('processing');
    setCooldown(true);

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrPayload: payload, gymId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, memberId: data.checkIn.member_user_id, checkedInAt: data.checkIn.checked_in_at });
      } else {
        setResult({ ok: false, error: data.error ?? 'Check-in failed' });
      }
    } catch {
      setResult({ ok: false, error: 'Network error' });
    } finally {
      setState('scanning');
      // Clear result and cooldown after 4s
      setTimeout(() => {
        setResult(null);
        setCooldown(false);
        lastScanRef.current = null;
      }, 4000);
    }
  }, [gymId, cooldown]);

  const startCamera = useCallback(async () => {
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('scanning');

      // Load jsqr dynamically (avoids SSR issues)
      const jsQR = (await import('jsqr')).default;

      const scan = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { rafRef.current = requestAnimationFrame(scan); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) handleQrFound(code.data);
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setState(msg.includes('denied') || msg.includes('Permission') ? 'denied' : 'idle');
    }
  }, [handleQrFound]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      {/* Scanner viewport */}
      <div className="relative a-card p-0 overflow-hidden" style={{ aspectRatio: '4/3', background: '#000' }}>
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${state === 'scanning' || state === 'processing' ? 'block' : 'hidden'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay: scanner frame */}
        {(state === 'scanning' || state === 'processing') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-52 h-52">
              {/* Corner markers */}
              {['tl','tr','bl','br'].map(pos => (
                <div key={pos} className={`absolute w-8 h-8 border-[3px] border-white/80 ${
                  pos === 'tl' ? 'top-0 left-0 border-r-0 border-b-0 rounded-tl-lg' :
                  pos === 'tr' ? 'top-0 right-0 border-l-0 border-b-0 rounded-tr-lg' :
                  pos === 'bl' ? 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg' :
                  'bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg'
                }`} />
              ))}
            </div>
          </div>
        )}

        {/* Processing overlay */}
        {state === 'processing' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 size={32} className="text-white animate-spin" />
          </div>
        )}

        {/* Idle / permission denied states */}
        {state === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Camera size={40} className="text-[#555]" />
            <button
              onClick={startCamera}
              className="px-5 py-2.5 rounded-xl bg-[#3b82f6] text-white text-sm font-semibold"
            >
              Start scanner
            </button>
          </div>
        )}
        {state === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="text-[#555] animate-spin" />
            <p className="text-sm text-[#555]">Requesting camera…</p>
          </div>
        )}
        {state === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <CameraOff size={28} className="text-[#ef4444]" />
            <p className="text-sm text-[#909090]">Camera access denied.</p>
            <p className="text-xs text-[#555]">Enable camera permissions in your browser settings, then reload.</p>
          </div>
        )}
      </div>

      {/* Result banner */}
      {result && (
        <div className={`a-card flex items-start gap-3 ${result.ok ? 'border-[#22c55e]/40 bg-[#22c55e]/5' : 'border-[#ef4444]/40 bg-[#ef4444]/5'}`}>
          {result.ok
            ? <CheckCircle2 size={20} className="text-[#22c55e] shrink-0 mt-0.5" />
            : <XCircle size={20} className="text-[#ef4444] shrink-0 mt-0.5" />}
          <div>
            {result.ok ? (
              <>
                <p className="text-sm font-semibold text-[#e8e8e8]">Checked in!</p>
                <p className="text-xs text-[#909090] mt-0.5">
                  Member {result.memberId?.slice(0, 8).toUpperCase()} ·{' '}
                  {result.checkedInAt ? new Date(result.checkedInAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#e8e8e8]">Check-in failed</p>
                <p className="text-xs text-[#909090] mt-0.5">{result.error}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      {(state === 'scanning' || state === 'processing') && (
        <button
          onClick={() => { stopCamera(); setState('idle'); setResult(null); lastScanRef.current = null; }}
          className="flex items-center gap-2 text-sm text-[#555] hover:text-[#909090] transition-colors"
        >
          <RefreshCw size={14} /> Stop scanner
        </button>
      )}

      <p className="text-[12px] text-[#444]">Checking in to: {gymName}</p>
    </div>
  );
}
