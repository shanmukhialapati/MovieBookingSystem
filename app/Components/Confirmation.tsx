import { mainApi } from "@/axios/axiosInstance";
import { useTheme } from "@/Context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import Navbar from "../Components/navBar";
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
interface StepProps {
  num: number;
  label: string;
  status: "done" | "active" | "inactive";
}

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
interface Food {
  id: number;
  name: string;
  price: number;
  category: "POPCORN" | "DRINK";
}

interface Coupon {
  id: number;
  code: string;
  discountPercentage: number;
  minAmount: number;
  imageUrl: string;
}
const foodImages: Record<string, string> = {
  "Salted Popcorn":
    "https://pncpopcorn.com/cdn/shop/files/ButterSaltedPopcorn_PnCPopcorn.png?v=1757655829",

  "Caramel Popcorn":
    "https://theheirloompantry.co/wp-content/uploads/2022/10/miso-caramel-popcorn-caramel-corn-the-heirloom-pantry-06-1024x1536.jpg",

  "Cheese Popcorn":
    "https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fill,g_auto,w_610,h_458/k%2FPhoto%2FRecipe%20Ramp%20Up%2F2022-02-Cheese-Popcorn%2Fcheese-popcorn-2",

  Pepsi:
    "https://i.pinimg.com/474x/95/d6/3a/95d63a98689069d1c95fa83c5ddbe721.jpg",

  "Coca Cola":
    "https://5.imimg.com/data5/SELLER/Default/2022/9/RI/RZ/QZ/47977595/300-ml-paper-coke-glasses-500x500.jpg",

  Sprite:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjAhER398de9CZQJ8lrDfF1PerdyvoVWcUiQ&s",
};
export default function BookingFlow() {
  const router = useRouter();
  const { bookingData } = useLocalSearchParams();
  const { theme, dark } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [foodList, setFoodList] = useState<Food[]>([]);
  const [selectedFoodQty, setSelectedFoodQty] = useState<
    Record<number, number>
  >({});
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isExtrasLoading, setIsExtrasLoading] = useState(true);
  const data = useMemo(() => {
    try {
      return bookingData ? JSON.parse(bookingData as string) : null;
    } catch {
      return null;
    }
  }, [bookingData]);

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 50 }}>
          No booking data found
        </Text>
      </View>
    );
  }

  const grandTotal = data.totalPrice;

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 50 }}>
          No booking data found
        </Text>
      </View>
    );
  }
  useEffect(() => {
    const fetchExtras = async () => {
      try {
        const [fRes, cRes] = await Promise.all([
          mainApi.get("/foods"),
          mainApi.get("/coupons"),
        ]);
        setFoodList(fRes.data);
        setAvailableCoupons(cRes.data);
      } catch (e) {
        console.error("Error fetching extras", e);
      } finally {
        setIsExtrasLoading(false);
      }
    };
    fetchExtras();
  }, []);
  const totals = useMemo(() => {
    if (!data) return { foodTotal: 0, discount: 0, grandTotal: 0 };

    const ticketTotal = data.totalPrice;
    let foodTotal = 0;

    foodList.forEach((food) => {
      const qty = selectedFoodQty[food.id] || 0;
      foodTotal += qty * food.price;
    });

    const subTotal = ticketTotal + foodTotal;
    let discount = 0;

    if (appliedCoupon && subTotal >= appliedCoupon.minAmount) {
      discount = (subTotal * appliedCoupon.discountPercentage) / 100;
    }

    return {
      foodTotal,
      discount,
      grandTotal: subTotal - discount,
    };
  }, [data, foodList, selectedFoodQty, appliedCoupon]);

  const updateFoodQty = (id: number, delta: number) => {
    setSelectedFoodQty((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };
  const selectedSeats = data.seatNumbers || [];
  const totalTicketPrice = data.totalPrice;
  const convenienceFee = 0;

  const [searchText, setSearchText] = useState("");
  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      const foodEntries = Object.entries(selectedFoodQty).filter(
        ([_, qty]) => qty > 0,
      );
      for (const [foodId, qty] of foodEntries) {
        await mainApi.post(
          `/foods/${data.bookingId}/${foodId}?quantity=${qty}`,
        );
      }

      if (appliedCoupon) {
        await mainApi.post(
          `/coupons/apply?bookingId=${data.bookingId}&code=${appliedCoupon.code}`,
        );
      }
      const response = await mainApi.post(`/payments/create/${data.bookingId}`);
      const paymentData = response.data;

      const options = {
        description: `Booking for ${data.movieName}`,
        image: "https://logo.png",
        currency: paymentData.currency,
        key: paymentData.key,
        amount: Math.round(paymentData.amount * 100),
        name: "Cinevault",
        order_id: paymentData.razorpayOrderId,
        prefill: {
          email: "user@example.com",
          contact: "9999999999",
          name: "Shanmukhi",
        },
        theme: { color: theme.primary },
      };

      if (Platform.OS === "web") {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          Alert.alert("Error", "Razorpay SDK failed to load.");
          return;
        }

        const rzp = new (window as any).Razorpay({
          ...options,
          handler: async (res: any) => {
            await verifyPayment(res, paymentData.paymentId);
          },
        });
        rzp.open();
      } else {
        const res = await RazorpayCheckout.open(options);
        await verifyPayment(res, paymentData.paymentId);
      }
    } catch (error: any) {
      console.error("Payment Initiation Error:", error);
      Alert.alert(
        "Payment Failed",
        error.description || "Could not start payment.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (razorpayResponse: any, paymentId: number) => {
    try {
      await mainApi.post("/payments/verify", {
        paymentId: paymentId,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
      });

      router.replace({
        pathname: "/Components/Ticket",
        params: { bookingId: data.bookingId },
      });
    } catch (error) {
      console.error("Verification Error:", error);
      Alert.alert("Error", "Payment verification failed.");
    }
  };
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={dark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <Navbar search={searchText} setSearch={setSearchText} />

      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              borderColor: theme.subText,
              backgroundColor: theme.card,
            },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={theme.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Booking Summary
        </Text>
      </View>

      <StepBar theme={theme} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.subText,
            },
          ]}
        >
          <Text style={[styles.movieTitle, { color: theme.text }]}>
            {data.movieName}
          </Text>

          <Text style={[styles.subText, { color: theme.subText }]}>
            {data.theaterName}
          </Text>

          <View style={styles.row}>
            <View>
              <Text style={[styles.label, { color: theme.primary }]}>TIME</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {data.showTime}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.label, { color: theme.primary }]}>
                SEATS
              </Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {selectedSeats.join(", ")}
              </Text>
            </View>
          </View>
        </View>
        <Text
          style={[styles.sectionTitle, { color: theme.text, marginTop: 10 }]}
        >
          Add Munchies
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          {foodList.map((food) => (
            <View
              key={food.id}
              style={[
                styles.foodCard,
                { backgroundColor: theme.card, borderColor: theme.subText },
              ]}
            >
              <Image
                source={{
                  uri:
                    foodImages[food.name] ||
                    "https://via.placeholder.com/60x60.png?text=Food",
                }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 10,
                  marginBottom: 6,
                  backgroundColor: "#eee",
                }}
                resizeMode="cover"
              />
              <Text
                style={{
                  color: theme.text,
                  fontSize: 12,
                  fontWeight: "bold",
                  marginTop: 5,
                }}
              >
                {food.name}
              </Text>
              <Text style={{ color: theme.subText, fontSize: 10 }}>
                ₹{food.price}
              </Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => updateFoodQty(food.id, -1)}>
                  <Ionicons
                    name="remove-circle"
                    size={22}
                    color={theme.primary}
                  />
                </TouchableOpacity>
                <Text style={{ color: theme.text, marginHorizontal: 8 }}>
                  {selectedFoodQty[food.id] || 0}
                </Text>
                <TouchableOpacity onPress={() => updateFoodQty(food.id, 1)}>
                  <Ionicons name="add-circle" size={22} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Offers & Coupons
        </Text>
        {availableCoupons.map((coupon) => {
          const isEligible =
            data.totalPrice + totals.foodTotal >= coupon.minAmount;
          const isSelected = appliedCoupon?.code === coupon.code;
          return (
            <TouchableOpacity
              key={coupon.id}
              disabled={!isEligible}
              onPress={() => setAppliedCoupon(isSelected ? null : coupon)}
              style={[
                styles.couponCard,
                { backgroundColor: theme.background },
                { marginBottom: 8, opacity: isEligible ? 1 : 0.5 },
                isSelected && { borderColor: theme.primary, borderWidth: 1.5 },
              ]}
            >
              <Image
                source={{ uri: coupon.imageUrl }}
                style={{
                  width: Platform.OS === "web" ? 550 : 300,
                  height: 100,
                  borderRadius: 8,
                }}
              />

              {isEligible && (
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                  size={24}
                  color={theme.primary}
                />
              )}
            </TouchableOpacity>
          );
        })}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.subText,
              marginTop: 20,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Price Details
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceText, { color: theme.subText }]}>
              Ticket Total
            </Text>
            <Text style={[styles.priceValue, { color: theme.text }]}>
              ₹{data.totalPrice.toFixed(2)}
            </Text>
          </View>
          {totals.foodTotal > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceText, { color: theme.subText }]}>
                Food & Drinks
              </Text>
              <Text style={[styles.priceValue, { color: theme.text }]}>
                ₹{totals.foodTotal.toFixed(2)}
              </Text>
            </View>
          )}
          {totals.discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceText, { color: "#22c55e" }]}>
                Coupon Discount
              </Text>
              <Text style={[styles.priceValue, { color: "#22c55e" }]}>
                - ₹{totals.discount.toFixed(2)}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.subText, opacity: 0.2 },
            ]}
          />
          <View style={styles.priceRow}>
            <Text style={[styles.totalText, { color: theme.primary }]}>
              Total Payable
            </Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>
              ₹{totals.grandTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>

        <View
          style={[
            styles.paymentCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.subText,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="credit-card-outline"
            size={24}
            color={theme.primary}
          />

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.paymentTitle, { color: theme.text }]}>
              Razorpay
            </Text>
            <Text style={[styles.paymentSub, { color: theme.subText }]}>
              Cards • UPI • Netbanking • Wallet
            </Text>
          </View>

          <Ionicons name="radio-button-on" size={22} color={theme.primary} />
        </View>

        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark" size={14} color={theme.primary} />
          <Text style={[styles.secureText, { color: theme.subText }]}>
            Secure encrypted payment
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.background, borderColor: theme.subText },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.payBtn,
            { backgroundColor: theme.primary },
            isProcessing && { opacity: 0.7 },
          ]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#052e10" />
          ) : (
            <Text style={[styles.payText, { color: "#052e10" }]}>Pay</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060e08",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },

  headerTitle: {
    color: "#f0fdf4",
    fontSize: 18,
    fontWeight: "800",
  },

  card: {
    backgroundColor: "rgba(15,46,26,0.55)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  movieTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#f0fdf4",
  },

  subText: {
    color: "#86efac",
    fontSize: 12,
    marginTop: 4,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  label: {
    fontSize: 10,
    color: "#4ade80",
    fontWeight: "700",
  },

  value: {
    color: "#e2fce9",
    fontSize: 13,
    marginTop: 2,
    fontWeight: "600",
  },

  sectionTitle: {
    color: "#f0fdf4",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },

  priceText: {
    color: "#86efac",
    fontSize: 13,
  },

  priceValue: {
    color: "#f0fdf4",
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(34,197,94,0.15)",
    marginVertical: 10,
  },

  totalText: {
    color: "#22c55e",
    fontSize: 15,
    fontWeight: "800",
  },

  totalValue: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "900",
  },

  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(15,46,26,0.45)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,

    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
    backgroundColor: "rgba(6,14,8,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },

  paymentTitle: {
    color: "#f0fdf4",
    fontSize: 14,
    fontWeight: "700",
  },

  paymentSub: {
    color: "#86efac",
    fontSize: 11,
  },

  secureRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    gap: 6,
  },

  secureText: {
    color: "#86efac",
    fontSize: 11,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#060e08",
    borderTopWidth: 1,
    borderColor: "rgba(34,197,94,0.15)",
  },

  payBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  payText: {
    color: "#052e10",
    fontSize: 16,
    fontWeight: "900",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34,197,94,0.08)",
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#22c55e",
    marginHorizontal: 6,
  },
  foodCard: {
    width: 130,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    alignItems: "center",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
});
