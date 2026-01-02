import { TaskPriority } from '../types';
import { Colors } from './colors';

export const PriorityConfig = {
  [TaskPriority.HIGH]: {
    label: 'High',
    color: Colors.error,
    backgroundColor: '#FFEBEE',
  },
  [TaskPriority.MEDIUM]: {
    label: 'Medium',
    color: Colors.warning,
    backgroundColor: '#FFF3E0',
  },
  [TaskPriority.LOW]: {
    label: 'Low',
    color: Colors.success,
    backgroundColor: '#E8F5E9',
  },
} as const;

