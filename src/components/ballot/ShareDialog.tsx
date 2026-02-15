import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  onClose: () => void;
}

// --- QR rendering (reused for both preview and card) ---

export function getQRMatrix(url: string) {
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

function getThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    primary: style.getPropertyValue('--color-election-primary').trim() || '#003870',
    dark: style.getPropertyValue('--color-election-primary-dark').trim() || '#002650',
  };
}

function renderShareCard(
  canvas: HTMLCanvasElement,
  shareUrl: string,
  segments: PartySegment[],
  title: string,
  subtitle: string,
) {
  const { primary, dark } = getThemeColors();
  const pad = 48;
  const qrSize = 360;
  const titleY = pad + 44;
  const subtitleY = titleY + 38;
  const qrY = subtitleY + 36;
  const cardW = qrSize + pad * 2;
  const cardH = qrY + qrSize + pad;

  canvas.width = cardW;
  canvas.height = cardH;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, cardH);
  grad.addColorStop(0, primary);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, cardW, cardH, 24);
  ctx.fill();

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, cardW / 2, titleY);

  // Subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '20px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, cardW / 2, subtitleY);

  // QR code
  const qrX = (cardW - qrSize) / 2;
  const matrix = getQRMatrix(shareUrl);
  drawColoredQR(ctx, matrix, segments, qrX, qrY, qrSize);
}

// --- Component ---

export function ShareDialog({
  shareUrl,
  partySegments,
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

  const { t: te } = useTranslation('election');
  const shareTitle = te('shareCardTitle', { defaultValue: 'Mein Wahlzettel' });
  const shareSubtitle = te('shareCardSubtitle', { defaultValue: 'Kommunalwahl 2026' });

  const generateCard = useCallback(() => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;
    renderShareCard(canvas, shareUrl, partySegments, shareTitle, shareSubtitle);
    setCardDataUrl(canvas.toDataURL('image/png'));
  }, [shareUrl, partySegments, shareTitle, shareSubtitle]);

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
        title: shareTitle,
        text: te('shareText', { defaultValue: 'Schau dir meine Stimmverteilung an!' }),
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

  return createPortal(
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
          className="w-full mb-3 px-4 py-2.5 text-sm font-medium bg-election-primary text-white rounded-lg hover:bg-election-primary/90 flex items-center justify-center gap-2"
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
    </dialog>,
    document.body,
  );
}
