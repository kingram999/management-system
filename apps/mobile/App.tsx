import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>RamSai Public School</Text>
      <Text style={styles.title}>Mobile app shell</Text>
      <Text style={styles.body}>
        Phase 1 focuses on the web admin portal. Parent and teacher mobile
        screens will be added in a later phase.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef5f1",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 24,
  },
  eyebrow: {
    color: "#0f6b4c",
    fontWeight: "700",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#14231c",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5d7268",
  },
});
