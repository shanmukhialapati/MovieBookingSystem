import { authApi } from "@/axios/axiosInstance";
import { useAuth } from "@/Context/authContext";
import { useTheme } from "@/Context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

const Orb: React.FC<{
  size: number;
  color: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  delay?: number;
}> = ({ size, color, top, left, right, bottom, delay = 0 }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.25],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        top,
        left,
        right,
        bottom,
        transform: [{ scale }],
        opacity,
      }}
      pointerEvents="none"
    />
  );
};

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  secure?: boolean;
  onToggleSecure?: () => void;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
  editable?: boolean;
  theme: any;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  secure,
  onToggleSecure,
  keyboardType = "default",
  autoCapitalize = "none",
  editable = true,
  theme,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputWrapper}>
      <Text
        style={[
          styles.label,
          { color: isFocused ? theme.primary : theme.subText },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.inputBg,
            borderColor: error
              ? "#ff4444"
              : isFocused
                ? theme.primary
                : "transparent",
            borderWidth: 1,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isFocused ? theme.primary : theme.subText}
        />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.subText + "77"}
          style={[styles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {onToggleSecure && (
          <TouchableOpacity onPress={onToggleSecure}>
            <Ionicons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={theme.subText}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { theme, dark } = useTheme();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [secure, setSecure] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!isLogin) {
      if (!trimmedName) {
        e.name = "Full name is required";
      } else if (trimmedName.length < 2) {
        e.name = "Name must be at least 2 characters";
      } else if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
        e.name = "Only letters and spaces allowed";
      }
    }

    if (!trimmedEmail) {
      e.email = "Email is required";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmedEmail)
    ) {
      e.email = "Enter a valid email address";
    }

    if (!trimmedPassword) {
      e.password = "Password is required";
    } else if (trimmedPassword.length < 6) {
      e.password = "Minimum 6 characters";
    }
    // else if (!/[A-Z]/.test(trimmedPassword)) {
    //   e.password = "Include at least 1 uppercase letter";
    // }
    // else if (!/[0-9]/.test(trimmedPassword)) {
    //   e.password = "Include at least 1 number";
    // }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAuth = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      setErrors({});
      let res;
      if (isLogin) {
        res = await authApi.post("/auth/login", { email, password });
      } else {
        res = await authApi.post("/auth/register", { name, email, password });
      }
      await login(res.data);
      router.replace("/");
    } catch (err: any) {
      setErrors({
        api:
          err?.response?.data?.error ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };
  const clearError = (field: string) => {
    if (errors[field])
      setErrors((p) => {
        const n = { ...p };
        delete n[field];
        return n;
      });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Orb size={300} color={theme.primary} top={-100} left={-100} />
      <Orb
        size={250}
        color={theme.secondary || theme.primary}
        bottom={-50}
        right={-50}
        delay={1000}
      />

      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.brandWrap}>
          <Text style={[styles.brandName, { color: theme.text }]}>
            CINE<Text style={{ color: theme.primary }}>VAULT</Text>
          </Text>
          <Text style={[styles.brandTagline, { color: theme.subText }]}>
            YOUR WORLD OF CINEMA
          </Text>
        </View>

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: dark
                ? "rgba(28, 28, 35, 0.9)"
                : "rgba(255, 255, 255, 0.95)",
              borderColor: theme.primary + "33",
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.primary, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardTopLine}
          />

          <View
            style={[styles.modePillWrap, { backgroundColor: theme.inputBg }]}
          >
            <TouchableOpacity
              style={[
                styles.modePill,
                isLogin && { backgroundColor: theme.primary },
              ]}
              onPress={() => setIsLogin(true)}
            >
              <Text
                style={[
                  styles.modePillText,
                  { color: isLogin ? "#fff" : theme.subText },
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modePill,
                !isLogin && { backgroundColor: theme.primary },
              ]}
              onPress={() => setIsLogin(false)}
            >
              <Text
                style={[
                  styles.modePillText,
                  { color: !isLogin ? "#fff" : theme.subText },
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </Text>

          {!isLogin && (
            <InputField
              label="Full Name"
              value={name}
              onChangeText={(t) => {
                setName(t);
                clearError("name");
              }}
              placeholder="John Doe"
              icon="person-outline"
              theme={theme}
              error={errors.name}
            />
          )}

          <InputField
            label="Email Address"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              clearError("email");
            }}
            placeholder="hello@cinevault.com"
            icon="mail-outline"
            keyboardType="email-address"
            theme={theme}
            error={errors.email}
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              clearError("password");

              if (t && t.length < 6) {
                setErrors((p) => ({
                  ...p,
                  password: "Minimum 6 characters",
                }));
              }
            }}
            placeholder="••••••••"
            icon="lock-closed-outline"
            secure={secure}
            onToggleSecure={() => setSecure(!secure)}
            theme={theme}
            error={errors.password}
          />
          {errors.api && (
            <Text
              style={{ color: "#ff4444", textAlign: "center", marginTop: 10 }}
            >
              {errors.api}
            </Text>
          )}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleAuth}
            disabled={loading}
          >
            <LinearGradient
              colors={[theme.primary, theme.primary + "cc"]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.submitText}>
                    {isLogin ? "Login" : "Register"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#fff"
                    style={{ marginLeft: 5 }}
                  />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  backBtn: {
    position: "absolute",
    top: 0,
    left: 0,
    marginTop: 30,
    marginLeft: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  brandWrap: { alignItems: "center", marginVertical: 30 },
  brandName: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 4,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-black",
  },
  brandTagline: { fontSize: 10, letterSpacing: 2, marginTop: 5 },
  card: {
    width: Platform.OS === "web" ? 400 : 300,
    justifyContent: "center",
    marginHorizontal: 20,
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTopLine: { height: 4, width: "100%", borderRadius: 2, marginBottom: 25 },
  modePillWrap: {
    flexDirection: "row",
    padding: 2,
    borderRadius: 15,
    marginBottom: 25,
  },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  modePillText: { fontWeight: "700", fontSize: 14 },
  title: { fontSize: 21, fontWeight: "800", marginBottom: 20 },
  inputWrapper: { marginBottom: 18 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 15,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  submitBtn: { marginTop: 10, borderRadius: 18, overflow: "hidden" },
  submitGradient: { paddingVertical: 16, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  errorText: { color: "#ff4444", fontSize: 11, marginTop: 5, marginLeft: 5 },
});
