import { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Check, Copy, Download, Printer, QrCode } from 'lucide-react';
import mietLogo from '../../assets/miet-logo.png';
import type { CampusLocation } from '../../models/types';
import { buildQrUrl, resolveBaseUrl } from '../../services/qr/qrService';
import { Button } from '../ui/Button';

export function QRGenerator({ location }: { location: CampusLocation }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const url = buildQrUrl(resolveBaseUrl(), location.id);

  function downloadSvg() {
    const svg = wrapRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `QR_${location.id}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function downloadPng() {
    const svg = wrapRef.current?.querySelector('svg');
    if (!svg) return;
    const svgText = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Could not render QR image.'));
        img.src = svgUrl;
      });
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `QR_${location.id}.png`;
      a.click();
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — user can copy from the text field below.
    }
  }

  return (
    <div className="border border-ink-deep/15 bg-white">
      {/* Printable plate header */}
      <div className="flex items-center gap-2.5 border-b border-ink-deep/10 px-4 py-3">
        <img src={mietLogo} alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
        <div>
          <p className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-ink-deep">
            {location.name}
            <QrCode className="h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />
          </p>
          <p className="font-mono text-[10px] tracking-[0.12em] text-ink-soft">MIET CAMPUS QR · SCAN TO NAVIGATE</p>
        </div>
      </div>
      <div ref={wrapRef} className="mx-auto mt-4 w-fit border border-ink-deep/10 bg-white p-4">
        <QRCode value={url} size={180} aria-label={`QR code for ${location.name}`} />
      </div>
      <p className="mt-2 text-center text-xs text-ink-soft">
        Scan to open navigation at {location.name}
      </p>
      <p className="mx-4 mt-2 break-all border-y border-ink-deep/10 px-1 py-2 font-mono text-[11px] text-ink-soft">{url}</p>
      <div className="grid grid-cols-2 gap-2 p-4">
        <Button type="button" variant="secondary" onClick={() => void copyLink()}>
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => void downloadPng()}>
          <Download className="h-4 w-4" aria-hidden="true" /> PNG
        </Button>
        <Button type="button" variant="secondary" onClick={downloadSvg}>
          <Download className="h-4 w-4" aria-hidden="true" /> SVG
        </Button>
        <Button type="button" variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden="true" /> Print
        </Button>
      </div>
    </div>
  );
}
