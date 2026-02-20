import React from 'react';
import { GitHubStats } from '../types';
import { GitBranch, GitCommit, GitPullRequest, ExternalLink, Github } from 'lucide-react';

interface GitHubDashboardProps {
  stats: GitHubStats | null;
  loading: boolean;
  error: string | null;
}

export const GitHubDashboard: React.FC<GitHubDashboardProps> = ({ stats, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-4">
        <Github className="w-8 h-8 text-zinc-700 animate-pulse" />
        <p className="text-zinc-500 text-sm italic">Fetching GitHub insights...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <Github className="w-8 h-8 text-zinc-800 mx-auto mb-4" />
        <p className="text-zinc-600 text-sm italic">{error || 'Connect a GitHub repository to see insights.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Github className="w-5 h-5 text-white" />
          <h2 className="text-lg font-bold tracking-tight">
            {stats.owner} / {stats.repo}
          </h2>
        </div>
        <a 
          href={`https://github.com/${stats.owner}/${stats.repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          View on GitHub <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Commits */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Recent Commits</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {stats.commits.map((commit) => (
              <a 
                key={commit.sha}
                href={commit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 block hover:bg-zinc-800/50 transition-colors"
              >
                <p className="text-sm text-zinc-200 line-clamp-1 mb-1">{commit.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-medium">{commit.author}</span>
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {new Date(commit.date).toLocaleDateString()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Pull Requests */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pull Requests</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {stats.pulls.length === 0 ? (
              <div className="p-8 text-center text-zinc-600 text-xs italic">No pull requests found.</div>
            ) : (
              stats.pulls.map((pull) => (
                <a 
                  key={pull.id}
                  href={pull.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 block hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm text-zinc-200 line-clamp-1">{pull.title}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold ${
                      pull.state === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {pull.state}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-medium">{pull.user}</span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(pull.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
