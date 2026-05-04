import type { BayernLandtagConfig } from './types';

interface BallotProps {
  config: BayernLandtagConfig;
}

export function Ballot({ config }: BallotProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <h1 className="text-xl font-bold mb-2">{config.id}</h1>
      <p className="text-gray-600">
        Diese Wahl ({config.ballotKind}) ist im System hinterlegt, aber der Stimmzettel ist
        noch nicht implementiert.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Geplant für: {config.date} · {config.region.land}
      </p>
    </div>
  );
}
