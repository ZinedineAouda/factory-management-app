export interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  overdueTasks: number;
  completedTasks: number;
}

export interface EfficiencyDataPoint {
  date: string;
  completed: number;
  inProgress: number;
  pending: number;
  efficiency: number;
}

export interface PriorityDistribution {
  high: number;
  medium: number;
  low: number;
}

