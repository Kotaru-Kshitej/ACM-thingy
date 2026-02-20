import React from 'react';
import { Blocker } from '../types';
import { AlertTriangle, CheckCircle, User, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

interface BlockerListProps {
  blockers: Blocker[];
  onResolve: (id: number) => void;
  onAddBlocker: () => void;
}

export const BlockerList: React.FC<BlockerListProps> = ({ blockers, onResolve, onAddBlocker }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 border-bottom border-zinc-800 flex items-center justify-between bg-zinc-950/50">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          Active Blockers
        </h3>
        <button 
          onClick={onAddBlocker}
          className="text-[10px] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-2 py-1 rounded transition-all font-bold uppercase"
        >
          Flag Blocker
        </button>
      </div>
      <div className="divide-y divide-zinc-800">
        {blockers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-600 italic">Clear skies! No active blockers.</p>
          </div>
        ) : (
          blockers.map((blocker) => (
            <div key={blocker.id} className="p-4 flex items-start gap-4 group">
              <div className="mt-1">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-200 mb-2">
                  {blocker.description}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 font-medium">{blocker.reporter}</span>
                  </div>
                  <span className="text-[10px] text-zinc-700">•</span>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(blocker.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => onResolve(blocker.id)}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-emerald-500 transition-all"
                title="Resolve Blocker"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
