import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Task, UpdateTaskProgressData, TaskPriority, TaskStatus } from '@factory-app/shared';
import { ApiEndpoints } from '../../api/endpoints-override';
import axios from 'axios';
import { RootState } from '../index';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,
};

const getAuthHeaders = (getState: () => RootState) => {
  const state = getState();
  const token = state.auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get<any[]>(
        ApiEndpoints.TASKS.LIST,
        { headers: getAuthHeaders(getState) }
      );
      // Transform API response to match Task interface
      return response.data.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        additionalInfo: task.additionalInfo,
        departmentId: task.departmentId,
        departmentName: task.departmentName,
        priority: task.priority,
        deadline: task.deadline,
        status: task.status,
        progressPercentage: task.progressPercentage,
        createdBy: task.createdBy,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch tasks');
    }
  }
);

export const fetchTaskDetail = createAsyncThunk(
  'tasks/fetchDetail',
  async (taskId: string, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get<any>(
        ApiEndpoints.TASKS.DETAIL(taskId),
        { headers: getAuthHeaders(getState) }
      );
      const task = response.data;
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        additionalInfo: task.additionalInfo,
        departmentId: task.departmentId,
        departmentName: task.departmentName,
        priority: task.priority,
        deadline: task.deadline,
        status: task.status,
        progressPercentage: task.progressPercentage,
        createdBy: task.createdBy,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch task');
    }
  }
);

export const updateTaskProgress = createAsyncThunk(
  'tasks/updateProgress',
  async ({ taskId, data }: { taskId: string; data: UpdateTaskProgressData }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.put(
        ApiEndpoints.TASKS.UPDATE_PROGRESS(taskId),
        data,
        { headers: getAuthHeaders(getState) }
      );
      const task = response.data;
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        additionalInfo: task.additionalInfo,
        departmentId: task.departmentId,
        departmentName: task.departmentName,
        priority: task.priority,
        deadline: task.deadline,
        status: task.status,
        progressPercentage: task.progressPercentage,
        createdBy: task.createdBy,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update task');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch tasks';
      })
      .addCase(fetchTaskDetail.fulfilled, (state, action) => {
        state.selectedTask = action.payload;
      })
      .addCase(updateTaskProgress.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        const index = state.tasks.findIndex((t) => t.id === updatedTask.id);
        if (index !== -1) {
          state.tasks[index] = updatedTask;
        }
        if (state.selectedTask?.id === updatedTask.id) {
          state.selectedTask = updatedTask;
        }
      });
  },
});

export const { clearSelectedTask } = taskSlice.actions;
export default taskSlice.reducer;
