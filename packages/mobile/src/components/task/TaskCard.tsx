import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Task, PriorityConfig } from '@factory-app/shared';
import PriorityBadge from './PriorityBadge';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Card.Title
            title={task.title}
            subtitle={
              <View style={styles.subtitleContainer}>
                <PriorityBadge priority={task.priority} />
                <Text variant="bodySmall" style={styles.deadline}>
                  📅 Due: {formatDate(task.deadline)}
                </Text>
              </View>
            }
          />
          <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
          {task.progressPercentage > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${task.progressPercentage}%` },
                  ]}
                />
              </View>
              <Text variant="bodySmall" style={styles.progressText}>
                {task.progressPercentage}%
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

import { View } from 'react-native';

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  deadline: {
    color: '#666',
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    color: '#666',
    minWidth: 40,
  },
});

export default TaskCard;

