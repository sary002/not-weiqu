// src/components/drill/ScenarioCard.tsx
import Link from 'next/link';
import type { Scenario } from '@/lib/scenarios-data';

export function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <Link
      href={`/drill?code=${scenario.code}`}
      className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-muted"
    >
      <div className="font-medium text-foreground">{scenario.title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{scenario.one_liner}</div>
      <div className="mt-2 flex gap-2 text-xs text-neutral-500">
        <span>{scenario.layer}</span>
        <span>·</span>
        <span>难度 {scenario.difficulty}</span>
      </div>
    </Link>
  );
}
