import mainApi from "@/axios/axiosInstance";
import { useTheme } from "@/Context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Navbar from "../Components/navBar";

let MapView: any = null;
let Marker: any = null;
let Callout: any = null;

if (Platform.OS !== "web") {
  try {
    const RNMaps = require("react-native-maps");
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    Callout = RNMaps.Callout;
  } catch {}
}

const { width: W, height: H } = Dimensions.get("window");
type SortMode = "all" | "location" | "city";

interface NearbyTheater {
  id: number;
  name: string;
  city: string;
  distanceKm?: number;
}

interface TheaterMapProps {
  theaters: { theater: any; shows: any[] }[];
  userCoords: { lat: number; lng: number } | null;
  distances: Record<number, number>;
  theme: any;
  onBook: (theaterId: number, showId: number) => void;
}

function buildLeafletHtml(
  theaters: { theater: any; shows: any[] }[],
  userCoords: { lat: number; lng: number } | null,
  centerLat: number,
  centerLng: number,
  theme: any,
): string {
  const markersJs = theaters
    .filter((g) => g.theater?.latitude && g.theater?.longitude)
    .map(({ theater, shows }) => {
      const dist =
        shows[0]?.distanceKm !== undefined
          ? `<div style="font-size:11px;color:${theme.primary};margin-bottom:4px;">📍 ~${Number(theater.distanceKm ?? 0).toFixed(1)} km away</div>`
          : "";
      const bookBtn = shows[0]
        ? `<button onclick="window.parent.postMessage({type:'book',theaterId:${theater.id},showId:${shows[0].id}},'*')" style="background:#02a55c;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;width:100%;margin-top:4px;">Book Tickets</button>`
        : "";
      return `
        L.marker([${theater.latitude}, ${theater.longitude}], {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:${"#fd0606"};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
            iconSize:[22,22], iconAnchor:[11,11]
          })
        }).bindPopup(\`
          <div style="font-family:sans-serif;min-width:180px">
            <div style="font-size:14px;font-weight:800;color:${theme.maptext};margin-bottom:4px;">${theater.name}</div>
            <div style="font-size:11px;color:#888;margin-bottom:4px;">${theater.address ?? ""}, ${theater.city ?? ""}</div>
            ${dist}
            <div style="font-size:11px;color:#888;margin-bottom:6px;">${shows.length} shows available</div>
            ${bookBtn}
          </div>
        \`).addTo(map);
      `;
    })
    .join("\n");

  const userMarker = userCoords
    ? `L.marker([${userCoords.lat}, ${userCoords.lng}], {
        icon: L.divIcon({
          className: '',
          html: '<div style="background:#6366f1;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(99,102,241,0.6);"></div>',
          iconSize:[24,24], iconAnchor:[12,12]
        })
      }).bindPopup('You are here').addTo(map);`
    : "";

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{width:100%;height:100%;background:${theme.background}}</style>
</head><body>
<div id="map"></div>
<script>
  var map = L.map('map').setView([${centerLat},${centerLng}], 12);
  L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; OpenStreetMap contributors &copy; CartoDB',
  }
).addTo(map);
  ${markersJs}
  ${userMarker}
  window.addEventListener('message', function(e){
    if(e.data && e.data.type==='locate'){
      map.setView([e.data.lat, e.data.lng], 13);
    }
  });
