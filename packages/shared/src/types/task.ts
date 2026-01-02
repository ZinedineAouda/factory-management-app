export enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  additionalInfo?: string;
  departmentId: string;
  departmentName?: string;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  progressPercentage: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  userId: string;
  progressPercentage?: number;
  updateText: string;
  createdAt: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  additionalInfo?: string;
  departmentId: string;
  priority: TaskPriority;
  deadline: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: TaskStatus;
}

export interface UpdateTaskProgressData {
  progressPercentage: number;
  updateText: string;
}

