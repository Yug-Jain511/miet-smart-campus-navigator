import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseQrLocation } from '../../services/qr/qrService';

/**
 * Reads ?location=ID from the URL (QR entry) and reports it upward.
 * Invalid ids are reported as errors — never silently accepted.
 */
export function QRScannerEntry({
  onValid,
  onInvalid,
  validIds,
}: {
  onValid: (locationId: string) => void;
  onInvalid: (raw: string) => void;
  /** Dataset-driven id list. Defaults to the demo table. */
  validIds?: string[];
}) {
  const [params] = useSearchParams();

  useEffect(() => {
    const raw = params.get('location');
    if (!raw) return;
    const parsed = parseQrLocation(raw, validIds);
    if (parsed) onValid(parsed);
    else onInvalid(raw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return null;
}
