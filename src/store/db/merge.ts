// Three-way merge: only changes since this tab's last snapshot are applied to
// the latest committed value. Call this inside the read/write transaction.
export function equalState(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

function itemKey(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return;
  if (typeof value.id === 'string') return value.id;
  if (typeof value.audio === 'string') return value.audio;
  if (typeof value.url === 'string') return value.url;
  if (value.timestamp) return JSON.stringify([value.timestamp, value.level, value.message]);
}

export function mergeState(base: unknown, local: unknown, remote: unknown): unknown {
  if (equalState(base, local)) return remote;
  if (equalState(base, remote)) return local;

  if (Array.isArray(local) && Array.isArray(remote) && (base === undefined || Array.isArray(base))) {
    const previous: unknown[] = base ?? [];
    const all = [...previous, ...local, ...remote];
    if (all.every((item) => itemKey(item) !== undefined)) {
      const before = new Map(previous.map((item) => [itemKey(item), item]));
      const ours = new Map(local.map((item) => [itemKey(item), item]));
      const theirs = new Map(remote.map((item) => [itemKey(item), item]));
      // Respect local ordering when it changed (recent items are prepended),
      // otherwise keep the remote order. Append additions unique to the other tab.
      const reordered = !equalState(previous.map(itemKey), local.map(itemKey));
      const order = reordered ? [...ours.keys(), ...theirs.keys()] : [...theirs.keys(), ...ours.keys()];
      return [...new Set(order)].flatMap((key) => {
        // A stale metadata/progress update must not resurrect a deleted record.
        if (before.has(key) && (!ours.has(key) || !theirs.has(key))) return [];
        if (!ours.has(key)) return [theirs.get(key)];
        if (!theirs.has(key)) return [ours.get(key)];
        return [mergeState(before.get(key), ours.get(key), theirs.get(key))];
      });
    }
  }

  if (isRecord(local) && isRecord(remote) && (base === undefined || isRecord(base))) {
    const previous = base ?? {};
    const result = { ...remote };
    for (const key of new Set([...Object.keys(previous), ...Object.keys(local)])) {
      if (equalState(previous[key], local[key])) continue;
      if (!(key in local)) delete result[key];
      else result[key] = mergeState(previous[key], local[key], remote[key]);
    }
    return result;
  }

  // Conflicting edits to the same scalar/atomic list use the last committing
  // local edit. Unchanged values never take this branch.
  return local;
}
