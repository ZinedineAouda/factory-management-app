import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import TaskManagementScreen from '../screens/admin/TaskManagementScreen';
import TaskCreateScreen from '../screens/admin/TaskCreateScreen';
import CodeGenerationScreen from '../screens/admin/CodeGenerationScreen';

export type AdminStackParamList = {
  Dashboard: undefined;
  TaskManagement: undefined;
  TaskCreate: undefined;
  TaskEdit: { taskId: string };
  CodeGeneration: undefined;
};

const Stack = createStackNavigator<AdminStackParamList>();

const AdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen}
        options={{ title: 'Admin Dashboard' }}
      />
      <Stack.Screen 
        name="TaskManagement" 
        component={TaskManagementScreen}
        options={{ title: 'Task Management' }}
      />
      <Stack.Screen 
        name="TaskCreate" 
        component={TaskCreateScreen}
        options={{ title: 'Create Task' }}
      />
      <Stack.Screen 
        name="CodeGeneration" 
        component={CodeGenerationScreen}
        options={{ title: 'Generate Codes' }}
      />
    </Stack.Navigator>
  );
};

export default AdminNavigator;

