import { mainApi } from "@/axios/axiosInstance";
import { useTheme } from "@/Context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import Navbar from "../Components/navBar";

const { width } = Dimensions.get("window");
type FoodItem = {
  name: string;
  price: number;
  quantity: number;
};
type BookingData = {
  bookingDate: string;
  bookingId: number;
  bookingStatus: string;
  movieName: string;
  seatNumbers: string[];
  showTime: string;
  theaterName: string;

  userName: string;
  ticketAmount: number;
  foodAmount: number;
  discountAmount: number;
  totalPrice: number;
  couponCode: string;
  foodItems: FoodItem[];
};

const StepBar = ({ theme }: { theme: any }) => (
  <View
    style={[
      stepStyles.row,
      {
        borderBottomColor: theme.card,
        backgroundColor: theme.background,
      },
    ]}
  >
    {["Movie", "Seats", "Payment"].map((label) => (
      <React.Fragment key={label}>
        <View style={stepStyles.item}>
          <View
            style={[stepStyles.circleDone, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="checkmark" size={11} color={theme.background} />
          </View>
          <Text style={[stepStyles.labelDone, { color: theme.primary }]}>
            {label}
          </Text>
        </View>
        <View style={[stepStyles.line, { backgroundColor: theme.primary }]} />
      </React.Fragment>
    ))}
    <View style={stepStyles.item}>
      <View
        style={[
          stepStyles.circleActive,
          { backgroundColor: theme.card, borderColor: theme.primary },
        ]}
      >
        <Text style={[stepStyles.numActive, { color: theme.primary }]}>4</Text>
      </View>
      <Text style={[stepStyles.labelActive, { color: theme.text }]}>
        Confirm
      </Text>
    </View>
  </View>
);

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 5 },
  line: { flex: 1, height: 1, marginHorizontal: 4 },
  circleDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  labelDone: { fontSize: 11, fontWeight: "600" },
  labelActive: { fontSize: 11, fontWeight: "600" },
  numActive: { fontSize: 10, fontWeight: "800" },
});

