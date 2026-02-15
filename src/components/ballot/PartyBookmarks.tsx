import { useRef, useEffect } from 'react';

interface PartyBookmarksProps {
  parties: { listNumber: number; shortName: string }[];
  activeIndex: number;
  stimmenPerParty: Record<number, number>;
  onSelectParty: (index: number) => void;
}

export function PartyBookmarks({
  parties,
  activeIndex,
  stimmenPerParty,
  onSelectParty,
}: PartyBookmarksProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex]);

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <div
        ref={containerRef}
        data-tour="party-bookmarks"
        className="hidden lg:flex flex-col w-44 border-r border-gray-200 bg-gray-50 overflow-y-auto shrink-0"
      >
        {parties.map((party, index) => {
          const isActive = index === activeIndex;
          const count = stimmenPerParty[party.listNumber] || 0;

          return (
            <button
              key={party.listNumber}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSelectParty(index)}
              className={`
                text-left px-3 py-2 text-sm border-b border-gray-100
                transition-colors duration-100 flex items-center justify-between
                ${isActive
                  ? 'bg-white font-bold text-election-primary border-r-0 shadow-sm relative z-10'
                  : 'hover:bg-gray-100 text-gray-700'
                }
              `}
            >
              <span className="truncate">{party.shortName}</span>
              {count > 0 && (
                <span className={`
                  ml-1 text-xs px-1.5 py-0.5 rounded-full shrink-0
                  ${isActive ? 'bg-election-primary text-white' : 'bg-election-primary/10 text-election-primary'}
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile: horizontal strip */}
      <div data-tour="party-bookmarks-mobile" className="lg:hidden flex overflow-x-auto border-b border-gray-200 bg-gray-50 scrollbar-hide">
        {parties.map((party, index) => {
          const isActive = index === activeIndex;
          const count = stimmenPerParty[party.listNumber] || 0;

          return (
            <button
              key={party.listNumber}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSelectParty(index)}
              className={`
                shrink-0 px-3 py-2 text-xs border-b-2 transition-colors
                ${isActive
                  ? 'border-election-primary text-election-primary font-bold bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {party.shortName}
              {count > 0 && (
                <span className="ml-0.5 text-[10px] bg-election-primary/10 text-election-primary px-1 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
