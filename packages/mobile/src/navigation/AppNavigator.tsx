import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import AuthNavigator from './AuthNavigator';
import WorkerNavigator from './WorkerNavigator';
import AdminNavigator from './AdminNavigator';
import { RootState } from '../store';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Route based on user role
  if (user?.role === 'admin') {
    return <AdminNavigator />;
  }

  return <WorkerNavigator />;
};

export default AppNavigator;

