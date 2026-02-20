import React, { useState, useEffect } from 'react';
import { GitHubStats } from '../types';
import { GitBranch, GitCommit, GitPullRequest, ExternalLink, Github, Sparkles, TrendingUp, Zap, AlertCircle, Loader2, Clock, User } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface GitHubDashboardProps {
  stats: GitHubStats | null;
  loading: boolean;
  error: string | null;
}

export const GitHubDashboard: React.FC<GitHubDashboardProps> = ({ stats, loading, error }) => {
  const [insights, setInsights] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeCommits = async () => {
    if (!stats || stats.commits.length === 0) return;
    
    setAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `
        Analyze the following recent GitHub commits and pull requests for a student project.
        Provide a "Deep Insight" that isn't obvious from just looking at a list.
        
        Look for:
        1. Development Velocity: Are they moving fast or stuck on small fixes?
        2. Collaboration Patterns: Is one person doing everything? Are they reviewing each other's work?
        3. Technical Focus: Are they focusing on UI, Backend, Refactoring, or Bug fixes?
        4. Risks: Any signs of "last-minute crunch", "scope creep", or "technical debt"?
        5. Developer Vibe: Does the project feel healthy, chaotic, or stagnant?
        
        Commits: ${JSON.stringify(stats.commits.map(c => ({ msg: c.message, author: c.author, date: c.date })))}
        Pull Requests: ${JSON.stringify(stats.pulls.map(p => ({ title: p.title, state: p.state, user: p.user })))}
        
        Format the output as a concise 3-4 sentence analysis. 
        Start with a "Vibe Check" (e.g., "Vibe Check: High Velocity, Low Collaboration").
        Be critical but constructive.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setInsights(response.text || 'Unable to generate insights.');
    } catch (err) {
      console.error('Error analyzing commits:', err);
      setInsights('Failed to analyze repository activity.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (stats) {
      analyzeCommits();
    }
  }, [stats?.commits?.[0]?.sha]);

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
        <div className="flex items-center gap-4">
          <button 
            onClick={analyzeCommits}
            disabled={analyzing}
            className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-400 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Refresh Analysis
          </button>
          <a 
            href={`https://github.com/${stats.owner}/${stats.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
          >
            View on GitHub <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/20 rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles className="w-12 h-12 text-emerald-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">AI Pulse Analysis</h3>
          </div>
          <p className="text-zinc-200 text-sm leading-relaxed font-medium">
            {analyzing ? (
              <span className="flex items-center gap-2 italic text-zinc-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Synthesizing repository patterns...
              </span>
            ) : insights || 'No insights generated yet.'}
          </p>
        </div>
      </div>

      {/* Derived Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Velocity</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-lg font-bold">
              {(stats.commits.length / 7).toFixed(1)} <span className="text-xs font-normal text-zinc-500">c/day</span>
            </span>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Active PRs</span>
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-amber-500" />
            <span className="text-lg font-bold">
              {stats.pulls.filter(p => p.state === 'open').length}
            </span>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Contributors</span>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-lg font-bold">
              {new Set(stats.commits.map(c => c.author)).size}
            </span>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Last Activity</span>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-bold">
              {stats.commits[0] ? new Date(stats.commits[0].date).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Commits */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
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

        {/* Contributor Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Team Contribution</h3>
          </div>
          <div className="p-4 space-y-4">
            {Object.entries(
              stats.commits.reduce((acc: Record<string, number>, c) => {
                acc[c.author] = (acc[c.author] || 0) + 1;
                return acc;
              }, {})
            )
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .map(([author, count]) => (
              <div key={author} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-zinc-400">{author}</span>
                  <span className="text-zinc-500">{count} commits</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${((count as number) / stats.commits.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
  );
};