</script>
</body></html>`;
}

const TheaterMapView: React.FC<TheaterMapProps> = ({
  theaters,
  userCoords,
  distances,
  theme,
  onBook,
}) => {
  const validTheaters = theaters.filter(
    (g) => g.theater?.latitude && g.theater?.longitude,
  );

  const centerLat =
    userCoords?.lat ?? validTheaters[0]?.theater?.latitude ?? 17.385;
  const centerLng =
    userCoords?.lng ?? validTheaters[0]?.theater?.longitude ?? 78.4867;

  if (Platform.OS === "web") {
    const html = buildLeafletHtml(
      validTheaters,
      userCoords,
      centerLat,
      centerLng,
      theme,
    );
    const blob = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    useEffect(() => {
      const handler = (e: MessageEvent) => {
        if (e.data?.type === "book") {
          onBook(e.data.theaterId, e.data.showId);
        }
      };
      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }, [onBook]);

    return (
      <iframe
        src={blob}
        style={
          {
            flex: 1,
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: 16,
            minHeight: 380,
          } as React.CSSProperties
        }
        title="Theater Map"
      />
    );
  }

  if (!MapView) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <Text style={{ color: theme.maptext }}>
          Map not available on this device.
        </Text>
      </View>
    );
  }

  const delta = validTheaters.length > 3 ? 0.5 : 0.15;

  return (
    <View style={{ flex: 1, minHeight: 400 }}>
      <MapView
        provider="google"
        style={{ width: "100%", height: "100%" }}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: delta,
          longitudeDelta: delta,
        }}
        showsUserLocation={!!userCoords}
        showsMyLocationButton
      >
        {validTheaters.map(({ theater, shows: tShows }) => (
          <Marker
            key={theater.id}
            coordinate={{
              latitude: theater.latitude,
              longitude: theater.longitude,
            }}
            title={theater.name}
            pinColor={theme.primary}
          >
            {Callout && (
              <Callout tooltip>
                <View
                  style={[
                    ms.callout,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.primary + "44",
                    },
                  ]}
                >
                  <Text style={[ms.calloutName, { color: theme.text }]}>
                    {theater.name}
                  </Text>
                  <Text style={[ms.calloutCity, { color: theme.subText }]}>
                    {theater.address}, {theater.city}
                  </Text>
                  {distances[theater.id] !== undefined && (
                    <View style={ms.calloutDistRow}>
                      <Ionicons
                        name="navigate"
                        size={11}
                        color={theme.primary}
                      />
                      <Text style={[ms.calloutDist, { color: theme.primary }]}>
                        {distances[theater.id].toFixed(1)} km away
                      </Text>
                    </View>
                  )}
                  <Text style={[ms.calloutShows, { color: theme.subText }]}>
                    {tShows.length} shows available
                  </Text>
                  {tShows[0] && (
                    <TouchableOpacity
                      style={[
                        ms.calloutBtn,
                        { backgroundColor: theme.primary },
                      ]}
                      onPress={() => onBook(theater.id, tShows[0].id)}
                    >
                      <Text
                        style={[ms.calloutBtnTxt, { color: theme.textcommon }]}
                      >
                        Book Tickets
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Callout>
            )}
          </Marker>
        ))}

        {userCoords && (
          <Marker
            coordinate={{ latitude: userCoords.lat, longitude: userCoords.lng }}
            title="You are here"
            pinColor="#6366f1"
          />
        )}
      </MapView>
    </View>
  );
};

const TheaterListScreen: React.FC = () => {
  const { theme, dark } = useTheme();
  const router = useRouter();
  const { movieId } = useLocalSearchParams<{ movieId: string }>();

  const [searchText, setSearchText] = useState("");
  const [shows, setShows] = useState<any[]>([]);
  const [movieData, setMovieData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [sortMode, setSortMode] = useState<SortMode>("all");
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"filter" | "map">("filter");
  const [popularCities, setPopularCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [nearbyIds, setNearbyIds] = useState<number[]>([]);
  const [distances, setDistances] = useState<Record<number, number>>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!movieId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await mainApi.get("/user/showtimes", {
          params: { movieId },
        });
        if (res.data?.length > 0) {
          setShows(res.data);
          setMovieData(res.data[0].movie);
          setSelectedDate(res.data[0].showDate);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [movieId]);

  useEffect(() => {
    mainApi
      .get("/public/locations/popular-cities")
      .then((r) => setPopularCities(r.data ?? []))
      .catch(() => {});
  }, []);

  const uniqueDates = useMemo(
    () => [...new Set(shows.map((s) => s.showDate as string))],
    [shows],
  );

  const showsForDate = useMemo(() => {
    let base = shows.filter((s) => s.showDate === selectedDate);
    if (sortMode === "location" && nearbyIds.length > 0) {
      base = base.filter((s) => nearbyIds.includes(s.theater?.id));
    } else if (sortMode === "city" && selectedCity) {
      const sel = selectedCity.toLowerCase().replace("-ncr", "");
      base = base.filter((s) => {
        const c = (s.theater?.city ?? "").toLowerCase();
        if (sel.includes("bengaluru") || sel.includes("bangalore"))
          return c.includes("bengaluru") || c.includes("bangalore");
        return c.includes(sel);
      });
    }
    return base;
  }, [shows, selectedDate, sortMode, nearbyIds, selectedCity]);

  const theaterGroups = useMemo(() => {
    const map: Record<number, { theater: any; shows: any[] }> = {};
    showsForDate.forEach((s) => {
      const tid = s.theater?.id;
      if (!map[tid]) map[tid] = { theater: s.theater, shows: [] };
      map[tid].shows.push(s);
    });
    return Object.values(map).sort((a, b) => {
      if (sortMode === "location") {
        return (
          (distances[a.theater.id] ?? 999) - (distances[b.theater.id] ?? 999)
        );
      }
      return 0;
    });
  }, [showsForDate, sortMode, distances]);

  const allTheaterGroups = useMemo(() => {
    const map: Record<number, { theater: any; shows: any[] }> = {};
    shows
      .filter((s) => s.showDate === selectedDate)
      .forEach((s) => {
        const tid = s.theater?.id;
        if (!map[tid]) map[tid] = { theater: s.theater, shows: [] };
        map[tid].shows.push(s);
      });
    return Object.values(map);
  }, [shows, selectedDate]);

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };

  const fetchNearby = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      let lat: number;
      let lng: number;

      if (Platform.OS === "web") {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
          }),
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Location permission denied.");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      setUserCoords({ lat, lng });
      const res = await mainApi.get("/public/theaters/nearby", {
        params: { lat, lng, radiusKm: 50 },
      });
      const nearby: NearbyTheater[] = res.data ?? [];
      setNearbyIds(nearby.map((t) => t.id));
      const distMap: Record<number, number> = {};
      nearby.forEach((t) => (distMap[t.id] = t.distanceKm ?? 999));
      setDistances(distMap);
      setSortMode("location");
      setSelectedCity(null);
      if (modalTab === "filter") {
        setShowModal(false);
      }
    } catch {
      setLocationError("Could not fetch nearby theaters.");
    } finally {
      setLocationLoading(false);
    }
  };

  const applyCity = (city: string) => {
    setSelectedCity(city);
    setSortMode("city");
    setNearbyIds([]);
    setShowModal(false);
  };

  const clearSort = () => {
    setSortMode("all");
    setSelectedCity(null);
    setNearbyIds([]);
  };

  const sortLabel =
    sortMode === "location"
      ? "Near Me"
      : sortMode === "city" && selectedCity
        ? selectedCity
        : "All Cities";

  const minPrice = (grp: any) =>
    Math.min(...grp.shows.map((s: any) => s.price));

  const handleBookFromMap = (theaterId: number, showId: number) => {
    setShowModal(false);
    router.push({
      pathname: "/Components/MovieBooking",
      params: { showId, movieId: movieData?.id },
    });
  };

  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={dark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      <Navbar search={searchText} setSearch={setSearchText} />

      {movieData && (
        <LinearGradient
          colors={
            dark
              ? [theme.secondary + "44", theme.background]
              : [theme.secondary + "22", theme.background]
          }
          style={s.movieStrip}
        >
          <TouchableOpacity
            style={[
              s.backBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.primary + "33",
              },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color={theme.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={[s.movieTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {movieData.title}
            </Text>
            <View style={s.movieMeta}>
              {[
                movieData.language,
                movieData.genre,
                `${movieData.duration} min`,
                movieData.rating,
              ].map((tag, i) => (
                <View
                  key={i}
                  style={[
                    s.metaTag,
                    {
                      backgroundColor: theme.primary + "18",
                      borderColor: theme.primary + "30",
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
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      )}

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={{ color: theme.subText, marginTop: 10, fontSize: 13 }}>
            Loading shows...
          </Text>
        </View>
      ) : (
        <>
          <View
            style={[
              s.dateSectionWrap,
              { borderBottomColor: theme.primary + "18" },
            ]}
          >
            <Text style={[s.sectionLabel, { color: theme.primary }]}>
              SELECT DATE
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.dateRow}
            >
              {uniqueDates.map((date) => {
                const active = selectedDate === date;
                const d = new Date(date);
                const day = d.toLocaleDateString("en-IN", { weekday: "short" });
                const num = d.getDate();
                const mon = d.toLocaleDateString("en-IN", { month: "short" });
                return (
                  <TouchableOpacity
                    key={date}
                    onPress={() => setSelectedDate(date)}
                    style={[
                      s.dateCard,
                      {
                        backgroundColor: active ? theme.primary : theme.card,
                        borderColor: active
                          ? theme.primary
                          : theme.primary + "28",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? theme.textcommon : theme.subText,
                        fontSize: 10,
                        fontWeight: "700",
                        letterSpacing: 0.5,
                      }}
                    >
                      {day.toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        color: active ? theme.textcommon : theme.text,
                        fontSize: 22,
                        fontWeight: "900",
                        lineHeight: 26,
                      }}
                    >
                      {num}
                    </Text>
                    <Text
                      style={{
                        color: active ? theme.textcommon + "CC" : theme.subText,
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    >
                      {mon.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View
            style={[
              s.filterBar,
              {
                borderBottomColor: theme.primary + "14",
                backgroundColor: theme.card + "66",
              },
            ]}
          >
            <Text style={[s.sectionLabel, { color: theme.text, marginTop: 0 }]}>
              {theaterGroups.length} Theater
              {theaterGroups.length !== 1 ? "s" : ""}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[
                  s.filterBtn,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.primary + "28",
                  },
                ]}
                onPress={() => {
                  setModalTab("map");
                  setShowModal(true);
                }}
              >
                <Ionicons name="map-outline" size={14} color={theme.subText} />
                <Text
                  style={{
                    color: theme.subText,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  Map
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.filterBtn,
                  {
                    backgroundColor:
                      sortMode !== "all" ? theme.primary + "20" : theme.card,
                    borderColor:
                      sortMode !== "all"
                        ? theme.primary + "66"
                        : theme.primary + "28",
                  },
                ]}
                onPress={() => {
                  setModalTab("filter");
                  setShowModal(true);
                }}
              >
                <Ionicons
                  name={
                    sortMode === "location"
                      ? "navigate"
                      : sortMode === "city"
                        ? "business-outline"
                        : "filter-outline"
                  }
                  size={14}
                  color={sortMode !== "all" ? theme.primary : theme.subText}
                />
                <Text
                  style={{
                    color: sortMode !== "all" ? theme.primary : theme.subText,
                    fontSize: 12,
                    fontWeight: "700",
                    maxWidth: 110,
                  }}
                  numberOfLines={1}
                >
                  {sortLabel}
                </Text>
                {sortMode !== "all" && (
                  <TouchableOpacity
                    onPress={clearSort}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={15}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {theaterGroups.length === 0 ? (
              <View
                style={[
                  s.empty,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.primary + "22",
                  },
                ]}
              >
                <Ionicons
                  name="film-outline"
                  size={36}
                  color={theme.subText + "44"}
                />
                <Text
                  style={{
                    color: theme.subText,
                    marginTop: 10,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  No theaters for this filter
                </Text>
                <TouchableOpacity onPress={clearSort} style={s.clearBtn}>
                  <Text
                    style={{
                      color: theme.primary,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Show All
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              theaterGroups.map(({ theater, shows: tShows }) => {
                const dist = distances[theater.id];
                const stdPrice = minPrice({ shows: tShows });
                return (
                  <View
                    key={theater.id}
                    style={[
                      s.theaterCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.primary + "20",
                      },
                    ]}
                  >
                    <View style={s.theaterHeader}>
                      <View
                        style={[
                          s.theaterIconBox,
                          { backgroundColor: theme.primary + "18" },
                        ]}
                      >
                        {theater.imageUrl && !imgError[theater.id] ? (
                          <Image
                            source={{ uri: theater.imageUrl }}
                            style={s.heroImg}
                            resizeMode="cover"
                            onError={() =>
                              setImgError((prev) => ({
                                ...prev,
                                [theater.id]: true,
                              }))
                            }
                          />
                        ) : (
                          <View
                            style={[
                              s.heroImg,
                              s.heroPlaceholder,
                              { backgroundColor: theme.card },
                            ]}
                          >
                            <Ionicons
                              name="film"
                              size={28}
                              color={theme.primary + "44"}
                            />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[s.theaterName, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {theater.name}
                        </Text>
                        <View style={s.theaterSubRow}>
                          <Ionicons
                            name="location-outline"
                            size={11}
                            color={theme.subText}
                          />
                          <Text
                            style={[s.theaterSub, { color: theme.subText }]}
                            numberOfLines={1}
                          >
                            {theater.address}, {theater.city}
                          </Text>
                        </View>
                        <View style={s.amenitiesRow}>
                          {["Dolby", "4K", theater.totalSeats + " Seats"].map(
                            (a, i) => (
                              <View
                                key={i}
                                style={[
                                  s.amenity,
                                  { borderColor: theme.subText + "30" },
                                ]}
                              >
                                <Text
                                  style={{
                                    color: theme.subText,
                                    fontSize: 9,
                                    fontWeight: "600",
                                  }}
                                >
                                  {a}
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                      </View>
                      <View style={s.theaterRight}>
                        {dist !== undefined && (
                          <View
                            style={[
                              s.distBadge,
                              {
                                backgroundColor: theme.primary + "14",
                                borderColor: theme.primary + "33",
                              },
                            ]}
                          >
                            <Ionicons
                              name="navigate"
                              size={10}
                              color={theme.primary}
                            />
                            <Text
                              style={{
                                color: theme.primary,
                                fontSize: 10,
                                fontWeight: "700",
                              }}
                            >
                              {dist.toFixed(1)} km
                            </Text>
                          </View>
                        )}
                        <Text
                          style={{
                            color: theme.subText,
                            fontSize: 10,
                            marginTop: 4,
                          }}
                        >
                          from ₹{stdPrice}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        s.divider,
                        { backgroundColor: theme.primary + "14" },
                      ]}
                    />

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={s.timeRow}
                    >
                      {tShows
                        .sort((a: any, b: any) =>
                          a.showTime.localeCompare(b.showTime),
                        )
                        .map((show: any) => (
                          <TouchableOpacity
                            key={show.id}
                            style={[
                              s.timeChip,
                              {
                                backgroundColor: theme.background,
                                borderColor: theme.primary + "44",
                              },
                            ]}
                            onPress={() =>
                              router.push({
                                pathname: "/Components/MovieBooking",
                                params: {
                                  showId: show.id,
                                  movieId: movieData?.id,
                                },
                              })
                            }
                          >
                            <Text
                              style={{
                                color: theme.text,
                                fontSize: 14,
                                fontWeight: "800",
                              }}
                            >
                              {formatTime(show.showTime)}
                            </Text>
                            <View style={s.timeChipPrices}>
                              <Text
                                style={{
                                  color: theme.button,
                                  fontSize: 9,
                                  fontWeight: "700",
                                }}
                              >
                                STD ₹{show.price}
                              </Text>
                              <Text
                                style={{
                                  color: theme.secondary,
                                  fontSize: 9,
                                  fontWeight: "700",
                                }}
                              >
                                PRE ₹{show.price + 100}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </View>
                );
              })
            )}
          </ScrollView>
        </>
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={s.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable
            style={[
              s.sheet,
              modalTab === "map" && s.sheetMap,
              {
                backgroundColor: theme.background,
                borderColor: theme.primary + "28",
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient
              colors={[theme.secondary, theme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.sheetBar}
            />

            <View style={s.sheetHeader}>
              <Text style={[s.sheetTitle, { color: theme.text }]}>
                {modalTab === "map" ? "Theaters on Map" : "Filter Theaters"}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View
                  style={[
                    s.tabToggle,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.primary + "28",
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      s.tabBtn,
                      modalTab === "filter" && {
                        backgroundColor: theme.primary,
                      },
                    ]}
                    onPress={() => setModalTab("filter")}
                  >
                    <Ionicons
                      name="filter-outline"
                      size={13}
                      color={
                        modalTab === "filter" ? theme.textcommon : theme.subText
                      }
                    />
                    <Text
                      style={{
                        color:
                          modalTab === "filter"
                            ? theme.textcommon
                            : theme.subText,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      Filter
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      s.tabBtn,
                      modalTab === "map" && {
                        backgroundColor: theme.primary,
                      },
                    ]}
                    onPress={() => setModalTab("map")}
                  >
                    <Ionicons
                      name="map-outline"
                      size={13}
                      color={
                        modalTab === "map" ? theme.textcommon : theme.subText
                      }
                    />
                    <Text
                      style={{
                        color:
                          modalTab === "map" ? theme.textcommon : theme.subText,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      Map
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={20} color={theme.subText} />
                </TouchableOpacity>
              </View>
            </View>

            {modalTab === "map" ? (
              <View style={s.mapContainer}>
                {allTheaterGroups.length === 0 ? (
                  <View style={[s.mapEmpty, { backgroundColor: theme.card }]}>
                    <Ionicons
                      name="map-outline"
                      size={40}
                      color={theme.subText + "44"}
                    />
                    <Text
                      style={{
                        color: theme.subText,
                        marginTop: 10,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      No theater location data available
                    </Text>
                  </View>
                ) : (
                  <TheaterMapView
                    theaters={allTheaterGroups}
                    userCoords={userCoords}
                    distances={distances}
                    theme={theme}
                    onBook={handleBookFromMap}
                  />
                )}

                <View
                  style={[
                    s.mapLegend,
                    {
                      backgroundColor: theme.card + "EE",
                      borderColor: theme.primary + "22",
                    },
                  ]}
                >
                  <View style={s.legendItem}>
                    <View
                      style={[s.legendDot, { backgroundColor: "#ff0000" }]}
                    />
                    <Text style={{ color: theme.text, fontSize: 11 }}>
                      {allTheaterGroups.length} theaters
                    </Text>
                  </View>
                  {userCoords && (
                    <View style={s.legendItem}>
                      <View
                        style={[s.legendDot, { backgroundColor: "#6366f1" }]}
                      />
                      <Text style={{ color: theme.text, fontSize: 11 }}>
                        Your location
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={fetchNearby}
                    disabled={locationLoading}
                    style={s.legendNearBtn}
                  >
                    {locationLoading ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Ionicons
                        name="navigate"
                        size={13}
                        color={theme.primary}
                      />
                    )}
                    <Text
                      style={{
                        color: theme.primary,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {userCoords ? "Refresh location" : "Show my location"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    s.nearMeRow,
                    {
                      backgroundColor:
                        sortMode === "location"
                          ? theme.primary + "18"
                          : theme.card,
                      borderColor:
                        sortMode === "location"
                          ? theme.primary + "66"
                          : theme.primary + "22",
                    },
                  ]}
                  onPress={fetchNearby}
                  disabled={locationLoading}
                >
                  <View
                    style={[
                      s.nearMeIcon,
                      { backgroundColor: theme.primary + "18" },
                    ]}
                  >
                    {locationLoading ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Ionicons
                        name="navigate"
                        size={22}
                        color={theme.primary}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      Near Me
                    </Text>
                    <Text
                      style={{
                        color: theme.subText,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {userCoords
                        ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`
                        : "Use current GPS location"}
                    </Text>
                  </View>
                  {sortMode === "location" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>

                {locationError && (
                  <Text
                    style={{
                      color: theme.common,
                      fontSize: 12,
                      marginHorizontal: 16,
                      marginTop: 4,
                    }}
                  >
                    {locationError}
                  </Text>
                )}

                <View
                  style={[
                    s.cityDividerWrap,
                    { backgroundColor: theme.primary + "18" },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.subText,
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 1.5,
                    }}
                  >
                    OR SELECT CITY
                  </Text>
                </View>

                <View style={s.cityGrid}>
                  {popularCities.map((city) => {
                    const sel = sortMode === "city" && selectedCity === city;
                    return (
                      <TouchableOpacity
                        key={city}
                        style={[
                          s.cityChip,
                          {
                            backgroundColor: sel ? theme.primary : theme.card,
                            borderColor: sel
                              ? theme.primary
                              : theme.primary + "28",
                          },
                        ]}
                        onPress={() => applyCity(city)}
                      >
                        <Text
                          style={{
                            color: sel ? theme.textcommon : theme.text,
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {city}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {sortMode !== "all" && (
                  <TouchableOpacity
                    style={s.clearAllBtn}
                    onPress={() => {
                      clearSort();
                      setShowModal(false);
                    }}
                  >
                    <Text
                      style={{
                        color: theme.subText,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      Clear filter · Show all theaters
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default TheaterListScreen;

const ms = StyleSheet.create({
  callout: {
    width: 200,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  calloutName: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  calloutCity: { fontSize: 11, marginBottom: 4 },
  calloutDistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  calloutDist: { fontSize: 11, fontWeight: "700" },
  calloutShows: { fontSize: 11, marginBottom: 8 },
  calloutBtn: { borderRadius: 8, paddingVertical: 7, alignItems: "center" },
  calloutBtnTxt: { fontSize: 12, fontWeight: "800" },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  movieStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 24,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,

    alignItems: "center",
    justifyContent: "center",
  },
  movieTitle: { fontSize: 18, fontWeight: "900", letterSpacing: 0.2 },
  movieMeta: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 6 },
  metaTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },

  dateSectionWrap: { borderBottomWidth: 1, paddingBottom: 14 },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  dateRow: { paddingHorizontal: 16, gap: 8 },
  dateCard: {
    width: 58,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
  },

  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },

  theaterCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  theaterHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 10,
  },
  heroPlaceholder: { alignItems: "center", justifyContent: "center" },
  theaterIconBox: {
    width: 100,
    height: 100,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  theaterName: { fontSize: 15, fontWeight: "800", letterSpacing: 0.1 },
  theaterSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  theaterSub: { fontSize: 11, flex: 1 },
  theaterRight: { alignItems: "flex-end" },
  heroImg: { width: 100, height: 150, borderRadius: 0 },
  distBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  amenitiesRow: {
    flexDirection: "row",
    gap: 6,

    paddingVertical: 10,
  },
  amenity: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
  },
  divider: { height: 1, marginHorizontal: 0 },
  timeRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 90,
  },
  timeChipPrices: { flexDirection: "row", gap: 6, marginTop: 4 },

  empty: {
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 40,
    alignItems: "center",
  },
  clearBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: H * 0.75,
  },
  sheetMap: {
    height: H * 0.88,
  },
  sheetBar: { height: 3, width: "100%" },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700" },

  tabToggle: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 380,
  },
  mapEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    minHeight: 300,
  },
  mapLegend: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendNearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: "auto",
  },

  nearMeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 4,
  },
  nearMeIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cityDividerWrap: {
    marginHorizontal: 16,
    marginVertical: 14,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  cityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  clearAllBtn: { alignItems: "center", paddingVertical: 16 },
});
