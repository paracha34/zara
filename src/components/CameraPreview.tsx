import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, X, RefreshCw } from 'lucide-react';

interface CameraPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'starting' | 'ready' | 'error'>('starting');
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const startCamera = async () => {
      setStatus('starting');
      setError('');

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        setError('Camera access requires HTTPS (or localhost) and a supported browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setStatus('ready');
      } catch (err: any) {
        if (cancelled) return;
        setStatus('error');
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setError('Camera permission was blocked. Click the site icon beside the address bar, allow Camera, then try again.');
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          setError('No camera was found. Connect a webcam and try again.');
        } else if (err?.name === 'NotReadableError') {
          setError('The camera is busy in another app. Close other apps using the camera and retry.');
        } else {
          setError(err?.message || 'Could not start the camera.');
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [isOpen, retryCount]);

  if (!isOpen) return null;

  const close = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Camera preview">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Camera className="w-5 h-5 text-cyan-400" />
            ZARA Camera
            <span className={`text-xs px-2 py-0.5 rounded-full ${status === 'ready' ? 'bg-emerald-500/15 text-emerald-300' : status === 'error' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>
              {status === 'ready' ? 'Camera active' : status === 'error' ? 'Access issue' : 'Requesting permission'}
            </span>
          </div>
          <button onClick={close} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close camera">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {status !== 'ready' && (
              <div className="absolute px-6 text-center max-w-lg">
                {status === 'starting' ? (
                  <><RefreshCw className="w-8 h-8 mx-auto mb-3 text-cyan-400 animate-spin" /><p className="text-sm text-slate-300">Requesting camera permission…</p></>
                ) : (
                  <><CameraOff className="w-8 h-8 mx-auto mb-3 text-red-400" /><p className="text-sm text-red-200">{error}</p></>
                )}
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">Live preview only. ZARA does not record or upload camera video.</p>
            {status === 'error' && (
              <button onClick={() => setRetryCount((value) => value + 1)} className="text-xs px-3 py-2 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Close and retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
