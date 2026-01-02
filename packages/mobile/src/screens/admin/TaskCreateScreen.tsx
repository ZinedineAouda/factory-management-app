import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Text } from 'react-native-paper';

const TaskCreateScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction />
        <Appbar.Content title="Create Task" />
      </Appbar.Header>
      <View style={styles.content}>
        <Text>Task Create Screen - To be implemented</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TaskCreateScreen;

