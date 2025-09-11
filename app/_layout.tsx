import { Slot } from 'expo-router';
import { View, Text } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000000' }}>
        COORA Test
      </Text>
      <Text style={{ fontSize: 16, color: '#666666', marginTop: 10 }}>
        App lädt...
      </Text>
      <Slot />
    </View>
  );
}