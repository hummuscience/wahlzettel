import { useTranslation } from 'react-i18next';
import type { ElectionConfig } from '../elections/types';

const SEAT_METHOD_NAME = {
  dhondt: "d'Hondt",
  hareNiemeyer: 'Hare-Niemeyer',
  sainteLague: 'Sainte-Laguë/Schepers',
} as const;

/** Fallback when the config has no `candidatesExpected`: lists are usually
 * admitted ~8 weeks before election day. */
const LISTS_LEAD_DAYS = 55;

function fmtDate(d: Date, lang: string): string {
  return d.toLocaleDateString(lang === 'de' ? 'de-DE' : lang, {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

/** Shown instead of the ballot while an upcoming election has no candidate
 * data yet: date + countdown, how the vote works, when lists are expected. */
export function PendingCandidatesView({ config, now = new Date() }: { config: ElectionConfig; now?: Date }) {
  const { t, i18n } = useTranslation();
  const { t: te } = useTranslation('election');
  const day = new Date(`${config.date}T00:00:00Z`);
  const days = Math.ceil((day.getTime() - now.getTime()) / 86_400_000);
  const listsFrom = config.candidatesExpected
    ? new Date(`${config.candidatesExpected}T00:00:00Z`)
    : new Date(day.getTime() - LISTS_LEAD_DAYS * 86_400_000);

  const facts: Array<[string, string]> = [];
  if (config.ballotKind === 'mmp-2vote') {
    facts.push([t('pending.votes'), t('pending.votesMmp')]);
    if (config.threshold) {
      facts.push([
        t('pending.threshold'),
        config.minorityExempt
          ? t('pending.thresholdMinority', { pct: config.threshold })
          : `${config.threshold} %`,
      ]);
    }
    facts.push([t('pending.seatMethod'), SEAT_METHOD_NAME[config.seatMethod]]);
  } else if (config.ballotKind === 'closed-list') {
    facts.push([t('pending.votes'), t('pending.votesClosedList')]);
    if (config.threshold) facts.push([t('pending.threshold'), `${config.threshold} %`]);
    facts.push([t('pending.seatMethod'), SEAT_METHOD_NAME[config.seatMethod]]);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-6 text-center" style={{ backgroundColor: config.themeColorLight }}>
          <p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color: config.themeColorDark }}>
            {t('pending.kicker')}
          </p>
          <h1 className="text-2xl font-bold mt-1 mb-1">{te('electionName', { defaultValue: config.id })}</h1>
          <p className="text-gray-700 m-0">
            {fmtDate(day, i18n.language)}
            {days > 0 && <span className="text-gray-500"> · {t('pending.inDays', { count: days })}</span>}
          </p>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm text-gray-700 mt-0 mb-4">
            {t('pending.body', { date: fmtDate(listsFrom, i18n.language) })}
          </p>

          {facts.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm m-0">
              {facts.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="m-0 text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {config.infoUrl && (
            <a
              href={config.infoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-5 text-sm font-semibold underline"
              style={{ color: config.themeColorDark }}
            >
              {t('pending.officialInfo')} ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
