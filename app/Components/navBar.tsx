import { useAuth } from "@/Context/authContext";
import { useTheme } from "@/Context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PremiumAlert from "../Components/PremiumAlert";
type AlertType = "success" | "warning" | "error" | "confirm";

interface NavbarProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

const Navbar: React.FC<NavbarProps> = ({ search, setSearch }) => {
  const { theme, dark, toggleTheme } = useTheme();
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = (
    type: AlertType | "confirm",
    title: string,
    message: string,
    onConfirm?: () => void,
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onConfirm,
    });
  };
  const handleProfilePress = () => {
    if (isLoading) return;

    if (user) {
      setShowMenu(true);
    } else {
      router.push("/login");
    }
  };
  const handleLogoutAction = async () => {
    try {
      setShowMenu(false);
      setAlertConfig((prev) => ({ ...prev, visible: false }));

      await logout();

      router.replace("/login");
    } catch (err) {
      console.log("Logout error:", err);
    }
  };
  const triggerLogoutConfirm = () => {
    setShowMenu(false);
    showAlert(
      "confirm",
      "Sign Out",
      "Are you sure you want to log out?",
      handleLogoutAction,
    );
  };
  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.topRow}>
          <Text style={[styles.heading, { color: theme.text }]}>
            CINE<Text style={{ color: theme.primary }}>VAULT</Text>
          </Text>
          {Platform.OS === "web" && (
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: theme.inputBg },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.subText} />
              <TextInput
                placeholder="Search movies..."
                placeholderTextColor={theme.subText}
                style={[styles.input, { color: theme.text, outline: "none" }]}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          )}

          <View style={styles.rightIcons}>
            <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 15 }}>
              <Ionicons
                name={dark ? "sunny" : "moon"}
                size={24}
                color={theme.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleProfilePress}>
              <Ionicons
                name={user ? "person-circle" : "person-circle-outline"}
                size={32}
                color={user ? theme.primary : theme.subText}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)}>
          <Pressable
            style={styles.popupContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.popup,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.primary + "30",
                },
              ]}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMenu(false)}
              >
                <Ionicons name="close" size={20} color={theme.subText} />
              </TouchableOpacity>

              <LinearGradient
                colors={
                  dark
                    ? [theme.primary, theme.primary + "80"]
                    : [theme.primary + "CC", theme.primary]
                }
                style={styles.avatarLarge}
              >
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </LinearGradient>

              <Text style={[styles.name, { color: theme.text }]}>
                {user?.name || "User Name"}
              </Text>
              <Text style={[styles.email, { color: theme.subText }]}>
                {user?.email || "user@example.com"}
              </Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  router.push("/Components/MyTickets");
                  setShowMenu(false);
                }}
              >
                <Ionicons name="card" size={20} color={theme.text} />
                <Text style={[styles.menuItemText, { color: theme.text }]}>
                  My Tickets
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.subText + "20" },
                ]}
              />

              <TouchableOpacity
                style={[
                  styles.logoutBtn,
                  {
                    backgroundColor: dark ? "#ff444420" : "#ff444410",
                    borderColor: "#ff4444",
                  },
                ]}
                onPress={triggerLogoutConfirm}
              >
                <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <PremiumAlert
        visible={alertConfig.visible}
        type={alertConfig.type as any}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.type === "confirm" ? "LOGOUT" : "OK"}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        onConfirm={alertConfig.onConfirm}
      />
    </>
  );
};

export default Navbar;

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "android" ? 30 : 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(134, 132, 132, 0.45)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  heading: {
    fontSize: 26,
    fontWeight: "900",
  },
  accent: { color: "#00E676" },

  searchContainer: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  input: {
    marginLeft: 10,
    flex: 1,
    fontSize: 16,
    height: 30,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  popupContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 90 : 80,
    right: 16,
  },

  popup: {
    width: Platform.OS === "web" ? 300 : 200,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },

  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },

  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },

  email: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },

  statLabel: {
    fontSize: 11,
  },

  statDivider: {
    width: 1,
    height: 30,
  },

  divider: {
    height: 1,
    width: "100%",
    marginVertical: 12,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: "100%",
    borderRadius: 10,
    gap: 12,
  },

  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    width: "100%",
    borderWidth: 1,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ff4444",
  },

  inputBox: {
    // backgroundColor: "#033D2E",
    // color: "#fff",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },

  btn: {
    // backgroundColor: "#22c55e",
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },

  btnText: {
    textAlign: "center",
    fontWeight: "700",
  },

  switchText: {
    color: "#86efac",
    marginTop: 10,
    textAlign: "center",
  },

  userText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  userSub: {
    color: "#86efac",
    marginBottom: 20,
  },
});
