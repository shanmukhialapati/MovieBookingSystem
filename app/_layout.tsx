import { ThemeProvider } from "@/Context/ThemeContext";
import { Stack } from "expo-router";
import { AuthProvider } from "../Context/authContext";
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
