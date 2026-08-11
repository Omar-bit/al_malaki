import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Download, Printer, Check } from 'lucide-react';
import {
  copyProductLink,
  downloadDataUrl,
  generateProductQRDataUrl,
  getProductPublicUrl,
  printProductLabel,
} from '../utils/qrCode';

type QRAction = 'copy' | 'download' | 'print';

interface ProductQRCodeProps {
  slug: string;
  name: string;
  price: number;
  discountPrice?: number;
  size?: number;
  showActions?: boolean;
  actions?: QRAction[];
  showUrl?: boolean;
}

export function ProductQRCode({
  slug,
  name,
  price,
  discountPrice,
  size = 180,
  showActions = true,
  actions = ['copy', 'download', 'print'],
  showUrl = true,
}: ProductQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setQrDataUrl(null);
    generateProductQRDataUrl(slug, size * 2)
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) toast.error('Unable to generate QR code.');
      });
    return () => {
      active = false;
    };
  }, [slug, size]);

  const handleCopyLink = async () => {
    try {
      await copyProductLink(slug);
      setCopied(true);
      toast.success('Product link copied.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Unable to copy product link.');
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    downloadDataUrl(qrDataUrl, `${slug}-qr.png`);
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;
    printProductLabel({ name, slug, price, discountPrice, qrDataUrl });
  };

  return (
    <div className='flex flex-col items-center gap-3'>
      <div
        className='flex items-center justify-center rounded-2xl border border-[#d5bd9d] bg-white p-3 shadow-sm'
        style={{ width: size + 24, height: size + 24 }}
      >
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR code for ${name}`} width={size} height={size} />
        ) : (
          <div
            className='animate-pulse rounded-xl bg-[#F7EEE1]'
            style={{ width: size, height: size }}
          />
        )}
      </div>

      {showUrl && (
        <p className='max-w-[220px] truncate text-center text-xs text-[#6D5A46]'>
          {getProductPublicUrl(slug)}
        </p>
      )}

      {showActions && (
        <div className='flex flex-wrap items-center justify-center gap-2'>
          {actions.includes('copy') && (
            <button
              type='button'
              onClick={handleCopyLink}
              className='flex items-center gap-1.5 rounded-full border border-[#d5bd9d] bg-white px-3 py-1.5 text-xs font-semibold text-[#6D5A46] transition-colors hover:border-dark-red hover:text-dark-red'
            >
              {copied ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
              Copy link
            </button>
          )}
          {actions.includes('download') && (
            <button
              type='button'
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className='flex items-center gap-1.5 rounded-full border border-[#d5bd9d] bg-white px-3 py-1.5 text-xs font-semibold text-[#6D5A46] transition-colors hover:border-dark-red hover:text-dark-red disabled:opacity-50'
            >
              <Download className='h-3.5 w-3.5' />
              Download
            </button>
          )}
          {actions.includes('print') && (
            <button
              type='button'
              onClick={handlePrint}
              disabled={!qrDataUrl}
              className='flex items-center gap-1.5 rounded-full border border-[#d5bd9d] bg-white px-3 py-1.5 text-xs font-semibold text-[#6D5A46] transition-colors hover:border-dark-red hover:text-dark-red disabled:opacity-50'
            >
              <Printer className='h-3.5 w-3.5' />
              Print label
            </button>
          )}
        </div>
      )}
    </div>
  );
}
