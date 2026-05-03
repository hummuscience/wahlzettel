import { useTranslation } from 'react-i18next';
import { useClosedListState } from './voteReducer';
import type { ClosedListConfig } from './types';
import type { ClosedListData } from './dataSchema';
import { getPartyColor } from '../../data/partyColors';

interface BallotProps {
  config: ClosedListConfig;
  data: ClosedListData;
}

export function Ballot({ config, data }: BallotProps) {
  const { t } = useTranslation('election');
  const { state, dispatch } = useClosedListState();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold">{t('ballotTitle', { defaultValue: data.name })}</h1>
        <p className="text-sm text-gray-500">{t('electionDateValue', { defaultValue: data.date })}</p>
      </header>

      <p className="text-sm text-gray-700 mb-4">
        {t('closedListInstructions', {
          defaultValue: 'Sie haben eine Stimme. Bitte wählen Sie eine Partei.',
        })}
      </p>

      <ol className="space-y-2">
        {data.parties.map(party => {
          const isChosen = state.choice === party.listNumber;
          const color = getPartyColor(party.shortName, config.partyColors);
          return (
            <li key={party.listNumber}>
              <button
                type="button"
                onClick={() =>
                  isChosen
                    ? dispatch({ type: 'CLEAR' })
                    : dispatch({ type: 'SET_CHOICE', listNumber: party.listNumber })
                }
                className={`w-full flex items-center gap-4 px-4 py-3 border rounded-md text-left transition ${
                  isChosen ? 'ring-2 ring-offset-1' : 'hover:bg-gray-50'
                }`}
                style={{ borderColor: isChosen ? color : '#d1d5db' }}
              >
                <span
                  className="w-6 h-6 border-2 rounded flex items-center justify-center"
                  style={{ borderColor: color }}
                >
                  {isChosen ? <span className="block w-3 h-3" style={{ backgroundColor: color }} /> : null}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{party.shortName}</div>
                  <div className="text-xs text-gray-500">{party.fullName}</div>
                </div>
                <span className="text-xs text-gray-400">Liste {party.listNumber}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => dispatch({ type: 'RESET' })}
          className="text-sm text-gray-500 underline"
        >
          {t('reset', { defaultValue: 'Zurücksetzen' })}
        </button>
      </div>
    </div>
  );
}
