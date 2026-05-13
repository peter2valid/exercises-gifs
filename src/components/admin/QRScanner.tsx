'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, CheckCircle2, XCircle, Loader2, RefreshCw, Flashlight } from 'lucide-react';

// Native BarcodeDetector — in lib.dom.d.ts on TS 5.3+, declared here for older targets
declare class BarcodeDetector {
  static getSupportedFormats(): Promise<string[]>;
  constructor(options?: { formats: string[] });
  detect(image: ImageBitmapSource): Promise<{ rawValue: string }[]>;
}

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
  const lastScanRef = useRef<string | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const useNativeRef = useRef(false);
  const activeRef = useRef(false); // guards async scan loop on unmount

  const [state, setState] = useState<ScannerState>('idle');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [hitFlash, setHitFlash] = useState(false);

  const stopCamera = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleQrFound = useCallback(
    async (payload: string) => {
      if (lastScanRef.current === payload || cooldown) return;
      lastScanRef.current = payload;
      setState('processing');
      setCooldown(true);

      // Haptic + visual hit flash
      if (navigator.vibrate) navigator.vibrate(60);
      setHitFlash(true);
      setTimeout(() => setHitFlash(false), 300);

      try {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrPayload: payload, gymId }),
        });
        const data = await res.json();
        if (res.ok) {
          setResult({
            ok: true,
            memberId: data.checkIn.member_user_id,
            checkedInAt: data.checkIn.checked_in_at,
          });
        } else {
          setResult({ ok: false, error: data.error ?? 'Check-in failed' });
        }
      } catch {
        setResult({ ok: false, error: 'Network error' });
      } finally {
        setState('scanning');
        setTimeout(() => {
          setResult(null);
          setCooldown(false);
          lastScanRef.current = null;
        }, 4000);
      }
    },
    [gymId, cooldown],
  );

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const next = !torchOn;
      await (track as any).applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      // Torch not supported on this device
    }
  }, [torchOn]);

  const startCamera = useCallback(async () => {
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities() as any;
        if (caps?.torch) setHasTorch(true);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState('scanning');
      activeRef.current = true;

      // ── Tier 1: native BarcodeDetector (Chrome / Edge / Safari 17+) ─────────
      // Uses hardware-accelerated ML vision on device — far superior to JS decode
      // for low light, angled codes, and motion blur.
      if ('BarcodeDetector' in window) {
        try {
          const supported = await BarcodeDetector.getSupportedFormats();
          if (supported.includes('qr_code')) {
            detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
            useNativeRef.current = true;
          }
        } catch {
          // Browser reports API but throws — fall through
        }
      }

      if (useNativeRef.current && detectorRef.current) {
        const scanNative = async () => {
          if (!activeRef.current) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2 && !cooldown) {
            try {
              const codes = await detectorRef.current!.detect(video);
              if (codes.length > 0 && codes[0].rawValue) {
                handleQrFound(codes[0].rawValue);
              }
            } catch {
              // Frame not ready — skip silently
            }
          }
          // 15fps is plenty for user-held scanning; reduces CPU/battery
          setTimeout(() => {
            rafRef.current = requestAnimationFrame(scanNative);
          }, 67);
        };
        rafRef.current = requestAnimationFrame(scanNative);
      } else {
        // ── Tier 2: jsqr fallback (Firefox, older Safari) ────────────────────
        const jsQR = (await import('jsqr')).default;
        const scan = () => {
          if (!activeRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas || video.readyState < 2) {
            rafRef.current = requestAnimationFrame(scan);
            return;
          }
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          // willReadFrequently avoids repeated GPU→CPU readback overhead
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) { rafRef.current = requestAnimationFrame(scan); return; }
          ctx.drawImage(video, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // attemptBoth: handles white-on-black codes (printed inverted posters)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code?.data) handleQrFound(code.data);
          setTimeout(() => { rafRef.current = requestAnimationFrame(scan); }, 67);
        };
        rafRef.current = requestAnimationFrame(scan);
      }
    } catch (err: unknown) {
      const isDenied =
        err instanceof Error &&
        (err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError' ||
          err.message.toLowerCase().includes('denied') ||
          err.message.toLowerCase().includes('permission'));
      setState(isDenied ? 'denied' : 'idle');
    }
  }, [handleQrFound, cooldown]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const isLive = state === 'scanning' || state === 'processing';

  return (
    <div className="space-y-4">
      {/* Scanner viewport */}
      <div
        className="relative a-card p-0 overflow-hidden"
        style={{ aspectRatio: '4/3', background: '#000' }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${isLive ? 'block' : 'hidden'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Hit flash overlay */}
        {hitFlash && (
          <div className="absolute inset-0 bg-white/20 pointer-events-none" />
        )}

        {/* Overlay: scanner frame + scan line */}
        {isLive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-56 h-56">
              {/* Corner markers */}
              {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
                <div
                  key={pos}
                  className={`absolute w-8 h-8 border-[3px] border-white/90 transition-colors duration-300 ${
                    pos === 'tl' ? 'top-0 left-0 border-r-0 border-b-0 rounded-tl-lg' :
                    pos === 'tr' ? 'top-0 right-0 border-l-0 border-b-0 rounded-tr-lg' :
                    pos === 'bl' ? 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg' :
                                   'bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg'
                  } ${result?.ok ? '!border-emerald-400' : result ? '!border-red-400' : ''}`}
                />
              ))}

              {/* Scanning line */}
              {state === 'scanning' && !result && (
                <div className="absolute inset-x-2 overflow-hidden" style={{ top: 4, bottom: 4 }}>
                  <div
                    className="absolute left-0 right-0 h-[2px] rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
                      boxShadow: '0 0 8px 2px rgba(255,255,255,0.4)',
                      animation: 'qr-scan-line 1.8s ease-in-out infinite',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Torch button */}
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`absolute bottom-4 right-4 p-2 rounded-full transition-all pointer-events-auto ${
                  torchOn ? 'bg-yellow-400/20 text-yellow-300' : 'bg-white/10 text-white/50'
                }`}
              >
                <Flashlight size={18} />
              </button>
            )}
          </div>
        )}

        {/* Processing overlay */}
        {state === 'processing' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
            <Loader2 size={32} className="text-white animate-spin" />
          </div>
        )}

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
            <p className="text-xs text-[#555]">Enable camera permissions in your browser settings, then try again.</p>
            <button
              onClick={startCamera}
              className="mt-2 px-4 py-2 rounded-lg bg-[#262626] text-[#e8e8e8] text-[12px] font-semibold hover:bg-[#333] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Result banner */}
      {result && (
        <div
          className={`a-card flex items-start gap-3 ${
            result.ok ? 'border-[#22c55e]/40 bg-[#22c55e]/5' : 'border-[#ef4444]/40 bg-[#ef4444]/5'
          }`}
        >
          {result.ok ? (
            <CheckCircle2 size={20} className="text-[#22c55e] shrink-0 mt-0.5" />
          ) : (
            <XCircle size={20} className="text-[#ef4444] shrink-0 mt-0.5" />
          )}
          <div>
            {result.ok ? (
              <>
                <p className="text-sm font-semibold text-[#e8e8e8]">Checked in!</p>
                <p className="text-xs text-[#909090] mt-0.5">
                  Member {result.memberId?.slice(0, 8).toUpperCase()} ·{' '}
                  {result.checkedInAt
                    ? new Date(result.checkedInAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
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

      {isLive && (
        <button
          onClick={() => {
            stopCamera();
            setState('idle');
            setResult(null);
            setTorchOn(false);
            lastScanRef.current = null;
          }}
          className="flex items-center gap-2 text-sm text-[#555] hover:text-[#909090] transition-colors"
        >
          <RefreshCw size={14} /> Stop scanner
        </button>
      )}

      <p className="text-[12px] text-[#444]">Checking in to: {gymName}</p>

      {/* Scan line keyframe */}
      <style>{`
        @keyframes qr-scan-line {
          0%   { top: 0%; opacity: 0; }
          5%   { opacity: 1; }
          50%  { top: calc(100% - 2px); }
          95%  { opacity: 1; }
          100% { top: 0%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
