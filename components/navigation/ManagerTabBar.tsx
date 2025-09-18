import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  dashboard: "grid",
  infohub: "file-text",
  calendar: "calendar",
  playerboard: "users",
  index: "home", // falls vorhanden
};

export default function ManagerTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const inset = useSafeAreaInsets();
  
  return (
    <View style={[styles.wrap, { paddingBottom: inset.bottom }]}>
      {state.routes.map((route, i) => {
        const isFocused = state.index === i;
        const onPress = () => {
          const event = navigation.emit({ 
            type: "tabPress", 
            target: route.key, 
            canPreventDefault: true 
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };
        const iconName = ICONS[route.name] ?? "circle";
        
        return (
          <TouchableOpacity 
            key={route.key} 
            onPress={onPress} 
            style={styles.item} 
            accessibilityRole="button" 
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <Feather 
              name={iconName} 
              size={24} 
              color={isFocused ? "#111827" : "#9CA3AF"} 
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    height: 49, // + safe-area bottom via paddingBottom
    alignItems: "center",
    justifyContent: "space-around",
  },
  item: { 
    height: 44, 
    width: 44, 
    alignItems: "center", 
    justifyContent: "center" 
  }, // 44pt Hitbox
});
