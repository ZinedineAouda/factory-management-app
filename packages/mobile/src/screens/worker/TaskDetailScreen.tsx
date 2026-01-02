import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Appbar, Card, Text, Slider, Button, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { fetchTaskDetail, updateTaskProgress } from '../../store/slices/taskSlice';
import PriorityBadge from '../../components/task/PriorityBadge';
import { RootState, AppDispatch } from '../../store';

type RouteProp = { params: { taskId: string } };
type NavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

const TaskDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedTask, loading } = useSelector((state: RootState) => state.tasks);
  const [progress, setProgress] = useState(0);
  const [updateText, setUpdateText] = useState('');

  useEffect(() => {
    dispatch(fetchTaskDetail(route.params.taskId));
  }, [dispatch, route.params.taskId]);

  useEffect(() => {
    if (selectedTask) {
      setProgress(selectedTask.progressPercentage);
    }
  }, [selectedTask]);

  const handleSave = async () => {
    if (selectedTask) {
      await dispatch(updateTaskProgress({
        taskId: selectedTask.id,
        data: { progressPercentage: progress, updateText },
      }));
      navigation.goBack();
    }
  };

  if (!selectedTask) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Task Details" />
        </Appbar.Header>
        <View style={styles.center}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Task Details" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              {selectedTask.title}
            </Text>
            <View style={styles.badgeContainer}>
              <PriorityBadge priority={selectedTask.priority} />
            </View>

            <Text variant="bodyMedium" style={styles.label}>
              📅 Deadline: {new Date(selectedTask.deadline).toLocaleDateString()}
            </Text>
            <Text variant="bodyMedium" style={styles.label}>
              📍 Department: {selectedTask.departmentName || 'N/A'}
            </Text>

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Description
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {selectedTask.description}
            </Text>

            {selectedTask.additionalInfo && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Additional Information
                </Text>
                <Text variant="bodyMedium" style={styles.description}>
                  {selectedTask.additionalInfo}
                </Text>
              </>
            )}

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Progress: {progress}%
            </Text>
            <Slider
              value={progress}
              onValueChange={setProgress}
              minimumValue={0}
              maximumValue={100}
              step={1}
              style={styles.slider}
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Work Update
            </Text>
            <TextInput
              label="Describe your work"
              value={updateText}
              onChangeText={setUpdateText}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.textInput}
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              style={styles.saveButton}
            >
              Save Progress
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  badgeContainer: {
    marginVertical: 12,
  },
  label: {
    marginBottom: 8,
    color: '#666',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '600',
  },
  description: {
    color: '#666',
    lineHeight: 22,
  },
  slider: {
    marginVertical: 16,
  },
  textInput: {
    marginTop: 8,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TaskDetailScreen;

