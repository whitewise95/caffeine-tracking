import { BottomSheet } from '../../../components/BottomSheet';
import { IntakeTimePicker } from '../../caffeine/components/IntakeTimePicker';

export function BedtimeTimeSheet({ bedtime, busy, error, onClose, onSave }: {
  bedtime: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (time: string) => Promise<void>;
}) {
  return <BottomSheet title="예정 취침 시각" onClose={onClose} className="sheet-dialog--bedtime">
    {error && <div className="error-message" role="alert">{error}</div>}
    <IntakeTimePicker value={bedtime} disabled={busy} onCancel={onClose} onDone={time => { void onSave(time); }} />
  </BottomSheet>;
}
