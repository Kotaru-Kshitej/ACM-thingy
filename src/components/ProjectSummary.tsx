import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Task, Blocker, Activity, GitHubStats } from "../types";
import { Sparkles, Loader2 } from 'lucide-react';

interface ProjectSummaryProps {
  tasks: Task[];
  blockers: Blocker[];
  activities: Activity[];
  githubStats: GitHubStats | null;
}

export const ProjectSummary: React.FC<ProjectSummaryProps> = ({ tasks, blockers, activities, githubStats }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `
        You are a project manager for a student team. 
        Based on the following project state, provide a concise "Project Story" summary (2-3 sentences).
        Highlight the overall progress, any critical blockers, and who is currently most active.
        
        Internal Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, status: t.status, owner: t.owner })))}
        Internal Blockers: ${JSON.stringify(blockers.map(b => b.description))}
        Internal Recent Activity: ${JSON.stringify(activities.slice(0, 5).map(a => ({ user: a.user, action: a.action })))}
        
        GitHub Insights: ${githubStats ? JSON.stringify({
          repo: `${githubStats.owner}/${githubStats.repo}`,
          recentCommits: githubStats.commits.slice(0, 3).map(c => ({ msg: c.message, author: c.author })),
          openPRs: githubStats.pulls.filter(p => p.state === 'open').length
        }) : 'No GitHub data connected.'}
        
        Make it sound encouraging but professional. Integrate the GitHub activity if available.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setSummary(response.text || 'No summary available.');
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Failed to generate project pulse summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tasks.length > 0) {
      generateSummary();
    }
  }, [tasks.length, blockers.length]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Project Pulse
        </h2>
        <button 
          onClick={generateSummary}
          disabled={loading}
          className="text-xs text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh AI Summary'}
        </button>
      </div>
      <p className="text-zinc-100 text-lg leading-relaxed font-light italic">
        {loading ? 'Analyzing project state...' : summary || 'Start adding tasks to see your project story unfold.'}
      </p>
    </div>
  );
};
