import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';

interface ShareDialogProps {
  shareUrl: string;
  onClose: () => void;
}

export function ShareDialog({ shareUrl, onClose }: ShareDialogProps) {
  const { t } = useTranslation('ballot');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M',
    }).then(setQrDataUrl);
  }, [shareUrl]);

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
