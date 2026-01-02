import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Text } from 'react-native-paper';

const CodeGenerationScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction />
        <Appbar.Content title="Generate Codes" />
      </Appbar.Header>
      <View style={styles.content}>
        <Text>Code Generation Screen - To be implemented</Text>
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

export default CodeGenerationScreen;

