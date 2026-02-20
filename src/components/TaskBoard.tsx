import React from 'react';
import { Task, TaskStatus } from '../types';
import { cn } from '../lib/utils';
import { Clock, CheckCircle2, Circle, AlertCircle, Plus, User } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  onUpdateStatus: (id: number, status: TaskStatus) => void;
  onAddTask: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onUpdateStatus, onAddTask }) => {
  const columns: { id: TaskStatus; label: string; icon: any }[] = [
    { id: 'todo', label: 'To Do', icon: Circle },
    { id: 'in-progress', label: 'In Progress', icon: Clock },
    { id: 'done', label: 'Done', icon: CheckCircle2 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((col) => (
        <div key={col.id} className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <col.icon className={cn(
                "w-4 h-4",
                col.id === 'todo' && "text-zinc-500",
                col.id === 'in-progress' && "text-amber-500",
                col.id === 'done' && "text-emerald-500"
              )} />
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-tight">
                {col.label}
              </h3>
              <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            {col.id === 'todo' && (
              <button 
                onClick={onAddTask}
                className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 min-h-[200px]">
            {tasks.filter(t => t.status === col.id).map((task) => (
              <div 
                key={task.id}
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg group hover:border-zinc-700 transition-all cursor-pointer"
                onClick={() => {
                  const nextStatus: Record<TaskStatus, TaskStatus> = {
                    'todo': 'in-progress',
                    'in-progress': 'done',
                    'done': 'todo'
                  };
                  onUpdateStatus(task.id, nextStatus[task.status]);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-zinc-100 group-hover:text-white">
                    {task.title}
                  </h4>
                  {task.priority === 'high' && (
                    <AlertCircle className="w-3 h-3 text-rose-500" />
                  )}
                </div>
                <p className="text-xs text-zinc-500 mb-4 line-clamp-2">
                  {task.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                      <User className="w-3 h-3 text-zinc-400" />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {task.owner || 'Unassigned'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono">
                    #{task.id}
                  </span>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === col.id).length === 0 && (
              <div className="border border-dashed border-zinc-800 rounded-lg p-8 flex flex-col items-center justify-center text-zinc-700">
                <p className="text-xs italic">No tasks here</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
