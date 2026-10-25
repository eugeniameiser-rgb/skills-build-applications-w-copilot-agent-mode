import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  endpoint: string;
  collection: string;
  emptyMessage: string;
};

type ApiItem = Record<string, unknown>;

export function CapabilityCard({ title, description, endpoint, collection, emptyMessage }: Props) {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getJson<Record<string, ApiItem[]>>(endpoint)
      .then((data) => {
        const results = data[collection];
        if (!Array.isArray(results)) throw new Error(`Invalid ${collection} response`);
        if (active) setItems(results);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [collection, endpoint]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading ? <p role="status">Loading {title.toLowerCase()}...</p> : null}
        {error ? <p role="alert">Unable to load {title.toLowerCase()}.</p> : null}
        {!loading && !error && items.length === 0 ? <p>{emptyMessage}</p> : null}
        {!loading && !error && items.length > 0 ? (
          <ul className="list-group">
            {items.map((item, index) => (
              <li className="list-group-item" key={String(item._id ?? index)}>
                {Object.entries(item).map(([label, value]) => (
                  <span className="me-3" key={label}>
                    <strong>{label}: </strong>
                    {Array.isArray(value) ? value.join(', ') : typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
