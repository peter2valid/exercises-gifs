'use client';

import { Download, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface Props {
  gymName: string;
  qrCodeDataUrl: string;
  joinUrl: string;
}

export function GymQRClient({ gymName, qrCodeDataUrl, joinUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${gymName.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="a-card flex flex-col items-center justify-center p-8 bg-white">
        <div className="relative w-64 h-64">
          <Image 
            src={qrCodeDataUrl} 
            alt={`QR Code for ${gymName}`} 
            fill 
            className="object-contain"
          />
        </div>
        <p className="mt-4 text-[14px] font-bold text-black uppercase tracking-wider">{gymName}</p>
        <p className="text-[10px] text-gray-400 mt-1 uppercase">Scan to Join</p>
      </div>

      <div className="space-y-4">
        <div className="a-card space-y-4">
          <h3 className="text-[13px] font-bold text-[#e8e8e8]">Poster QR Code</h3>
          <p className="text-[12px] text-[#555] leading-relaxed">
            Download this high-resolution QR code to include in your gym posters, flyers, or social media. 
            When scanned, it will take members directly to the join request page for your gym.
          </p>
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-500 transition-colors"
          >
            <Download size={16} />
            Download PNG
          </button>
        </div>

        <div className="a-card space-y-4">
          <h3 className="text-[13px] font-bold text-[#e8e8e8]">Join Link</h3>
          <div className="flex items-center gap-2 p-2 bg-[#0a0a0a] border border-[#262626] rounded-lg">
            <code className="flex-1 text-[11px] text-[#909090] truncate font-mono">{joinUrl}</code>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-white/5 text-[#555] hover:text-[#e8e8e8] transition-all"
              title="Copy link"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#262626] text-[#e8e8e8] text-[13px] font-bold hover:bg-white/5 transition-colors"
          >
            <ExternalLink size={16} />
            Test Link
          </a>
        </div>
      </div>
    </div>
  );
}
