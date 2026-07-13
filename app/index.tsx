import mainApi from "@/axios/axiosInstance";
import { useTheme } from "@/Context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MovieCard from "./Components/MovieCard";
import Navbar from "./Components/navBar";

interface Movie {
  id: number;
  title: string;
  genre: string;
  imdbScore: number;
  rating: string;
  posterUrl: string;
  backdropUrl: string;
  duration: number;
  language: string;
  releaseDate: string;
}

const GENRES = [
  "All",
  "Action",
  "Drama",
  "Sci-Fi",
  "Comedy",
  "Thriller",
  "Horror",
  "Animation",
];
const NAV_ITEMS = ["Now Showing", "Coming Soon", "Top Rated", "Watchlist"];

const TrendingCard: React.FC<{ item: any }> = ({ item }) => {
  const router = useRouter();
  const titlePrefix = item.title?.split(" ")[0]?.toUpperCase() || "MOVIE";
  const { theme, dark } = useTheme();
  const handlePress = () => {
    router.push({
      pathname: "/Components/MovieDetail",
      params: { id: item.id },
    });
  };
  return (
    <TouchableOpacity
      style={[
        styles.trendingCard,
        { backgroundColor: theme.card, borderColor: theme.primary },
      ]}
      onPress={handlePress}
    >
      <Text style={[styles.trendingRank, { color: theme.subText }]}>
        {item.rank < 10 ? `0${item.rank}` : item.rank}
      </Text>

      <View style={styles.trendingThumb}>
        {item.posterUrl ? (
          <Image
            source={{ uri: item.posterUrl }}
            style={styles.trendingThumbImage}
          />
        ) : (
          <LinearGradient
            colors={["#1a1a1a", "#2a2a2a"]}
            style={styles.trendingThumbGradient}
          >
            <Text style={styles.trendingThumbText}>{titlePrefix}</Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.trendingInfo}>
        <Text
          style={[styles.trendingTitle, { color: theme.subText }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        <Text style={styles.trendingMeta}>
          ★ {item.imdbScore ?? item.rating} · {item.genre}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen: React.FC = () => {
  const { theme, dark } = useTheme();
  const router = useRouter();
  const [activeGenre, setActiveGenre] = useState("All");
  const [showTrailer, setShowTrailer] = useState(false);
  const [activeNav, setActiveNav] = useState("Now Showing");
  const [minRating, setMinRating] = useState("7.0");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const heroMovie =
    movies.length > 0
      ? [...movies].sort((a, b) => b.imdbScore - a.imdbScore)[0]
      : null;
  const filteredMovies = movies.filter((m) => {
    const genreMatch = activeGenre === "All" || m.genre === activeGenre;
    const ratingMatch = m.imdbScore >= parseFloat(minRating);
    const searchMatch =
      searchText === "" ||
      m.title.toLowerCase().includes(searchText.toLowerCase());

    return genreMatch && ratingMatch && searchMatch;
  });
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await mainApi.get("/movies");
        setMovies(res.data);
      } catch (err) {
        console.log("API Error:", err);
      } finally {
        setLoading(false);
      }
    };
    const fetchUpcoming = async () => {
      try {
        const res = await mainApi.get("/user/upcoming-movies");
        setUpcomingMovies(res.data);
      } catch (err) {
        console.log("Upcoming API Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
    fetchUpcoming();
  }, []);
  const handleBooking = (movieId: number) => {
    router.push({
      pathname: "/Components/TheaterSelection",
      params: { movieId: movieId },
    });
  };
  const normalizedMovies = filteredMovies.map((item) => ({
    id: item.id.toString(),
    title: item.title,
    genre: item.genre,
    rating: item.rating,
    imdbScore: item.imdbScore,
    posterUrl: item.posterUrl,
    releaseDate: item.releaseDate,
  }));
  const normalizedUpcoming = upcomingMovies.map((item) => ({
    id: item.id.toString(),
    title: item.title,
    genre: item.genre,
    imdbScore: item.imdbScore || 0,
    posterUrl: item.posterUrl,
    releaseDate: item.releaseDate,
    type: "upcoming",
  }));
  const trendingMovies = movies
    .sort((a, b) => b.imdbScore - a.imdbScore)
    .slice(0, 10)
    .map((m, index) => ({
      id: m.id.toString(),
      rank: index + 1,
      title: m.title,
      genre: m.genre,
      rating: m.imdbScore,
      posterUrl: m.posterUrl,
    }));

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={dark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      <LinearGradient
        colors={dark ? [theme.background, "#1E1E26"] : ["#FFFFFF", theme.card]}
        style={styles.container}
      >
        {drawerOpen && (
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setDrawerOpen(false)}
          />
        )}

        <Navbar search={searchText} setSearch={setSearchText} />
        <View style={{ height: 8 }} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {heroMovie && (
            <View style={styles.hero}>
              <Image
                source={{
                  uri: heroMovie.backdropUrl || heroMovie.posterUrl,
                }}
                style={styles.heroImage}
              />

              <LinearGradient
                colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.6)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.8, y: 0 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.heroRow}>
                <Image
                  source={{ uri: heroMovie.posterUrl }}
                  style={styles.heroPoster}
                />

                <View style={styles.heroContent}>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>FEATURED</Text>
                  </View>

                  <Text style={[styles.heroTitle, { color: "#D1C4FF" }]}>
                    {heroMovie.title}
                  </Text>

                  <View style={styles.heroMeta}>
                    <Text style={{ color: theme.common }}>
                      {heroMovie.releaseDate?.split("-")[0]}
                    </Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={{ color: theme.common }}>
                      {heroMovie.genre}
                    </Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={{ color: theme.common }}>
                      {heroMovie.duration}m
                    </Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={{ color: "#22c55e" }}>
                      ★ {heroMovie.imdbScore}
                    </Text>
                  </View>

                  <Text
                    numberOfLines={3}
                    style={[styles.heroDesc, { color: "#D1C4FF" }]}
                  >
                    {heroMovie.title} is now streaming. Experience the latest in{" "}
                    {heroMovie.genre} cinema.
                  </Text>

                  <View style={styles.heroBtns}>
                    <TouchableOpacity
                      style={[styles.trailerBtn, { borderColor: "#D1C4FF" }]}
                      onPress={() => handleBooking(heroMovie.id)}
                    >
                      <Text style={[styles.trailerText, { color: "#D1C4FF" }]}>
                        Book tickets
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreScroll}
          >
            {GENRES.map((g) => {
              const isActive = activeGenre === g;

              return (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genreChip,
                    {
                      borderColor: theme.primary,
                      backgroundColor: isActive
                        ? theme.primary + "20"
                        : "transparent",
                    },
                    isActive && styles.genreChipActive,
                  ]}
                  onPress={() => setActiveGenre(g)}
                >
                  <Text
                    style={[
                      styles.genreChipText,
                      {
                        color: isActive ? theme.primary : theme.subText,
                      },
                      isActive && styles.genreChipTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Now Showing
            </Text>
            {/* <TouchableOpacity
              onPress={() => router.replace("/Components/AllMovies")}
            >
              <Text style={[styles.viewTitle, { color: theme.primary }]}>
                View All
              </Text>
            </TouchableOpacity> */}
          </View>

          {filteredMovies.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                No movies match your filters.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredMovies}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <MovieCard
                    movie={{
                      id: item.id.toString(),
                      title: item.title,
                      genre: item.genre,
                      imdbScore: item.imdbScore,
                      posterUrl: item.posterUrl,
                      year: parseInt(item.releaseDate?.split("-")[0]),
                    }}
                  />
                </View>
              )}
            />
          )}

          {/* <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/Components/Sample")}
          >
            link
          </TouchableOpacity> */}

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Trending This Week
            </Text>
          </View>
          {trendingMovies.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                No trending movies found.
              </Text>
            </View>
          ) : (
            <FlatList
              data={trendingMovies}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              renderItem={({ item }) => <TrendingCard item={item} />}
            />
          )}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Upcoming Movies
            </Text>
          </View>

          {normalizedUpcoming.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                No upcoming movies available.
              </Text>
            </View>
          ) : (
            <FlatList
              data={normalizedUpcoming}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/Components/MovieDetail",
                        params: {
                          id: item.id,
                          type: "upcoming",
                        },
                      })
                    }
                  >
                    <MovieCard movie={item} type="upcoming" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#010704",
  },
  container: {
    flex: 1,
  },

  hero: {
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
    height: 320,
    justifyContent: "center",
  },

  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  heroPoster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    marginRight: 16,
  },

  heroContent: {
    flex: 1,
    justifyContent: "center",
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },

  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  dot: {
    marginHorizontal: 6,
    color: "#888",
  },

  heroDesc: {
    fontSize: 13,

    marginBottom: 12,
  },

  heroBtns: {
    flexDirection: "row",
    gap: 10,
  },

  btnPlay: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  btnPlayText: {
    color: "#000",
    fontWeight: "700",
  },

  btnOutline: {
    borderWidth: 1,
    borderColor: "#22c55e",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  btnOutlineText: {
    fontWeight: "600",
  },
  heroBadge: {
    backgroundColor: "#22c55e",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  heroBadgeText: {
    color: "#060e08",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  cardWrapper: {
    width: Platform.OS === "web" ? "50%" : 160, // Set a fixed width for horizontal scrolling
    marginRight: 12,
  },
  Meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  heroMetaText: {
    color: "#4ade80",
    fontSize: 13,
  },
  heroDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(34,197,94,0.18)",
  },
  heroRating: {
    color: "#22c55e",
    fontSize: 11,
    fontWeight: "600",
  },

  // Genre Chips
  genreScroll: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  genreChipActive: {
    backgroundColor: "rgba(203, 128, 249, 0.23)",
    borderColor: "#7622c5",
  },
  genreChipText: {
    fontSize: 12,

    fontWeight: "500",
  },
  genreChipTextActive: {
    // color: "#058634",
    fontWeight: "600",
  },

  // Section
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 15,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-condensed",
  },
  viewTitle: {
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: 12,
    color: "#4ade80",
  },

  movieGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },

  moviePoster: {
    width: "100%",

    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  posterImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  posterGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  posterTitle: {
    color: "rgba(240,253,244,0.85)",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-condensed",
  },
  posterBadge: {
    position: "absolute",
    top: 7,
    left: 7,
    backgroundColor: "#22c55e",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  posterBadgeText: {
    color: "#060e08",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  ratingBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "rgba(6,14,8,0.85)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 1,
  },
  ratingText: {
    color: "#22c55e",
    fontSize: 9,
    fontWeight: "700",
  },
  movieTitle: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 7,
    lineHeight: 16,
  },
  movieMeta: {
    color: "#4ade80",
    fontSize: 10,
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#4ade80",
    fontSize: 14,
  },

  // Trending
  trendingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,

    borderWidth: 1,

    borderRadius: 12,
    padding: 12,
    width: Platform.OS === "web" ? 300 : 260,
    height: Platform.OS === "web" ? 190 : 160,
    marginBottom: 16,
  },
  trendingRank: {
    fontSize: Platform.OS === "web" ? 35 : 30,
    fontWeight: "900",

    width: 35,
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-condensed",
  },
  trendingThumb: {
    width: Platform.OS === "web" ? 100 : 80,
    height: Platform.OS === "web" ? 150 : 130,
    borderRadius: 6,
    overflow: "hidden",
  },
  trendingThumbImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  trendingThumbGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  trendingThumbText: {
    color: "rgba(240,253,244,0.85)",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  trendingInfo: {
    flex: 1,
  },
  trendingTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 3,
  },
  trendingMeta: {
    color: "#00ae40",
    fontSize: 13,
    fontWeight: "500",
  },

  // Drawer
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 10,
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "#060e08",
    borderRightWidth: 1,
    borderRightColor: "rgba(34,197,94,0.15)",
    zIndex: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 30,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
    color: "#22c55e",
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-condensed",
  },
  logoAccent: {
    color: "#22c55e",
  },
  closeBtn: {
    fontSize: 16,
    color: "#4ade80",
    padding: 4,
  },
  drawerSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#4ade80",
    paddingHorizontal: 20,
    marginBottom: 6,
    marginTop: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navItemActive: {
    backgroundColor: "rgba(34,197,94,0.1)",
    borderLeftWidth: 3,
    borderLeftColor: "#22c55e",
  },
  navDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(34,197,94,0.18)",
  },
  navDotActive: {
    backgroundColor: "#22c55e",
  },
  navItemText: {
    fontSize: 14,
    color: "#4ade80",
    fontWeight: "400",
  },
  navItemTextActive: {
    color: "#22c55e",
    fontWeight: "500",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "rgba(34,197,94,0.1)",
    marginVertical: 14,
    marginHorizontal: 20,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  chipActive: {
    backgroundColor: "rgba(34,197,94,0.18)",
    borderColor: "#22c55e",
  },
  chipText: {
    fontSize: 12,
    color: "#4ade80",
  },
  chipTextActive: {
    color: "#22c55e",
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 6,
  },
  ratingBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.15)",
  },
  ratingBtnActive: {
    backgroundColor: "rgba(34,197,94,0.18)",
    borderColor: "#22c55e",
  },
  ratingBtnText: {
    fontSize: 12,
    color: "#4ade80",
    fontWeight: "500",
  },
  ratingBtnTextActive: {
    color: "#22c55e",
    fontWeight: "700",
  },
  poster: {
    width: 200,
    height: 300,
    borderRadius: 12,
    marginVertical: Platform.OS === "web" ? 50 : 20,
    marginLeft: Platform.OS === "web" ? 100 : 20,
  },
  button: {
    backgroundColor: "#e63946",
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  bookBtn: {
    backgroundColor: "#e63946",
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 12,
  },

  bookText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  trailerBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 12,
    marginRight: 10,
  },

  trailerText: {
    fontWeight: "600",
  },
});

export default HomeScreen;
