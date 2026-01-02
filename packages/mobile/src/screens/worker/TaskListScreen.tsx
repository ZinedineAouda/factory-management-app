import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Appbar, Menu, Avatar } from 'react-native-paper';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import TaskCard from '../../components/task/TaskCard';
import { fetchTasks } from '../../store/slices/taskSlice';
import { logout } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';

type NavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

const TaskListScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();
  const { tasks, loading } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);
  const [menuVisible, setMenuVisible] = React.useState(false);

  useEffect(() => {
    dispatch(fetchTasks() as any);
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchTasks() as any);
  };

  const handleTaskPress = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };

  const handleLogout = () => {
    dispatch(logout());
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="My Tasks" />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon={() => (
                <Avatar.Text
                  size={32}
                  label={user?.email?.charAt(0).toUpperCase() || 'U'}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                />
              )}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={handleLogout}
            title="Logout"
            leadingIcon="logout"
            titleStyle={{ color: '#F44336' }}
          />
        </Menu>
      </Appbar.Header>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard task={item} onPress={() => handleTaskPress(item.id)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No tasks assigned
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#999',
  },
});

export default TaskListScreen;

