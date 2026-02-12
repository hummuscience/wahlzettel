import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';

import { getPartyColor } from '../../data/partyColors';

export interface PartySegment {
  color: string;
  name: string;
  count: number;
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
      name: p.shortName,
      count: stimmenPerParty[p.listNumber] || 0,
      fraction: (stimmenPerParty[p.listNumber] || 0) / totalUsed,
    }))
    .sort((a, b) => b.count - a.count);
}

interface ShareDialogProps {
  shareUrl: string;
  partySegments: PartySegment[];
  totalUsed: number;
  totalMax: number;
  onClose: () => void;
}

// --- QR rendering (reused for both preview and card) ---

function getQRMatrix(url: string) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  return { size: qr.modules.size, data: qr.modules.data };
}

function drawColoredQR(
  ctx: CanvasRenderingContext2D,
  matrix: { size: number; data: Uint8Array },
  segments: PartySegment[],
  x: number,
  y: number,
  totalSize: number,
) {
  const { size: moduleCount, data: moduleData } = matrix;

  let darkCount = 0;
  for (let i = 0; i < moduleData.length; i++) {
    if (moduleData[i]) darkCount++;
  }

  const darkColors: string[] = [];
  const fallback = '#000000';

  if (segments.length === 0) {
    for (let i = 0; i < darkCount; i++) darkColors.push(fallback);
  } else {
    for (const seg of segments) {
      const count = Math.round(seg.fraction * darkCount);
      for (let i = 0; i < count; i++) darkColors.push(seg.color);
    }
    while (darkColors.length < darkCount) {
      darkColors.push(segments[segments.length - 1].color);
    }
  }

  const margin = 2;
  const totalModules = moduleCount + margin * 2;
  const scale = totalSize / totalModules;

  // White background for QR area
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x, y, totalSize, totalSize, 12);
  ctx.fill();

  let darkIdx = 0;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      const isDark = moduleData[row * moduleCount + col];
      if (!isDark) continue;
      ctx.fillStyle = darkColors[darkIdx++] || fallback;
      const mx = x + (col + margin) * scale;
      const my = y + (row + margin) * scale;
      ctx.fillRect(mx, my, Math.ceil(scale), Math.ceil(scale));
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// --- Share card rendering ---

const CARD_W = 720;
const CARD_H = 1080;
const FRANKFURT_BLUE = '#003870';
const FRANKFURT_BLUE_DARK = '#002650';

function renderShareCard(
  canvas: HTMLCanvasElement,
  shareUrl: string,
  segments: PartySegment[],
  totalUsed: number,
  totalMax: number,
) {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d')!;
  const pad = 48;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CARD_H);
  grad.addColorStop(0, FRANKFURT_BLUE);
  grad.addColorStop(1, FRANKFURT_BLUE_DARK);
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 24);
  ctx.fill();

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mein Wahlzettel', CARD_W / 2, pad + 40);

  // Subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '22px system-ui, -apple-system, sans-serif';
  ctx.fillText('Kommunalwahl Frankfurt 2026', CARD_W / 2, pad + 74);

  // Stimmen counter
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '18px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${totalUsed} / ${totalMax} Stimmen`, CARD_W / 2, pad + 106);

  // Party breakdown bars (top 8)
  const barTop = pad + 136;
  const barAreaW = CARD_W - pad * 2;
  const maxBarW = barAreaW - 160; // space for name + count
  const barH = 28;
  const barGap = 8;
  const topSegments = segments.slice(0, 8);
  const maxCount = topSegments.length > 0 ? topSegments[0].count : 1;

  ctx.textAlign = 'left';
  topSegments.forEach((seg, i) => {
    const rowY = barTop + i * (barH + barGap);

    // Party name
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.fillText(seg.name, pad, rowY + barH / 2 + 5);

    // Bar
    const barX = pad + 130;
    const barW = Math.max(4, (seg.count / maxCount) * maxBarW);
    ctx.fillStyle = seg.color;
    roundRect(ctx, barX, rowY, barW, barH, 4);
    ctx.fill();

    // Count
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(seg.count), CARD_W - pad, rowY + barH / 2 + 5);
    ctx.textAlign = 'left';
  });

  // QR code
  const qrSize = 280;
  const qrY = barTop + topSegments.length * (barH + barGap) + 32;
  const qrX = (CARD_W - qrSize) / 2;

  const matrix = getQRMatrix(shareUrl);
  drawColoredQR(ctx, matrix, segments, qrX, qrY, qrSize);

  // "Scan to load" hint
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QR-Code scannen zum Laden', CARD_W / 2, qrY + qrSize + 30);

  // Footer branding
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('wahlguide.frankfurt.de', CARD_W / 2, CARD_H - pad + 10);
}

// --- Component ---

export function ShareDialog({
  shareUrl,
  partySegments,
  totalUsed,
  totalMax,
  onClose,
}: ShareDialogProps) {
  const { t } = useTranslation('ballot');
  const [copied, setCopied] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const generateCard = useCallback(() => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;
    renderShareCard(canvas, shareUrl, partySegments, totalUsed, totalMax);
    setCardDataUrl(canvas.toDataURL('image/png'));
  }, [shareUrl, partySegments, totalUsed, totalMax]);

  useEffect(() => {
    generateCard();
  }, [generateCard]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareImage = async () => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) return;

    const file = new File([blob], 'mein-wahlzettel.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Mein Wahlzettel',
        text: 'Schau dir meine Stimmverteilung an!',
      });
    } else {
      // Fallback: download
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mein-wahlzettel.png';
      a.click();
      URL.revokeObjectURL(a.href);
    }
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
      className="backdrop:bg-black/50 rounded-lg shadow-xl p-0 max-w-md w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="p-5">
        <h2 className="text-lg font-semibold mb-4">{t('linkTeilen')}</h2>

        {/* Share card preview */}
        {cardDataUrl && (
          <div className="flex justify-center mb-4">
            <img
              src={cardDataUrl}
              alt="Share Card"
              className="w-full max-w-[300px] rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Share / Download image button */}
        <button
          onClick={handleShareImage}
          className="w-full mb-3 px-4 py-2.5 text-sm font-medium bg-frankfurt-blue text-white rounded-lg hover:bg-frankfurt-blue/90 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .799l6.733 3.366a2.5 2.5 0 11-.671 1.341l-6.733-3.366a2.5 2.5 0 110-3.483l6.733-3.366A2.52 2.52 0 0113 4.5z" />
          </svg>
          {t('bildTeilen')}
        </button>

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
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 whitespace-nowrap"
          >
            {copied ? t('linkKopiert') : t('kopieren')}
          </button>
        </div>

        {/* Hidden canvas for rendering */}
        <canvas ref={cardCanvasRef} className="hidden" />

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
