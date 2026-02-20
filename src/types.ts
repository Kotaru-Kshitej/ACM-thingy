export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  owner: string;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface Blocker {
  id: number;
  task_id: number | null;
  description: string;
  reporter: string;
  resolved: boolean;
  created_at: string;
}

export interface Activity {
  id: number;
  user: string;
  action: string;
  details: string;
  created_at: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GitHubPull {
  id: number;
  title: string;
  user: string;
  state: string;
  created_at: string;
  url: string;
}

export interface GitHubStats {
  owner: string;
  repo: string;
  commits: GitHubCommit[];
  pulls: GitHubPull[];
}
