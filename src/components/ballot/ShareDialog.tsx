import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';

import { getPartyColor } from '../../data/partyColors';

export interface PartySegment {
  color: string;
  fraction: number; // 0-1, proportion of total votes
}

export function buildPartySegments(
  stimmenPerParty: Record<number, number>,
  parties: { listNumber: number; shortName: string }[],
  totalUsed: number,
): PartySegment[] {
  if (totalUsed === 0) return [];
  return parties
    .filter(p => (stimmenPerParty[p.listNumber] || 0) > 0)
    .map(p => ({
      color: getPartyColor(p.shortName),
      count: stimmenPerParty[p.listNumber] || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .map(({ color, count }) => ({ color, fraction: count / totalUsed }));
}

interface ShareDialogProps {
  shareUrl: string;
  partySegments: PartySegment[];
  onClose: () => void;
}

/**
 * Render QR code to canvas with dark modules colored by party vote proportions.
 * Modules are assigned colors in row-major order: first N% of dark modules get
 * party 1's color, next M% get party 2's color, etc.
 */
function renderColoredQR(
  canvas: HTMLCanvasElement,
  url: string,
  segments: PartySegment[],
  size: number,
) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const moduleCount = qr.modules.size;
  const moduleData = qr.modules.data;

  // Count dark modules
  let darkCount = 0;
  for (let i = 0; i < moduleData.length; i++) {
    if (moduleData[i]) darkCount++;
  }

  // Build color assignment: for each dark module index, which color?
  const darkColors: string[] = [];
  const fallback = '#000000';

  if (segments.length === 0) {
    for (let i = 0; i < darkCount; i++) darkColors.push(fallback);
  } else {
    for (const seg of segments) {
      const count = Math.round(seg.fraction * darkCount);
      for (let i = 0; i < count; i++) darkColors.push(seg.color);
    }
    // Fill any rounding gap with last color
    while (darkColors.length < darkCount) {
      darkColors.push(segments[segments.length - 1].color);
    }
  }

  const margin = 2; // modules of quiet zone
  const totalModules = moduleCount + margin * 2;
  const scale = size / totalModules;

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Draw modules
  let darkIdx = 0;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      const isDark = moduleData[row * moduleCount + col];
      if (isDark) {
        ctx.fillStyle = darkColors[darkIdx] || fallback;
        darkIdx++;
      } else {
        continue; // white stays from background
      }
      const x = (col + margin) * scale;
      const y = (row + margin) * scale;
      ctx.fillRect(x, y, Math.ceil(scale), Math.ceil(scale));
    }
  }
}

export function ShareDialog({ shareUrl, partySegments, onClose }: ShareDialogProps) {
  const { t } = useTranslation('ballot');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const generateQR = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderColoredQR(canvas, shareUrl, partySegments, 400);
    setQrDataUrl(canvas.toDataURL('image/png'));
  }, [shareUrl, partySegments]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="backdrop:bg-black/50 rounded-lg shadow-xl p-0 max-w-md w-full"
    >
      <div className="p-5">
        <h2 className="text-lg font-semibold mb-4">{t('linkTeilen')}</h2>

        {/* URL + Copy */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 min-w-0 text-sm border border-gray-300 rounded px-2 py-1.5 bg-gray-50 text-gray-700"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-sm bg-frankfurt-blue text-white rounded hover:bg-frankfurt-blue/90 whitespace-nowrap"
          >
            {copied ? t('linkKopiert') : t('kopieren')}
          </button>
        </div>

        {/* Hidden canvas for rendering */}
        <canvas ref={canvasRef} className="hidden" />

        {/* QR Code */}
        {qrDataUrl && (
          <div className="flex justify-center mb-4">
            <img src={qrDataUrl} alt="QR Code" width={200} height={200} />
          </div>
        )}

        {/* Close */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
          >
            {t('schliessen')}
          </button>
        </div>
      </div>
    </dialog>
  );
}
