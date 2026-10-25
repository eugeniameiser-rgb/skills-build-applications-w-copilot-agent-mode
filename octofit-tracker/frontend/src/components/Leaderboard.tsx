import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadLeaderboard = () => getJson<{ leaderboard: Record<string, unknown>[] }>('/api/leaderboard').then((data) => data.leaderboard);

export default function Leaderboard() {
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." load={loadLeaderboard} emptyMessage="No leaderboard scores yet." />;
}
