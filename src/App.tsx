import React, { useState, useEffect, useCallback } from 'react';
import { Task, Blocker, Activity, TaskStatus, GitHubStats } from './types';
import { api } from './services/api';
import { useWebSockets } from './hooks/useWebSockets';
import { ProjectSummary } from './components/ProjectSummary';
import { TaskBoard } from './components/TaskBoard';
import { BlockerList } from './components/BlockerList';
import { ActivityFeed } from './components/ActivityFeed';
import { GitHubDashboard } from './components/GitHubDashboard';
import { LayoutDashboard, Plus, ShieldAlert, User, X, Github, Settings, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('pulse_user') || `User_${Math.floor(Math.random() * 1000)}`;
  });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);

  const fetchGitHubStats = async () => {
    setGithubLoading(true);
    setGithubError(null);
    try {
      const stats = await api.getGitHubStats();
      setGithubStats(stats);
    } catch (err) {
      console.error('GitHub fetch error:', err);
      setGithubError('Could not fetch GitHub data. Check the URL or API limits.');
      setGithubStats(null);
    } finally {
      setGithubLoading(false);
    }
  };

  const fetchData = async () => {
    const [t, b, a, settings] = await Promise.all([
      api.getTasks(),
      api.getBlockers(),
      api.getActivity(),
      api.getSettings()
    ]);
    setTasks(t);
    setBlockers(b);
    setActivities(a);
    
    if (settings.github_repo) {
      setGithubUrl(settings.github_repo);
      fetchGitHubStats();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'TASK_CREATED':
        setTasks(prev => [data.payload, ...prev]);
        break;
      case 'TASK_UPDATED':
        setTasks(prev => prev.map(t => t.id === data.payload.id ? data.payload : t));
        break;
      case 'BLOCKER_CREATED':
        setBlockers(prev => [data.payload, ...prev]);
        break;
      case 'BLOCKER_RESOLVED':
        setBlockers(prev => prev.filter(b => b.id !== parseInt(data.payload.id)));
        break;
      case 'ACTIVITY_NEW':
        setActivities(prev => [data.payload, ...prev].slice(0, 50));
        break;
    }
  }, []);

  useWebSockets(handleWebSocketMessage);

  const updateTaskStatus = async (id: number, status: TaskStatus) => {
    await api.updateTask(id, { status, owner: currentUser });
  };

  const resolveBlocker = async (id: number) => {
    await api.resolveBlocker(id, currentUser);
  };

  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as const });
  const [newBlocker, setNewBlocker] = useState({ description: '', task_id: null as number | null });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createTask({ ...newTask, owner: currentUser });
    setIsTaskModalOpen(false);
    setNewTask({ title: '', description: '', priority: 'medium' });
  };

  const handleCreateBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createBlocker({ ...newBlocker, reporter: currentUser });
    setIsBlockerModalOpen(false);
    setNewBlocker({ description: '', task_id: null });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await api.updateSetting('github_repo', githubUrl);
      await fetchGitHubStats();
      setIsSettingsOpen(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <LayoutDashboard className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter">PROJECT PULSE</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
              <User className="w-3 h-3 text-zinc-500" />
              <input 
                type="text" 
                value={currentUser}
                onChange={(e) => {
                  setCurrentUser(e.target.value);
                  localStorage.setItem('pulse_user', e.target.value);
                }}
                className="bg-transparent border-none text-xs font-medium focus:outline-none w-24 text-zinc-300"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <ProjectSummary tasks={tasks} blockers={blockers} activities={activities} githubStats={githubStats} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            <section>
              <GitHubDashboard stats={githubStats} loading={githubLoading} error={githubError} />
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-emerald-500" />
                  Internal Tasks
                </h2>
              </div>
              <TaskBoard 
                tasks={tasks} 
                onUpdateStatus={updateTaskStatus} 
                onAddTask={() => setIsTaskModalOpen(true)}
              />
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <BlockerList 
              blockers={blockers} 
              onResolve={resolveBlocker} 
              onAddBlocker={() => setIsBlockerModalOpen(true)}
            />
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">New Task</h3>
                <button onClick={() => setIsTaskModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Title</label>
                  <input 
                    required
                    type="text" 
                    value={newTask.title}
                    onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="What needs to be done?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Description</label>
                  <textarea 
                    value={newTask.description}
                    onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors h-24 resize-none"
                    placeholder="Add more details..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Priority</label>
                  <select 
                    value={newTask.priority}
                    onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  Create Task
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isBlockerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBlockerModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <h3 className="text-lg font-bold">Flag Blocker</h3>
                </div>
                <button onClick={() => setIsBlockerModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateBlocker} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">What's blocking you?</label>
                  <textarea 
                    required
                    value={newBlocker.description}
                    onChange={e => setNewBlocker(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:border-rose-500 focus:outline-none transition-colors h-32 resize-none"
                    placeholder="Describe the issue clearly..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Related Task (Optional)</label>
                  <select 
                    value={newBlocker.task_id || ''}
                    onChange={e => setNewBlocker(prev => ({ ...prev, task_id: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:border-rose-500 focus:outline-none transition-colors"
                  >
                    <option value="">None</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                >
                  Flag Blocker
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-zinc-400" />
                  <h3 className="text-lg font-bold">Project Settings</h3>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">GitHub Repository URL</label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="url" 
                      value={githubUrl}
                      onChange={e => setGithubUrl(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                      placeholder="https://github.com/owner/repo"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2 italic">
                    Connect a public repository to sync commits and pull requests.
                  </p>
                </div>
                <button 
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            Project Pulse Command Center &copy; 2026. Built for high-velocity student teams.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">System Online</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