export default function TicketScreen() {
  const { theme, dark } = useTheme();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const ticketRef = useRef<ViewShot>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await mainApi.get(`/user/bookings/${bookingId}`);
        setBooking(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) fetchBooking();
  }, [bookingId]);

  const handleDownload = async () => {
    setDownloading(true);

    try {
      if (Platform.OS === "web") {
        const ticketElement = document.getElementById("ticket");

        if (!ticketElement) {
          Alert.alert("Error", "Ticket not found");
          return;
        }

        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";

        script.onload = async () => {
          // @ts-ignore
          const canvas = await window.html2canvas(ticketElement);

          const uri = canvas.toDataURL("image/png");

          const link = document.createElement("a");
          link.href = uri;
          link.download = `ticket-${booking?.bookingId}.png`;
          link.click();
        };

        document.body.appendChild(script);
        return;
      }

      const uri = await ticketRef.current?.capture?.();

      if (!uri) throw new Error("Capture failed");

      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status === "granted") {
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync("MovieTickets", asset, false);

        Alert.alert("Saved!", "Ticket saved to gallery.");
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }
      }
    } catch (err) {
      console.error("Download error:", err);
      Alert.alert("Error", "Could not save ticket");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.subText }}>Could not load ticket.</Text>
      </View>
    );
  }

  const [showDate] = booking.showTime.split(" ");
  const formattedDate = new Date(showDate).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedBookedAt = new Date(booking.bookingDate).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  );
  const showTime = booking.showTime.split(" ")[1];

  const qrValue = `
Ticket for: ${booking.movieName}
Booking ID: #${booking.bookingId}
Showtime: ${booking.showTime}
Seats: ${booking.seatNumbers.join(", ")}
Theater: ${booking.theaterName}
`.trim();

  const capturedBg = dark ? "#0a1a10" : "#e8fff3";
  const cardBg = dark ? "#1b0a2e" : "#ffffff";
  const perfBg = dark ? "#161616" : "#f1fff8";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={dark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      <Navbar search={searchText} setSearch={setSearchText} />

      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[
            styles.backBtn,
            { borderColor: theme.primary + "33", backgroundColor: theme.card },
          ]}
          onPress={() => router.replace("/")}
        >
          <Ionicons name="chevron-back" size={22} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          My Ticket
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <StepBar theme={theme} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { backgroundColor: theme.background },
        ]}
      >
        <ViewShot
          ref={ticketRef}
          options={{ format: "png", quality: 1 }}
          style={[styles.viewShot, { backgroundColor: capturedBg }]}
        >
          <View
            id="ticket"
            style={[styles.ticketCard, { backgroundColor: cardBg }]}
          >
            <View style={styles.topRow}>
              {/* <View
                style={[
                  styles.posterBox,
                  {
                    backgroundColor: dark ? "#061a0e" : "#d0f5e3",
                    borderColor: theme.primary + "33",
                  },
                ]}
              >
                <Text style={[styles.posterText, { color: theme.primary }]}>
                  {booking.movieName}
                </Text>
              </View> */}

              <View style={styles.movieMeta}>
                <Text style={[styles.movieTitle, { color: theme.text }]}>
                  {booking.movieName}
                </Text>

                <View
                  style={[
                    styles.confirmedBadge,
                    {
                      backgroundColor: theme.primary + "22",
                      borderColor: theme.primary + "44",
                    },
                  ]}
                >
                  <Text
                    style={[styles.confirmedText, { color: theme.primary }]}
                  >
                    CONFIRMED
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color={theme.primary}
                  />
                  <Text style={[styles.metaText, { color: theme.subText }]}>
                    {formattedDate}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={theme.primary}
                  />
                  <Text style={[styles.metaText, { color: theme.subText }]}>
                    {showTime}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={theme.primary}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      { color: theme.subText, fontSize: 11 },
                    ]}
                    numberOfLines={2}
                  >
                    {booking.theaterName}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.perf}>
              <View
                style={[
                  styles.perfCircle,
                  { marginLeft: -10, backgroundColor: perfBg },
                ]}
              />
              <View
                style={[styles.dashLine, { borderColor: theme.primary + "44" }]}
              />
              <View
                style={[
                  styles.perfCircle,
                  { marginRight: -10, backgroundColor: perfBg },
                ]}
              />
            </View>

            <View style={styles.bottomRow}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.primary }]}>
                  SEATS
                </Text>
                <Text style={[styles.infoVal, { color: theme.text }]}>
                  {booking.seatNumbers.join(", ")}
                </Text>
                <Text style={[styles.infoSub, { color: theme.subText }]}>
                  {booking.seatNumbers.length} tickets · Std
                </Text>
              </View>
              <View
                style={[
                  styles.vDivider,
                  { backgroundColor: theme.primary + "33" },
                ]}
              />
              <View style={{ alignItems: "center" }}>
                <Text style={[styles.infoLabel, { color: theme.primary }]}>
                  SCREEN
                </Text>
                <Text style={[styles.infoVal, { color: theme.text }]}>A3</Text>
                <Text style={[styles.infoSub, { color: theme.subText }]}>
                  Row B
                </Text>
              </View>
              <View
                style={[
                  styles.vDivider,
                  { backgroundColor: theme.primary + "33" },
                ]}
              />
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.infoLabel, { color: theme.primary }]}>
                  TOTAL
                </Text>
                <Text style={[styles.infoVal, { color: theme.primary }]}>
                  ₹{booking.totalPrice.toFixed(0)}
                </Text>
                <View
                  style={[
                    styles.paidBadge,
                    { backgroundColor: theme.primary + "22" },
                  ]}
                >
                  <Text style={[styles.paidText, { color: theme.primary }]}>
                    PAID
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[styles.qrInner, { borderTopColor: theme.primary + "22" }]}
            >
              <View style={styles.qrBox}>
                <QRCode
                  value={qrValue}
                  size={148}
                  color="#111"
                  backgroundColor="white"
                />
              </View>
              <Text style={[styles.bookingId, { color: theme.text }]}>
                #{booking.bookingId}
              </Text>
              <Text style={[styles.bookedBy, { color: theme.subText }]}>
                Booking ID · {booking.userName}
              </Text>
            </View>
            {booking.foodItems?.map((item, idx) => (
              <View key={idx} style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: theme.subText }]}>
                  {item.name} (Qty: {item.quantity})
                </Text>
                <Text style={[styles.receiptVal, { color: theme.text }]}>
                  ₹{item.price.toFixed(2)}
                </Text>
              </View>
            ))}

            {booking.discountAmount > 0 && (
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: "#22c55e" }]}>
                  Discount ({booking.couponCode})
                </Text>
                <Text style={[styles.receiptVal, { color: "#22c55e" }]}>
                  -₹{booking.discountAmount.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </ViewShot>

        <View style={styles.successBanner}>
          <View
            style={[styles.checkCircle, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="checkmark" size={26} color={theme.background} />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>
            Booking Confirmed!
          </Text>
          <Text style={[styles.successSub, { color: theme.subText }]}>
            Scan QR at the cinema entrance
          </Text>
        </View>

        <View
          style={[
            styles.detailCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.primary + "22",
              marginTop: 20,
            },
          ]}
        >
          <Text style={[styles.detailHeading, { color: theme.primary }]}>
            ORDER SUMMARY
          </Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subText }]}>
              Tickets ({booking.seatNumbers.length})
            </Text>
            <Text style={[styles.detailVal, { color: theme.text }]}>
              ₹{booking.ticketAmount.toFixed(2)}
            </Text>
          </View>
          {booking.foodItems && booking.foodItems.length > 0 && (
            <>
              <View
                style={[
                  { backgroundColor: theme.primary + "11", marginVertical: 4 },
                ]}
              />
              {booking.foodItems.map((item, index) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.subText }]}>
                    {item.name} x {item.quantity}
                  </Text>
                  <Text style={[styles.detailVal, { color: theme.text }]}>
                    ₹{item.price.toFixed(2)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {booking.discountAmount > 0 && (
            <View style={styles.detailRow}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Text style={[styles.detailLabel, { color: "#22c55e" }]}>
                  Discount
                </Text>
                <View
                  style={{
                    backgroundColor: "#22c55e22",
                    paddingHorizontal: 4,
                    borderRadius: 4,
                  }}
                >
                  <Text
                    style={{ fontSize: 9, color: "#22c55e", fontWeight: "800" }}
                  >
                    {booking.couponCode}
                  </Text>
                </View>
              </View>
              <Text style={[styles.detailVal, { color: "#22c55e" }]}>
                - ₹{booking.discountAmount.toFixed(2)}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.dashLine,
              { marginVertical: 8, borderColor: theme.primary + "22" },
            ]}
          />

          <View style={styles.detailRow}>
            <Text
              style={[
                styles.detailLabel,
                { color: theme.text, fontWeight: "700" },
              ]}
            >
              Total Paid
            </Text>
            <Text
              style={[
                styles.detailVal,
                { color: theme.primary, fontSize: 16, fontWeight: "900" },
              ]}
            >
              ₹{booking.totalPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.detailCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.primary + "22",
            },
          ]}
        >
          <Text style={[styles.detailHeading, { color: theme.primary }]}>
            BOOKING DETAILS
          </Text>

          {[
            { label: "Booked by", val: booking.userName, color: theme.text },
            { label: "Booked on", val: formattedBookedAt, color: theme.text },
            {
              label: "Status",
              val:
                booking.bookingStatus === "CONFIRMED"
                  ? "Payment Confirmed"
                  : booking.bookingStatus,
              color: theme.primary,
            },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                {
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: theme.primary + "18",
                },
              ]}
            >
              <Text style={[styles.detailLabel, { color: theme.subText }]}>
                {row.label}
              </Text>
              <Text style={[styles.detailVal, { color: row.color }]}>
                {row.val}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.note,
            {
              backgroundColor: dark ? "rgba(20,12,4,0.6)" : "#fffbeb",
              borderColor: "#f59e0b44",
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#f59e0b"
          />
          <Text
            style={[styles.noteText, { color: dark ? "#a16207" : "#92400e" }]}
          >
            Arrive 15 mins early. Carry a valid photo ID. No outside food or
            beverages allowed.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.downloadBtn,
            { backgroundColor: theme.primary },
            downloading && { opacity: 0.7 },
          ]}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <View style={styles.downloadInner}>
              <Ionicons
                name="download-outline"
                size={18}
                color={theme.background}
              />
              <Text style={[styles.downloadText, { color: theme.background }]}>
                Download Ticket
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 48 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  viewShot: { borderRadius: 16, overflow: "hidden", marginBottom: 4 },

  ticketCard: {
    borderRadius: 16,
    overflow: "hidden",
    paddingBottom: 10,
    paddingHorizontal: 10,
  },

  topRow: { flexDirection: "row", padding: 16, gap: 14 },
  posterBox: {
    width: 80,
    height: 112,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  posterText: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
    padding: 4,
  },

  movieMeta: { flex: 1 },
  movieTitle: { fontSize: 20, fontWeight: "900", lineHeight: 24 },
  confirmedBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  confirmedText: { fontSize: 10, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  metaText: { fontSize: 12, fontWeight: "500", flex: 1 },

  perf: { flexDirection: "row", alignItems: "center" },
  perfCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  dashLine: {
    flex: 1,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    marginHorizontal: 4,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    paddingHorizontal: 16,
  },
  infoLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.07 },
  infoVal: { fontSize: 17, fontWeight: "900", marginTop: 2 },
  infoSub: { fontSize: 11, marginTop: 1 },
  vDivider: { width: 1, height: 40 },
  paidBadge: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
  },
  paidText: { fontSize: 10, fontWeight: "700" },

  qrInner: {
    alignItems: "center",
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  qrBox: { backgroundColor: "#fff", padding: 12, borderRadius: 10 },
  bookingId: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 3,
    marginTop: 10,
  },
  bookedBy: { fontSize: 11, marginTop: 3, marginBottom: 4 },

  successBanner: { alignItems: "center", marginTop: 20, marginBottom: 4 },
  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  successTitle: { fontSize: 22, fontWeight: "900" },
  successSub: { fontSize: 13, marginTop: 4 },

  detailCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  detailHeading: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.07,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },
  detailLabel: { fontSize: 12 },
  detailVal: { fontSize: 12, fontWeight: "600" },

  note: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },

  downloadBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 14,
  },
  downloadInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  downloadText: { fontSize: 15, fontWeight: "900" },
  capturedReceipt: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 4,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  receiptVal: {
    fontSize: 11,
    fontWeight: "700",
  },
});
