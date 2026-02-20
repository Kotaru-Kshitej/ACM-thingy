import { Task, Blocker, Activity, GitHubStats } from "../types";

export const api = {
  async getTasks(): Promise<Task[]> {
    const res = await fetch("/api/tasks");
    return res.json();
  },
  async createTask(task: Partial<Task>): Promise<Task> {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    return res.json();
  },
  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async getBlockers(): Promise<Blocker[]> {
    const res = await fetch("/api/blockers");
    return res.json();
  },
  async createBlocker(blocker: Partial<Blocker>): Promise<Blocker> {
    const res = await fetch("/api/blockers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blocker),
    });
    return res.json();
  },
  async resolveBlocker(id: number, user: string): Promise<void> {
    await fetch(`/api/blockers/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    });
  },
  async getActivity(): Promise<Activity[]> {
    const res = await fetch("/api/activity");
    return res.json();
  },
  async getSettings(): Promise<Record<string, string>> {
    const res = await fetch("/api/settings");
    return res.json();
  },
  async updateSetting(key: string, value: string): Promise<void> {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  },
  async getGitHubStats(): Promise<GitHubStats> {
    const res = await fetch("/api/github/stats");
    if (!res.ok) throw new Error("Failed to fetch GitHub stats");
    return res.json();
  },
};
