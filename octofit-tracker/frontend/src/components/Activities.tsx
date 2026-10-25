import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadActivities = () => getJson<{ activities: Record<string, unknown>[] }>('/api/activities').then((data) => data.activities);

export default function Activities() {
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." load={loadActivities} emptyMessage="No activities yet." />;
}
