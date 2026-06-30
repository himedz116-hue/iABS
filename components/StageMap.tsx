import React from 'react';
import { Lock, Play, CheckCircle2 } from 'lucide-react';

interface StageMapProps {
  completedStages: number[];
  onSelectStage: (stage: number) => void;
}

export const StageMap: React.FC<StageMapProps> = ({ completedStages, onSelectStage }) => {
  return (
    <div className="grid grid-cols-4 gap-3 md:gap-4 w-full max-w-2xl p-4">
      {Array.from({ length: 20 }, (_, i) => i + 1).map((stage) => {
        const isCompleted = completedStages.includes(stage);
        const isUnlocked = stage === 1 || completedStages.includes(stage - 1);
        
        return (
          <button
            key={stage}
            disabled={!isUnlocked}
            onClick={() => onSelectStage(stage)}
            className={`group relative aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-500 transform hover:scale-105
              ${isUnlocked 
                ? isCompleted 
                  ? 'bg-green-900/40 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                  : 'bg-red-900/40 border-red-500/50 shadow-[0_0_30px_rgba(255,0,0,0.3)] hover:shadow-[0_0_50px_rgba(255,0,0,0.5)]'
                : 'bg-zinc-900/50 border-zinc-800 opacity-60 cursor-not-allowed'
              }`}
          >
            {isUnlocked ? (
                isCompleted ? (
                    <CheckCircle2 className="text-green-500 w-8 h-8" />
                ) : (
                    <Play className="text-white w-8 h-8 fill-white group-hover:scale-110 transition-transform" />
                )
            ) : (
                <Lock className="text-zinc-600 w-6 h-6" />
            )}
            <span className={`absolute bottom-2 text-xs font-black ${isUnlocked ? 'text-white' : 'text-zinc-600'}`}>
                {stage}
            </span>
          </button>
        );
      })}
    </div>
  );
};