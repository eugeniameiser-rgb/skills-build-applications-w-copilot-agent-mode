import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadTeams = () => getJson<{ teams: Record<string, unknown>[] }>('/api/teams').then((data) => data.teams);

export default function Teams() {
  return <CapabilityCard title="Teams" description="Manage teams and members." load={loadTeams} emptyMessage="No teams yet." />;
}
