import React from 'react';
import { Activity } from '../types';
import { History, User, Zap } from 'lucide-react';

interface ActivityFeedProps {
  activities: Activity[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 border-bottom border-zinc-800 flex items-center justify-between bg-zinc-950/50">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-500" />
          Live Activity
        </h3>
      </div>
      <div className="divide-y divide-zinc-800 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-600 italic">Waiting for activity...</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="p-4 flex items-start gap-3">
              <div className="mt-1">
                <Zap className="w-3 h-3 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-zinc-200 truncate">{activity.user}</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">{activity.action}</span>
                </div>
                <p className="text-xs text-zinc-400 truncate">
                  {activity.details}
                </p>
                <span className="text-[9px] text-zinc-600 font-mono mt-1 block">
                  {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
