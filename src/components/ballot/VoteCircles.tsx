import { useCallback } from 'react';

interface VoteCirclesProps {
  stimmen: number;
  maxReached: boolean;
  isListVoteDisplay?: boolean;
  dataTour?: string;
  onChange: (newStimmen: number) => void;
}

export function VoteCircles({ stimmen, maxReached, isListVoteDisplay, dataTour, onChange }: VoteCirclesProps) {
  const handleClick = useCallback(
    (circleIndex: number) => {
      if (isListVoteDisplay) return;
      const clickedPosition = circleIndex + 1;
      if (clickedPosition === stimmen) {
        // Clicking the last filled circle decrements
        onChange(stimmen - 1);
      } else {
        onChange(clickedPosition);
      }
    },
    [stimmen, isListVoteDisplay, onChange],
  );

  return (
    <div className="flex gap-1.5 shrink-0" role="group" aria-label="Stimmen" {...(dataTour ? { 'data-tour': dataTour } : {})}>
      {[0, 1, 2].map(i => {
        const isFilled = i < stimmen;
        const isDisabled = !isFilled && maxReached && !isListVoteDisplay;
        const isClickable = !isListVoteDisplay && !isDisabled;

        return (
          <button
            key={i}
            type="button"
            disabled={isDisabled}
            onClick={() => handleClick(i)}
            aria-label={`Stimme ${i + 1}${isFilled ? ' (vergeben)' : ''}`}
            className={`
              w-7 h-7 md:w-6 md:h-6 rounded-full border-2 transition-all duration-150
              ${isFilled && isListVoteDisplay
                ? 'bg-frankfurt-blue/30 border-frankfurt-blue/50'
                : isFilled
                  ? 'bg-frankfurt-blue border-frankfurt-blue scale-105'
                  : 'border-gray-300 bg-white'
              }
              ${isClickable ? 'cursor-pointer hover:border-frankfurt-blue hover:scale-110' : ''}
              ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
            `}
          />
        );
      })}
    </div>
  );
}
