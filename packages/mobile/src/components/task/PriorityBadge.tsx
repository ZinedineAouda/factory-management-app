import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { TaskPriority, PriorityConfig } from '@factory-app/shared';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const config = PriorityConfig[priority];

  return (
    <Chip
      style={[
        styles.badge,
        { backgroundColor: config.backgroundColor },
      ]}
      textStyle={[styles.text, { color: config.color }]}
    >
      {config.label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  badge: {
    height: 24,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PriorityBadge;

