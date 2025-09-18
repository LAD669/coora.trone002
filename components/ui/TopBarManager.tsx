import React from "react";
import { Platform, View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

type Props = { 
  title: string; 
  onPressBell?: () => void; 
  onPressSettings?: () => void; 
};

export default function TopBarManager({ title, onPressBell, onPressSettings }: Props) {
  const inset = useSafeAreaInsets();
  const topPad = Platform.OS === "ios" 
    ? inset.top 
    : Math.max(inset.top, StatusBar.currentHeight ?? 0);
  
  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <StatusBar 
        translucent={false} 
        barStyle="dark-content" 
        backgroundColor="#fff" 
      />
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity 
            accessibilityLabel="Notifications" 
            style={styles.btn} 
            onPress={onPressBell} 
            hitSlop={8}
          >
            <Feather name="bell" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity 
            accessibilityLabel="Settings" 
            style={styles.btn} 
            onPress={onPressSettings} 
            hitSlop={8}
          >
            <Feather name="settings" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  row: {
    height: 56, // Content-Höhe (zzgl. Safe-Area oben)
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  title: { 
    fontSize: 28, 
    fontWeight: "700", 
    color: "#111827" 
  },
  actions: { 
    flexDirection: "row", 
    gap: 12 
  },
  btn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#F3F4F6" 
  },
});
