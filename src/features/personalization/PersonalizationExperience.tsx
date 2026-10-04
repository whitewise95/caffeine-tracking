import type { useCaffeine } from '../caffeine/hooks/useCaffeine';
import type { FeedbackRecord } from './model';
import { CheckInCard } from './components/CheckInCard';
import { DailyCheckInModal } from './components/DailyCheckInModal';
import { BottomSheet } from '../../components/BottomSheet';
import { PersonalizationSettings } from './components/PersonalizationSettings';

type Controller = ReturnType<typeof useCaffeine>;

export function PersonalizationPreferences({ caffeine, onEdit }: { caffeine: Controller; onEdit: (record: FeedbackRecord) => void }) {
  const state = caffeine.state.personalization;
  return <PersonalizationSettings state={state} busy={caffeine.busy} onToggle={caffeine.togglePersonalization} onClearLearning={caffeine.clearLearning} onDeleteFeedback={caffeine.removeFeedback} onEditFeedback={onEdit} />;
}

export function PersonalizationFeedbackEditor({ caffeine, record, onClose }: { caffeine: Controller; record: FeedbackRecord; onClose: () => void }) {
  const candidate = { targetDate: record.targetDate, lastIntakeAt: record.lastIntakeAt, timeZone: record.timeZone, prediction: caffeine.state.personalization.predictions.find(prediction => prediction.id === record.predictionId) };
  const onSubmit: Controller['answerCheckIn'] = async input => {
    const saved = await caffeine.changeFeedback(record.id, input);
    if (saved) onClose();
    return saved;
  };
  if (record.responseKind === 'daily-feeling') return <DailyCheckInModal candidate={candidate} initialFeedback={record} busy={caffeine.busy} onSubmit={onSubmit} onClose={onClose} />;
  return <BottomSheet title="체감 응답 수정" onClose={onClose}><div className="feedback-editor-content"><CheckInCard candidate={candidate} initialFeedback={record} now={caffeine.now} busy={caffeine.busy} error={caffeine.error} onSubmit={onSubmit} onSkip={async () => { onClose(); return true; }} /></div></BottomSheet>;
}
