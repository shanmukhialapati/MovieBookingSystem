import mainApi from "@/axios/axiosInstance";
import { useTheme } from "@/Context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Navbar from "../Components/navBar";
import PremiumAlert from "../Components/PremiumAlert";

const { width: W } = Dimensions.get("window");
type SeatCategory = "PREMIUM" | "STANDARD";
type AlertType = "success" | "warning" | "error" | "confirm";

interface SeatInfo {
  seatNumber: string;
  category: SeatCategory;
}
interface SeatAvailability {
  availableSeats: SeatInfo[];
  lockedSeats: SeatInfo[];
  soldSeats: SeatInfo[];
}

const TERMS_TEXT = `
• Tickets once booked cannot be cancelled or refunded.
• Please arrive at least 15 minutes before showtime.
• Outside food & beverages are not allowed.
• Seats will be auto-cancelled if payment is not completed.
• Follow theater rules and guidelines.
• Children above 3 years require a separate ticket.
• Some movies may have age restrictions (U/A, A); entry may be denied as per certification.
`;
interface SeatProps {
  seatId: string;
  col: number;
  category: SeatCategory;
  status: "available" | "sold" | "locked" | "selected";
  onPress: (id: string) => void;
}
const Seat: React.FC<SeatProps> = ({
  seatId,
  col,
  category,
  status,
  onPress,
}) => {
  const { theme } = useTheme();
  const isDisabled = status === "sold" || status === "locked";
  const isSelected = status === "selected";
  const accent = category === "PREMIUM" ? theme.secondary : theme.button;

  const bg = isSelected
    ? accent
    : isDisabled
      ? theme.common + "28"
      : category === "PREMIUM"
        ? theme.secondary + "18"
        : theme.card;
  const border = isSelected
    ? accent
    : isDisabled
      ? theme.common + "44"
      : category === "PREMIUM"
        ? theme.secondary + "55"
        : theme.primary + "35";
  const txtColor = isSelected
    ? theme.textcommon
    : isDisabled
      ? theme.common
      : accent;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      onPress={() => onPress(seatId)}
      activeOpacity={0.7}
      style={[seatSt.seat, { backgroundColor: bg, borderColor: border }]}
    >
      {!isDisabled ? (
        <Text style={[seatSt.txt, { color: txtColor }]}>{col}</Text>
      ) : (
        <View style={seatSt.cross}>
          <View
            style={[seatSt.cl, seatSt.cl1, { backgroundColor: theme.common }]}
          />
          <View
            style={[seatSt.cl, seatSt.cl2, { backgroundColor: theme.common }]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};
const seatSt = StyleSheet.create({
  seat: {
    width: 30,
    height: 28,
    borderRadius: 5,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  txt: { fontSize: 8, fontWeight: "700" },
  cross: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cl: { position: "absolute", width: 8, height: 1.5, borderRadius: 1 },
  cl1: { transform: [{ rotate: "45deg" }] },
  cl2: { transform: [{ rotate: "-45deg" }] },
});

const AISLE_AFTER = 5;

const SeatBookingScreen: React.FC = () => {
  const { theme, dark } = useTheme();
  const router = useRouter();
  const { showId, movieId } = useLocalSearchParams<{
    showId: string;
    movieId: string;
  }>();

  const [searchText, setSearchText] = useState("");
  const [showData, setShowData] = useState<any>(null);
  const [loadingShow, setLoadingShow] = useState(true);
  const [availableMap, setAvailableMap] = useState<Record<string, SeatInfo>>(
    {},
  );
  const [soldSet, setSoldSet] = useState<Set<string>>(new Set());
  const [lockedSet, setLockedSet] = useState<Set<string>>(new Set());
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [isBooking, setIsBooking] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [Loading, setLoading] = useState(false);
  const alertInit = {
    visible: false,
    type: "success" as AlertType,
    title: "",
    message: "",
    onConfirm: undefined as (() => void) | undefined,
  };
  const [alert, setAlert] = useState(alertInit);
  const showAlert = (
    type: AlertType,
    title: string,
    message: string,
    onConfirm?: () => void,
  ) => setAlert({ visible: true, type, title, message, onConfirm });

  useEffect(() => {
    if (!showId) return;
    (async () => {
      try {
        setLoadingShow(true);

        const res = await mainApi.get(`/user/bookings/${showId}/availability`);
        const data: SeatAvailability = res.data;
        const aMap: Record<string, SeatInfo> = {};
        [
          ...data.availableSeats,
          ...data.soldSeats,
          ...data.lockedSeats,
        ].forEach((s) => (aMap[s.seatNumber] = s));
        setAvailableMap(aMap);
        setSoldSet(new Set(data.soldSeats.map((s) => s.seatNumber)));
        setLockedSet(new Set(data.lockedSeats.map((s) => s.seatNumber)));
        setSelectedSeats(new Set());
      } catch (e: any) {
        showAlert("error", "Error", "Failed to load seat map.");
      } finally {
        setLoadingShow(false);
      }
    })();
  }, [showId]);

  useEffect(() => {
    if (!movieId || !showId) return;

    const fetchShowDetails = async () => {
      try {
        setLoading(true);

        const res = await mainApi.get("/user/showtimes", {
          params: { movieId },
        });

        const selectedShow = res.data.find(
          (item: { id: number }) => item.id === Number(showId),
        );

        if (selectedShow) {
          setShowData((prev: any) => ({
            ...prev,
            ...selectedShow,
          }));
        } else {
          console.warn("Show not found for this movie");
        }
      } catch (err) {
        console.error("Error fetching show details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShowDetails();
  }, [movieId, showId]);

  const rowsByCat = useMemo(() => {
    const premium = new Set<string>();
    const standard = new Set<string>();
    Object.values(availableMap).forEach(({ seatNumber, category }) => {
      const row = seatNumber.charAt(0);
      if (category === "PREMIUM") premium.add(row);
      else standard.add(row);
    });
    return { PREMIUM: [...premium].sort(), STANDARD: [...standard].sort() };
  }, [availableMap]);

  const maxColPerRow = useMemo(() => {
    const map: Record<string, number> = {};
    Object.keys(availableMap).forEach((sn) => {
      const row = sn.charAt(0);
      const col = parseInt(sn.slice(1));
      if (!map[row] || col > map[row]) map[row] = col;
    });
    return map;
  }, [availableMap]);

  const standardPrice = showData?.price ?? 0;
  const premiumPrice = standardPrice + 100;

  const { totalPrice, premiumCount, standardCount } = useMemo(() => {
    let p = 0,
      st = 0;
    selectedSeats.forEach((sn) => {
      availableMap[sn]?.category === "PREMIUM" ? p++ : st++;
    });
    return {
      totalPrice: p * premiumPrice + st * standardPrice,
      premiumCount: p,
      standardCount: st,
    };
  }, [selectedSeats, availableMap, premiumPrice, standardPrice]);

  const toggleSeat = useCallback(
    (seatId: string) => {
      if (soldSet.has(seatId) || lockedSet.has(seatId)) return;
      setSelectedSeats((prev) => {
        const next = new Set(prev);
        next.has(seatId) ? next.delete(seatId) : next.add(seatId);
        return next;
      });
    },
    [soldSet, lockedSet],
  );

  const getSeatStatus = useCallback(
    (seatId: string): "available" | "sold" | "locked" | "selected" => {
      if (selectedSeats.has(seatId)) return "selected";
      if (soldSet.has(seatId)) return "sold";
      if (lockedSet.has(seatId)) return "locked";
      return "available";
    },
    [selectedSeats, soldSet, lockedSet],
  );

  const handleBook = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      showAlert("warning", "Login Required", "Please login to continue.", () =>
        router.push("/login"),
      );
      return;
    }
    if (selectedSeats.size === 0) {
      showAlert("error", "No Seats", "Select at least one seat.");
      return;
    }
    setIsBooking(true);
    try {
      const res = await mainApi.post("/user/bookings", {
        showtimeId: Number(showId),
        seatNumbers: [...selectedSeats],
        numberOfSeats: selectedSeats.size,
      });

      if (res.status === 200 || res.status === 201) {
        router.push({
          pathname: "/Components/Confirmation",
          params: { bookingData: JSON.stringify(res.data) },
        });
      }
    } catch (err: any) {
      if (err.response?.status === 401)
        showAlert("warning", "Session Expired", "Please login again.", () =>
          router.push("/login"),
        );
      else
        showAlert(
          "error",
          "Booking Failed",
          err.response?.data?.message ?? "Seat may be locked.",
        );
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (t?: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };
  const formatDate = (d?: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };
  const theater = showData?.theater;
  const movie = showData?.movie;

  // const theaterImg = theater.imageUrl;

  return (
    <View style={[st.root, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={dark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <Navbar search={searchText} setSearch={setSearchText} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: selectedSeats.size > 0 ? 230 : 40,
        }}
      >
        <View style={st.heroWrap}>
          <TouchableOpacity
            style={[st.heroBack, { backgroundColor: theme.background + "CC" }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            st.infoCard,
            { backgroundColor: theme.card, borderColor: theme.primary + "22" },
          ]}
        >
          <View style={st.infoTop}>
            {theater?.imageUrl && !imgError ? (
              <Image
                source={{ uri: theater?.imageUrl }}
                style={st.heroImg}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <View
                style={[
                  st.heroImg,
                  st.heroPlaceholder,
                  { backgroundColor: theme.card },
                ]}
              >
                <Ionicons name="film" size={48} color={theme.primary + "44"} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[st.theaterName, { color: theme.text }]}>
                {theater?.name ?? "Loading..."}
              </Text>
              <View style={st.addressRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={theme.subText}
                />
                <Text
                  style={[st.addressTxt, { color: theme.subText }]}
                  numberOfLines={2}
                >
                  {theater?.address}
                  {theater?.city ? `, ${theater.city}` : ""}
                  {theater?.state ? `, ${theater.state}` : ""}
                  {theater?.pincode ? ` - ${theater.pincode}` : ""}
                </Text>
              </View>
              {theater?.landmark && (
                <View style={st.addressRow}>
                  <Ionicons
                    name="flag-outline"
                    size={12}
                    color={theme.subText}
                  />
                  <Text style={[st.addressTxt, { color: theme.subText }]}>
                    {theater.landmark}
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                st.seatCountBadge,
                {
                  backgroundColor: theme.primary + "18",
                  borderColor: theme.primary + "33",
                },
              ]}
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 18,
                  fontWeight: "900",
                }}
              >
                {theater?.totalSeats ?? "—"}
              </Text>
              <Text
                style={{ color: theme.primary, fontSize: 9, fontWeight: "700" }}
              >
                SEATS
              </Text>
            </View>
          </View>

          {showData && (
            <View
              style={[
                st.showStrip,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.primary + "18",
                },
              ]}
            >
              <View style={st.showStripItem}>
                <Ionicons name="film-outline" size={14} color={theme.primary} />
                <Text
                  style={[st.showStripTxt, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {movie?.title}
                </Text>
              </View>
              <View
                style={[
                  st.showStripDivider,
                  { backgroundColor: theme.primary + "20" },
                ]}
              />
              <View style={st.showStripItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={theme.primary}
                />
                <Text style={[st.showStripTxt, { color: theme.text }]}>
                  {formatDate(showData.showDate)}
                </Text>
              </View>
              <View
                style={[
                  st.showStripDivider,
                  { backgroundColor: theme.primary + "20" },
                ]}
              />
              <View style={st.showStripItem}>
                <Ionicons name="time-outline" size={14} color={theme.primary} />
                <Text style={[st.showStripTxt, { color: theme.text }]}>
                  {formatTime(showData.showTime)}
                </Text>
              </View>
            </View>
          )}

          {movie && (
            <View style={st.tagsRow}>
              {[
                movie.language,
                movie.genre,
                `${movie.duration} min`,
                movie.rating,
              ].map((t, i) => (
                <View
                  key={i}
                  style={[
                    st.tag,
                    {
                      backgroundColor: theme.primary + "14",
                      borderColor: theme.primary + "28",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: 10,
                      fontWeight: "700",
                    }}
                  >
                    {t}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {loadingShow ? (
          <View style={st.seatLoading}>
            <ActivityIndicator color={theme.primary} />
            <Text style={{ color: theme.subText, marginTop: 8, fontSize: 13 }}>
              Loading seat map...
            </Text>
          </View>
        ) : (
          <>
            <View style={st.legend}>
              {[
                {
                  color: theme.secondary + "28",
                  border: theme.secondary + "55",
                  label: `Premium ₹${premiumPrice}`,
                },
                {
                  color: theme.card,
                  border: theme.primary + "33",
                  label: `Standard ₹${standardPrice}`,
                },
                {
                  color: theme.common + "28",
                  border: theme.common + "44",
                  label: "Sold / Locked",
                },
                {
                  color: theme.primary,
                  border: theme.primary,
                  label: "Selected",
                },
              ].map(({ color, border, label }) => (
                <View key={label} style={st.legendItem}>
                  <View
                    style={[
                      st.legendDot,
                      { backgroundColor: color, borderColor: border },
                    ]}
                  />
                  <Text style={{ color: theme.subText, fontSize: 10 }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={st.seatMapScroll}
            >
              <View style={st.seatMap}>
                {(["PREMIUM", "STANDARD"] as SeatCategory[]).map((cat) => {
                  const rows = rowsByCat[cat];
                  if (!rows.length) return null;
                  const accent =
                    cat === "PREMIUM" ? theme.secondary : theme.button;
                  const catBg =
                    cat === "PREMIUM"
                      ? theme.secondary + "18"
                      : theme.primary + "12";
                  const catBorder =
                    cat === "PREMIUM"
                      ? theme.secondary + "44"
                      : theme.primary + "33";
                  return (
                    <View key={cat} style={st.catSection}>
                      <View style={st.catHeader}>
                        <View
                          style={[
                            st.catBadge,
                            { backgroundColor: catBg, borderColor: catBorder },
                          ]}
                        >
                          <Text
                            style={{
                              color: accent,
                              fontSize: 9,
                              fontWeight: "800",
                              letterSpacing: 1,
                            }}
                          >
                            {cat === "PREMIUM" ? "★ PREMIUM" : "STANDARD"}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: accent,
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          ₹{cat === "PREMIUM" ? premiumPrice : standardPrice} /
                          seat
                        </Text>
                      </View>
                      {rows.map((row) => {
                        const maxCol = maxColPerRow[row] || 10;
                        return (
                          <View key={row} style={st.seatRow}>
                            <Text
                              style={[
                                st.rowLabel,
                                { color: theme.subText + "66" },
                              ]}
                            >
                              {row}
                            </Text>
                            {Array.from(
                              { length: maxCol },
                              (_, i) => i + 1,
                            ).map((col) => {
                              const seatId = `${row}${col}`;
                              return (
                                <React.Fragment key={seatId}>
                                  {col === AISLE_AFTER + 1 && (
                                    <View style={st.aisle} />
                                  )}
                                  <Seat
                                    seatId={seatId}
                                    col={col}
                                    category={cat}
                                    status={getSeatStatus(seatId)}
                                    onPress={toggleSeat}
                                  />
                                </React.Fragment>
                              );
                            })}
                            <Text
                              style={[
                                st.rowLabel,
                                { color: theme.subText + "66" },
                              ]}
                            >
                              {row}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <View style={st.screenWrap}>
              <LinearGradient
                colors={[theme.primary + "33", "transparent"]}
                style={st.screenGlow}
              />
              <View
                style={[st.screenBar, { backgroundColor: theme.primary }]}
              />
              <Text style={[st.screenLabel, { color: theme.primary }]}>
                ▲ SCREEN ▲
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <PremiumAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText={alert.onConfirm ? "CONTINUE" : "OK"}
        onClose={() => setAlert((p) => ({ ...p, visible: false }))}
        onConfirm={() => {
          setAlert((p) => ({ ...p, visible: false }));

          alert.onConfirm?.();
        }}
      />

      {selectedSeats.size > 0 && (
        <View
          style={[
            st.footer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.primary + "22",
            },
          ]}
        >
          <View style={st.breakRow}>
            {premiumCount > 0 && (
              <View
                style={[
                  st.breakChip,
                  {
                    backgroundColor: theme.secondary + "18",
                    borderColor: theme.secondary + "44",
                  },
                ]}
              >
                <Text
                  style={{
                    color: theme.secondary,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {premiumCount}× Premium · ₹{premiumCount * premiumPrice}
                </Text>
              </View>
            )}
            {standardCount > 0 && (
              <View
                style={[
                  st.breakChip,
                  {
                    backgroundColor: theme.button + "18",
                    borderColor: theme.button + "44",
                  },
                ]}
              >
                <Text
                  style={{
                    color: theme.button,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {standardCount}× Standard · ₹{standardCount * standardPrice}
                </Text>
              </View>
            )}
          </View>

          <View style={st.footerMain}>
            <View>
              <Text
                style={{
                  color: theme.subText,
                  fontSize: 10,
                  letterSpacing: 1,
                  fontWeight: "700",
                }}
              >
                TOTAL PAYABLE
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 28,
                  fontWeight: "900",
                  lineHeight: 32,
                }}
              >
                ₹{totalPrice}
              </Text>
              <Text
                style={{ color: theme.primary, fontSize: 10, marginTop: 1 }}
                numberOfLines={1}
              >
                {[...selectedSeats].sort().join(", ")}
              </Text>
            </View>
            <View
              style={[
                st.seatCountBadge2,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.primary + "33",
                },
              ]}
            >
              <Text
                style={{ color: theme.text, fontSize: 15, fontWeight: "800" }}
              >
                {selectedSeats.size}
              </Text>
              <Text
                style={{ color: theme.subText, fontSize: 9, fontWeight: "600" }}
              >
                SEAT{selectedSeats.size > 1 ? "S" : ""}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              showAlert(
                "confirm",
                "Terms & Conditions",
                TERMS_TEXT,
                handleBook,
              );
            }}
            // onPress={handleBook}
            disabled={isBooking}
            activeOpacity={0.85}
            style={st.bookBtn}
          >
            <LinearGradient
              colors={[theme.secondary, theme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.bookGrad}
            >
              {isBooking ? (
                <ActivityIndicator color={theme.textcommon} />
              ) : (
                <>
                  <Text
                    style={{
                      color: theme.textcommon,
                      fontSize: 16,
                      fontWeight: "700",
                      letterSpacing: 0.3,
                    }}
                  >
                    Book Tickets
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={theme.textcommon}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default SeatBookingScreen;

const st = StyleSheet.create({
  root: { flex: 1 },

  heroWrap: { position: "relative", height: 100 },
  heroImg: { width: 100, height: 100, borderRadius: 12 },
  heroPlaceholder: { alignItems: "center", justifyContent: "center" },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroBack: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : (StatusBar.currentHeight ?? 24),
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  infoCard: {
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    zIndex: 10,
  },
  infoTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  theaterName: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    marginBottom: 3,
  },
  addressTxt: { fontSize: 12, flex: 1, lineHeight: 16 },
  seatCountBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 52,
  },

  showStrip: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  showStripItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  showStripTxt: { fontSize: 13, fontWeight: "600", flex: 1 },
  showStripDivider: { height: 1, width: "100%" },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },

  seatLoading: { paddingVertical: 48, alignItems: "center" },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
    flexWrap: "wrap",
    paddingHorizontal: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3, borderWidth: 1 },

  seatMapScroll: {
    paddingHorizontal: 16,
    flexGrow: 1,
    justifyContent: "center",
  },
  seatMap: { flexDirection: "column", gap: 4, alignItems: "center" },
  catSection: { width: "100%", marginBottom: 6 },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginBottom: 3,
  },
  rowLabel: { width: 16, fontSize: 10, fontWeight: "700", textAlign: "center" },
  aisle: { width: 10 },

  screenWrap: { alignItems: "center", paddingVertical: 20 },
  screenBar: { width: W * 0.65, height: 3, borderRadius: 100 },
  screenGlow: { width: W * 0.55, height: 24, marginBottom: -2 },
  screenLabel: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
    marginTop: 8,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  breakRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  breakChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  footerMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seatCountBadge2: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  bookBtn: { borderRadius: 14, overflow: "hidden" },
  bookGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 8,
  },
});
