import mainApi from "@/axios/axiosInstance";
import { useTheme } from "@/Context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Navbar from "../Components/navBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
interface FoodItem {
  name: string;
  quantity: number;
  price: number;
}
interface TicketItem {
  bookedAt: string;
  bookingId: number;
  movieId: number;
  movieName: string;

  seatNumbers: string[];
  showDateTime: string;
  theaterName: string;
  ticketId: string;
  totalAmount: number;
  foodItems?: FoodItem[];
}

interface MovieDetail {
  posterUrl?: string;
  backdropUrl?: string;
  genres?: string[];
  rating?: string;
  runtime?: string;
  imdbScore?: number;
  language?: string;
}

const formatBookedAt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const formatShowDateTime = (dt: string) => {
  const [datePart, timePart] = dt.split(" ");
  const date = new Date(datePart);
  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const [h, m] = timePart.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  const formattedTime = `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  return { formattedDate, formattedTime };
};

const isUpcoming = (showDateTime: string) =>
  new Date(showDateTime.replace(" ", "T")) > new Date();

const EmptyState = ({ theme }: { theme: any }) => (
  <View style={emptyStyles.container}>
    <View
      style={[
        emptyStyles.iconWrap,
        { backgroundColor: theme.card, borderColor: theme.primary + "33" },
      ]}
    >
      <MaterialCommunityIcons
        name="ticket-outline"
        size={48}
        color={theme.primary}
      />
    </View>
    <Text style={[emptyStyles.title, { color: theme.text }]}>
      No Tickets Yet
    </Text>
    <Text style={[emptyStyles.sub, { color: theme.subText }]}>
      Your booked tickets will appear here
    </Text>
  </View>
);

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  sub: { fontSize: 13, textAlign: "center" },
});

interface TicketCardProps {
  ticket: TicketItem;
  movieDetail: MovieDetail | null;
  theme: any;
  dark: boolean;
  onPress: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  movieDetail,
  theme,
  dark,
  onPress,
}) => {
  const upcoming = isUpcoming(ticket.showDateTime);
  const { formattedDate, formattedTime } = formatShowDateTime(
    ticket.showDateTime,
  );
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  const qrValue = JSON.stringify({
    bookingId: ticket.bookingId,
    movie: ticket.movieName,
    seats: ticket.seatNumbers,
    show: ticket.showDateTime,
    theater: ticket.theaterName,
    bookedAt: ticket.bookedAt,
  });
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View
          style={[
            cardStyles.card,
            { backgroundColor: theme.card, borderColor: theme.primary + "22" },
          ]}
        >
          <View
            style={[
              cardStyles.statusStrip,
              {
                backgroundColor: upcoming
                  ? theme.primary
                  : theme.subText + "44",
              },
            ]}
          />

          <View style={cardStyles.top}>
            <View style={cardStyles.posterWrap}>
              {movieDetail?.posterUrl ? (
                <Image
                  source={{ uri: movieDetail.posterUrl }}
                  style={cardStyles.poster}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    cardStyles.posterPlaceholder,
                    { backgroundColor: theme.primary + "22" },
                  ]}
                >
                  <Text
                    style={[cardStyles.posterInitial, { color: theme.primary }]}
                  >
                    {ticket.movieName.charAt(0)}
                  </Text>
                </View>
              )}

              <View
                style={[
                  cardStyles.statusBadge,
                  { backgroundColor: upcoming ? theme.primary : "#555" },
                ]}
              >
                <Text
                  style={[
                    cardStyles.statusBadgeText,
                    { color: upcoming ? "#052e10" : "#fff" },
                  ]}
                >
                  {upcoming ? "UPCOMING" : "COMPLETED"}
                </Text>
              </View>
            </View>

            <View style={cardStyles.info}>
              <Text
                style={[cardStyles.movieName, { color: theme.text }]}
                numberOfLines={2}
              >
                {ticket.movieName}
              </Text>

              <View style={cardStyles.pillRow}>
                {movieDetail?.rating && (
                  <View
                    style={[
                      cardStyles.pill,
                      {
                        backgroundColor: theme.primary + "18",
                        borderColor: theme.primary + "33",
                      },
                    ]}
                  >
                    <Text
                      style={[cardStyles.pillText, { color: theme.primary }]}
                    >
                      {movieDetail.rating}
                    </Text>
                  </View>
                )}
                {movieDetail?.language && (
                  <View
                    style={[
                      cardStyles.pill,
                      {
                        backgroundColor: theme.primary + "18",
                        borderColor: theme.primary + "33",
                      },
                    ]}
                  >
                    <Text
                      style={[cardStyles.pillText, { color: theme.primary }]}
                    >
                      {movieDetail.language}
                    </Text>
                  </View>
                )}
                {movieDetail?.imdbScore && (
                  <View
                    style={[
                      cardStyles.pill,
                      {
                        backgroundColor: "rgba(245,158,11,0.12)",
                        borderColor: "rgba(245,158,11,0.3)",
                      },
                    ]}
                  >
                    <Text style={[cardStyles.pillText, { color: "#f59e0b" }]}>
                      ⭐ {movieDetail.imdbScore}
                    </Text>
                  </View>
                )}
              </View>

              <View style={cardStyles.metaRow}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={theme.primary}
                />
                <Text style={[cardStyles.metaText, { color: theme.subText }]}>
                  {formattedDate}
                </Text>
              </View>
              <View style={cardStyles.metaRow}>
                <Ionicons name="time-outline" size={12} color={theme.primary} />
                <Text style={[cardStyles.metaText, { color: theme.subText }]}>
                  {formattedTime}
                </Text>
              </View>
              <View style={cardStyles.metaRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={theme.primary}
                />
                <Text
                  style={[cardStyles.metaText, { color: theme.subText }]}
                  numberOfLines={1}
                >
                  {ticket.theaterName}
                </Text>
              </View>
            </View>
          </View>

          <View style={cardStyles.perf}>
            <View
              style={[
                cardStyles.perfCircle,
                { left: -14, backgroundColor: dark ? "#161616" : "#f1fff8" },
              ]}
            />
            <View
              style={[
                cardStyles.dashLine,
                { borderColor: theme.primary + "30" },
              ]}
            />
            <View
              style={[
                cardStyles.perfCircle,
                { right: -14, backgroundColor: dark ? "#161616" : "#f1fff8" },
              ]}
            />
          </View>

          <View style={cardStyles.bottom}>
            <View style={cardStyles.bottomLeft}>
              <View style={cardStyles.bottomItem}>
                <Text
                  style={[cardStyles.bottomLabel, { color: theme.primary }]}
                >
                  SEATS
                </Text>
                <Text style={[cardStyles.bottomValue, { color: theme.text }]}>
                  {ticket.seatNumbers.join(", ")}
                </Text>
              </View>
              <View
                style={[
                  cardStyles.vDivider,
                  { backgroundColor: theme.primary + "22" },
                ]}
              />
              <View style={cardStyles.bottomItem}>
                <Text
                  style={[cardStyles.bottomLabel, { color: theme.primary }]}
                >
                  AMOUNT
                </Text>
                <Text
                  style={[cardStyles.bottomValue, { color: theme.primary }]}
                >
                  ₹{ticket.totalAmount.toFixed(0)}
                </Text>
              </View>
              <View
                style={[
                  cardStyles.vDivider,
                  { backgroundColor: theme.primary + "22" },
                ]}
              />
              <View style={cardStyles.bottomItem}>
                <Text
                  style={[cardStyles.bottomLabel, { color: theme.primary }]}
                >
                  BOOKED
                </Text>
                <Text
                  style={[
                    cardStyles.bottomValue,
                    { color: theme.text, fontSize: 10 },
                  ]}
                >
                  {new Date(ticket.bookedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}
                </Text>
              </View>
            </View>

            <View style={cardStyles.qrWrap}>
              <QRCode
                value={qrValue}
                size={54}
                color={dark ? "#f0fdf4" : "#111"}
                backgroundColor="transparent"
              />
            </View>
          </View>

          <View
            style={[
              cardStyles.ticketFooter,
              { borderTopColor: theme.primary + "14" },
            ]}
          >
            <Text style={[cardStyles.ticketId, { color: theme.subText }]}>
              {ticket.ticketId}
            </Text>
            <Text style={[cardStyles.tapHint, { color: theme.primary }]}>
              Tap to view →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  statusStrip: { height: 3, width: "100%" },
  top: { flexDirection: "row", padding: 16, gap: 14 },
  posterWrap: { position: "relative", flexShrink: 0 },
  poster: { width: 80, height: 112, borderRadius: 12 },
  posterPlaceholder: {
    width: 80,
    height: 112,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  posterInitial: { fontSize: 28, fontWeight: "900" },
  statusBadge: {
    position: "absolute",
    bottom: 6,
    left: 4,
    right: 4,
    borderRadius: 5,
    paddingVertical: 2,
    alignItems: "center",
  },
  statusBadgeText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  info: { flex: 1 },
  movieName: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
    marginBottom: 6,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 8 },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  pillText: { fontSize: 9, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  metaText: { fontSize: 11, fontWeight: "500", flex: 1 },
  perf: {
    flexDirection: "row",
    alignItems: "center",
    height: 28,
    position: "relative",
  },
  perfCircle: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dashLine: {
    flex: 1,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    marginHorizontal: 18,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  bottomLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  bottomItem: {},
  bottomLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.07,
    marginBottom: 2,
  },
  bottomValue: { fontSize: 14, fontWeight: "800" },
  vDivider: { width: 1, height: 32 },
  qrWrap: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  ticketId: { fontSize: 9, fontWeight: "600", letterSpacing: 0.5 },
  tapHint: { fontSize: 11, fontWeight: "700" },
});

interface TicketDetailProps {
  ticket: TicketItem;
  movieDetail: MovieDetail | null;
  theme: any;
  dark: boolean;
  onClose: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({
  ticket,
  movieDetail,
  theme,
  dark,
  onClose,
}) => {
  const { formattedDate, formattedTime } = formatShowDateTime(
    ticket.showDateTime,
  );
  const upcoming = isUpcoming(ticket.showDateTime);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(onClose);
  };
  const qrValue = JSON.stringify({
    bookingId: ticket.bookingId,
    movie: ticket.movieName,
    seats: ticket.seatNumbers,
    show: ticket.showDateTime,
    theater: ticket.theaterName,
    bookedAt: ticket.bookedAt,
  });
  return (
    <Animated.View
      style={[
        detailStyles.overlay,
        {
          transform: [{ translateX: slideAnim }],
          backgroundColor: theme.background,
        },
      ]}
    >
      {movieDetail?.backdropUrl && (
        <Image
          source={{ uri: movieDetail.backdropUrl }}
          style={detailStyles.backdrop}
          resizeMode="cover"
        />
      )}
      <LinearGradient
        colors={["rgba(22,22,22,0.3)", "rgba(22,22,22,0.85)"]}
        style={detailStyles.backdropOverlay}
      />

      <TouchableOpacity
        style={[
          detailStyles.closeBtn,
          { backgroundColor: theme.primay, borderColor: theme.primary + "33" },
        ]}
        onPress={handleClose}
      >
        <Ionicons name="close" size={20} color={theme.primary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={detailStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={detailStyles.titleBlock}>
          {movieDetail?.posterUrl && (
            <Image
              source={{ uri: movieDetail.posterUrl }}
              style={detailStyles.posterLarge}
              resizeMode="cover"
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[detailStyles.movieTitle, { color: "#fff" }]}>
              {ticket.movieName}
            </Text>
            <View style={detailStyles.badgeRow}>
              {upcoming ? (
                <View
                  style={[
                    detailStyles.upcomingBadge,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[detailStyles.upcomingText, { color: "#ffffff" }]}
                  >
                    UPCOMING
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    detailStyles.CompletedBadge,
                    { backgroundColor: theme.button },
                  ]}
                >
                  <Text
                    style={[
                      detailStyles.CompletedText,
                      { color: theme.maptext },
                    ]}
                  >
                    Completed
                  </Text>
                </View>
              )}
              {movieDetail?.rating && (
                <View style={[detailStyles.pill2, { borderColor: "#04a562" }]}>
                  <Text style={[detailStyles.pill2Text, { color: "#04a562" }]}>
                    {movieDetail.rating}
                  </Text>
                </View>
              )}
            </View>
            {movieDetail?.imdbScore && (
              <Text
                style={{
                  color: "#f59e0b",
                  fontWeight: "700",
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                ⭐ {movieDetail.imdbScore} IMDb
              </Text>
            )}
          </View>
        </View>

        {/* Full ticket card */}
        <View
          style={[
            detailStyles.ticketCard,
            {
              backgroundColor: theme.background,
              borderColor: theme.primary + "22",
            },
          ]}
        >
          <View
            style={[detailStyles.cardStrip, { backgroundColor: theme.primary }]}
          />

          {/* Show details */}
          <View style={detailStyles.detailGrid}>
            {[
              { icon: "calendar-outline", label: "Date", value: formattedDate },
              { icon: "time-outline", label: "Time", value: formattedTime },
              {
                icon: "location-outline",
                label: "Theater",
                value: ticket.theaterName,
              },
              {
                icon: "film-outline",
                label: "Seats",
                value: ticket.seatNumbers.join(", "),
              },
            ].map((row) => (
              <View
                key={row.label}
                style={[
                  detailStyles.gridRow,
                  { borderBottomColor: theme.primary + "12" },
                ]}
              >
                <View style={detailStyles.gridLeft}>
                  <Ionicons
                    name={row.icon as any}
                    size={14}
                    color={theme.primary}
                  />
                  <Text
                    style={[detailStyles.gridLabel, { color: theme.subText }]}
                  >
                    {row.label}
                  </Text>
                </View>
                <Text
                  style={[detailStyles.gridValue, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {row.value}
                </Text>
              </View>
            ))}
            {/* Amount row */}
            <View
              style={[
                detailStyles.gridRow,
                { borderBottomColor: theme.primary + "12" },
              ]}
            >
              <View style={detailStyles.gridLeft}>
                <Ionicons name="cash-outline" size={14} color={theme.primary} />
                <Text
                  style={[detailStyles.gridLabel, { color: theme.subText }]}
                >
                  Amount
                </Text>
              </View>
              <Text
                style={[
                  detailStyles.gridValue,
                  { color: theme.primary, fontWeight: "900" },
                ]}
              >
                ₹{ticket.totalAmount.toFixed(0)}
              </Text>
            </View>
            {/* Booked at */}
            <View style={[detailStyles.gridRow, { borderBottomWidth: 0 }]}>
              <View style={detailStyles.gridLeft}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={14}
                  color={theme.primary}
                />
                <Text
                  style={[detailStyles.gridLabel, { color: theme.subText }]}
                >
                  Booked on
                </Text>
              </View>
              <Text style={[detailStyles.gridValue, { color: theme.text }]}>
                {formatBookedAt(ticket.bookedAt)}
              </Text>
            </View>
          </View>
          {/* ── Food & Beverages Section ── */}
          {ticket.foodItems && ticket.foodItems.length > 0 && (
            <View
              style={[
                detailStyles.foodSection,
                { borderTopColor: theme.primary + "12" },
              ]}
            >
              <View style={detailStyles.foodHeader}>
                <MaterialCommunityIcons
                  name="food-outline"
                  size={16}
                  color={theme.primary}
                />
                <Text
                  style={[
                    detailStyles.foodHeaderText,
                    { color: theme.primary },
                  ]}
                >
                  FOOD & BEVERAGES
                </Text>
              </View>

              {ticket.foodItems.map((item, index) => (
                <View key={index} style={detailStyles.foodRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[detailStyles.foodName, { color: theme.text }]}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 10, color: theme.subText }}>
                      {item.quantity} x ₹{item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={[detailStyles.foodPrice, { color: theme.text }]}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {/* Perforation */}
          <View style={detailStyles.perf}>
            <View
              style={[
                detailStyles.perfCircle,
                { left: -14, backgroundColor: dark ? "#161616" : "#f1fff8" },
              ]}
            />
            <View
              style={[
                detailStyles.dashLine,
                { borderColor: theme.primary + "30" },
              ]}
            />
            <View
              style={[
                detailStyles.perfCircle,
                { right: -14, backgroundColor: dark ? "#161616" : "#f1fff8" },
              ]}
            />
          </View>

          {/* QR code */}
          <View style={detailStyles.qrSection}>
            <Text style={[detailStyles.scanText, { color: theme.subText }]}>
              Show at the cinema entrance
            </Text>
            <View style={detailStyles.qrBox}>
              <QRCode
                value={qrValue}
                size={180}
                color="#111"
                backgroundColor="white"
              />
            </View>
            <Text style={[detailStyles.ticketId, { color: theme.primary }]}>
              {ticket.ticketId}
            </Text>
            <Text style={[detailStyles.bookingId, { color: theme.subText }]}>
              Booking #{ticket.bookingId}
            </Text>
          </View>
        </View>

        {/* Info note */}
        <View
          style={[
            detailStyles.note,
            {
              backgroundColor: "rgba(61, 60, 60, 0.5)",
              borderColor: "#f59e0b33",
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={15}
            color="#f59e0b"
          />
          <Text style={detailStyles.noteText}>
            Arrive 15 mins early. Carry valid photo ID. No outside food or
            beverages allowed.
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const detailStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    opacity: 1,
  },
  backdropOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 36,
    right: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 48,
  },
  titleBlock: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
    marginTop: 40,
  },
  posterLarge: { width: 90, height: 126, borderRadius: 14 },
  movieTitle: { fontSize: 22, fontWeight: "900" },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  upcomingBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  upcomingText: { fontSize: 10, fontWeight: "800" },
  CompletedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  CompletedText: { fontSize: 10, fontWeight: "700" },
  pill2: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  pill2Text: { fontSize: 10, fontWeight: "700" },
  ticketCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
  },
  cardStrip: { height: 4 },
  detailGrid: { padding: 16 },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  gridLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 0.45 },
  gridLabel: { fontSize: 12, fontWeight: "600" },
  gridValue: {
    fontSize: 13,
    fontWeight: "700",
    flex: 0.55,
    textAlign: "right",
  },
  perf: {
    flexDirection: "row",
    alignItems: "center",
    height: 28,
    position: "relative",
  },
  perfCircle: { position: "absolute", width: 28, height: 28, borderRadius: 14 },
  dashLine: {
    flex: 1,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    marginHorizontal: 18,
  },
  qrSection: { alignItems: "center", padding: 20, paddingTop: 12 },
  scanText: { fontSize: 12, marginBottom: 14 },
  qrBox: { backgroundColor: "#fff", padding: 14, borderRadius: 14 },
  ticketId: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 12,
  },
  bookingId: { fontSize: 11, marginTop: 4 },
  note: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  noteText: { flex: 1, fontSize: 11, color: "#a16207", lineHeight: 17 },
  foodSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    marginTop: 4,
  },
  foodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    marginBottom: 12,
  },
  foodHeaderText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  foodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  foodName: {
    fontSize: 13,
    fontWeight: "700",
  },
  foodPrice: {
    fontSize: 13,
    fontWeight: "800",
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MyTicketsScreen() {
  const { theme, dark } = useTheme();
  const router = useRouter();

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [movieDetails, setMovieDetails] = useState<Record<number, MovieDetail>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "Completed">("all");
  const [searchText, setSearchText] = useState("");

  const fetchTickets = async () => {
    try {
      const res = await mainApi.get("/user/tickets");
      const data: TicketItem[] = res.data;
      setTickets(data);

      // Fetch movie details for unique movieIds in parallel
      const uniqueMovieIds = [...new Set(data.map((t) => t.movieId))];
      const detailsEntries = await Promise.all(
        uniqueMovieIds.map(async (movieId) => {
          try {
            const mRes = await mainApi.get(`/movies/${movieId}`);
            return [movieId, mRes.data as MovieDetail] as const;
          } catch {
            return [movieId, {} as MovieDetail] as const;
          }
        }),
      );
      setMovieDetails(Object.fromEntries(detailsEntries));
    } catch (e) {
      console.error("Failed to fetch tickets:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === "upcoming") return isUpcoming(t.showDateTime);
    if (filter === "Completed") return !isUpcoming(t.showDateTime);
    return true;
  });

  const upcomingCount = tickets.filter((t) =>
    isUpcoming(t.showDateTime),
  ).length;
  const CompletedCount = tickets.filter(
    (t) => !isUpcoming(t.showDateTime),
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={dark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      <LinearGradient
        colors={dark ? [theme.background, "#1E1E26"] : ["#FFFFFF", theme.card]}
        style={StyleSheet.absoluteFill}
      />

      <Navbar search={searchText} setSearch={setSearchText} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backBtn,
            { borderColor: theme.primary + "33", backgroundColor: theme.card },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={theme.primary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            My Tickets
          </Text>
          <Text style={[styles.headerSub, { color: theme.subText }]}>
            {tickets.length} booking{tickets.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Filter tabs */}
      {!loading && tickets.length > 0 && (
        <View
          style={[
            styles.filterRow,
            { borderBottomColor: theme.primary + "14" },
          ]}
        >
          {(["all", "upcoming", "Completed"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterTab,
                filter === f && [
                  styles.filterTabActive,
                  { borderBottomColor: theme.primary },
                ],
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: filter === f ? theme.primary : theme.subText },
                  filter === f && { fontWeight: "800" },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.subText }]}>
            Loading your tickets...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.ticketId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={<EmptyState theme={theme} />}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              movieDetail={movieDetails[item.movieId] ?? null}
              theme={theme}
              dark={dark}
              onPress={() => setSelectedTicket(item)}
            />
          )}
        />
      )}

      {/* Detail overlay */}
      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          movieDetail={movieDetails[selectedTicket.movieId] ?? null}
          theme={theme}
          dark={dark}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "900" },
  headerSub: { fontSize: 12, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  statNum: { fontSize: 18, fontWeight: "900" },
  statLabel: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  filterTabActive: { borderBottomWidth: 2 },
  filterTabText: { fontSize: 13 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 48, flexGrow: 1 },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 13 },
});
