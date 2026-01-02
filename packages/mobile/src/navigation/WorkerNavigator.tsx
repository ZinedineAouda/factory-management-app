import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TaskListScreen from '../screens/worker/TaskListScreen';
import TaskDetailScreen from '../screens/worker/TaskDetailScreen';
import WorkerDashboardScreen from '../screens/worker/WorkerDashboardScreen';
import { logout } from '../store/slices/authSlice';

export type WorkerStackParamList = {
  TaskList: undefined;
  TaskDetail: { taskId: string };
  Dashboard: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<WorkerStackParamList>();

const TaskStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="TaskList" 
      component={TaskListScreen}
      options={{ title: 'My Tasks' }}
    />
    <Stack.Screen 
      name="TaskDetail" 
      component={TaskDetailScreen}
      options={{ title: 'Task Details' }}
    />
  </Stack.Navigator>
);

const WorkerNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Tasks') {
            iconName = 'assignment';
          } else if (route.name === 'Charts') {
            iconName = 'bar-chart';
          } else {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Tasks" component={TaskStack} />
      <Tab.Screen name="Charts" component={WorkerDashboardScreen} />
      <Tab.Screen name="Profile" component={TaskListScreen} />
    </Tab.Navigator>
  );
};

export default WorkerNavigator;

