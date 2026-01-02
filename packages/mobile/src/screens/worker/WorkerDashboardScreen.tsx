import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Card, Text } from 'react-native-paper';

const WorkerDashboardScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Department Overview" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              This Week Summary
            </Text>
            <Text variant="headlineMedium" style={styles.statValue}>
              12 / 20
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Tasks Completed
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Task Status Distribution
            </Text>
            <Text variant="bodyMedium" style={styles.chartPlaceholder}>
              📊 Pie Chart: Completed, In Progress, Pending
            </Text>
            <Text variant="bodySmall" style={styles.note}>
              Summary view only - No detailed analytics
            </Text>
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
  cardTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  statLabel: {
    color: '#666',
  },
  chartPlaceholder: {
    textAlign: 'center',
    padding: 32,
    color: '#999',
  },
  note: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
});

export default WorkerDashboardScreen;

