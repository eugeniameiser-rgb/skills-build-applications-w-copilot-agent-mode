import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadSuggestions = () => getJson<{ suggestions: Record<string, unknown>[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`).then((data) => data.suggestions);

export default function Workouts() {
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." load={loadSuggestions} emptyMessage="No workout suggestions yet." />;
}
