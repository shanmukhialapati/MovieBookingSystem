import { useTheme } from "@/Context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const { width } = Dimensions.get("window");

type AlertType = "success" | "warning" | "error" | "confirm";

interface Props {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const PremiumAlert: React.FC<Props> = ({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "CANCEL",
}) => {
  const { theme, dark } = useTheme();
  const isConfirmType = type === "confirm";

  const getTheme = () => {
    switch (type) {
      case "success":
        return { color: "#22c55e", icon: "checkmark-circle" };
      case "warning":
        return { color: "#f59e0b", icon: "warning" };
      case "error":
        return { color: "#ef4444", icon: "alert-circle" };
      case "confirm":
        return { color: theme.primary, icon: "help-circle" };
      default:
        return { color: theme.primary, icon: "information-circle" };
    }
  };

  const alertTheme = getTheme();

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={[
              styles.backdrop,
              { backgroundColor: dark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)" },
            ]}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.alertBox,
            {
              backgroundColor: theme.background,
              borderColor: theme.primary + "25",
            },
          ]}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={theme.subText} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <View
              style={[
                styles.mainCircle,
                {
                  borderColor: alertTheme.color,
                  backgroundColor: alertTheme.color + "20",
                },
              ]}
            >
              <Ionicons
                name={alertTheme.icon as any}
                size={36}
                color={alertTheme.color}
              />
            </View>
          </View>

          <View style={styles.textSection}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.message, { color: theme.subText }]}>
              {message}
            </Text>
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.subText + "20" }]}
          />

          <View
            style={[
              styles.buttonRow,
              !isConfirmType && { justifyContent: "center" },
            ]}
          >
            {isConfirmType && (
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.btn,
                  {
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: theme.subText + "30",
                  },
                ]}
              >
                <Text style={[styles.cancelText, { color: theme.subText }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onConfirm || onClose}
              style={[
                styles.btn,
                {
                  backgroundColor: alertTheme.color,
                  shadowColor: alertTheme.color,
                },
              ]}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  backdrop: {
    flex: 1,
  },

  alertBox: {
    width: Math.min(width - 40, 340),
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,

    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },

  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
  },

  iconContainer: {
    marginBottom: 16,
  },

  mainCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  textSection: {
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },

  message: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },

  divider: {
    width: "100%",
    height: 1,
    marginBottom: 16,
  },

  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },

  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  confirmText: {
    color: "#052e10",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },

  cancelText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
export default PremiumAlert;
