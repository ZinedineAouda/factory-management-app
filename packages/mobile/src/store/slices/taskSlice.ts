import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Task, UpdateTaskProgressData } from '@factory-app/shared';
import { ApiEndpoints } from '@factory-app/shared';
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

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    
    const response = await axios.get<Task[]>(ApiEndpoints.TASKS.LIST, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
);

export const fetchTaskDetail = createAsyncThunk(
  'tasks/fetchDetail',
  async (taskId: string, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    
    const response = await axios.get<Task>(ApiEndpoints.TASKS.DETAIL(taskId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
);

export const updateTaskProgress = createAsyncThunk(
  'tasks/updateProgress',
  async ({ taskId, data }: { taskId: string; data: UpdateTaskProgressData }, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    
    const response = await axios.put(
      ApiEndpoints.TASKS.UPDATE_PROGRESS(taskId),
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
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
        state.error = action.error.message || 'Failed to fetch tasks';
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

