import mainApi from "@/axios/axiosInstance";
import { useTheme } from "@/Context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import Navbar from "../Components/navBar";

export const lightTheme = {
  background: "#e3fcf0",
  card: "#f5f5f5",
  text: "#111",
  subText: "#555",
  primary: "#026c39",
  inputBg: "#dadada",
  secondary: "#02653573",
};

export const darkTheme = {
  background: "#161616",
  card: "#0a2e1a",
  text: "#f1f1f1",
  subText: "#aaa",
  primary: "#00E676",
  inputBg: "#033D2E",
};

type Theme = typeof darkTheme;

interface Movie {
  id: string;
  title: string;
  year: number;
  genre: string;
  rating: number;
  badge?: string;
  gradientColors: [string, string];
  posterUrl?: string;
}

interface CastMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  initials: string;
  avatarBg: string;
  avatarTextColor: string;
}

interface Review {
  id: string;
  author: string;
  initials: string;
  avatarBg: string;
  avatarTextColor: string;
  stars: number;
  text: string;
}

interface MovieDetails {
  backdropUrl: string;
  posterUrl: string;
  synopsis: string;
  director: string;
  screenplay: string;
  cinematography: string;
  description: string;
  music: string;
  studio: string;
  basedOn?: string;
  releaseDate: string;
  budget: string;
  boxOffice: string;
  runtime: string;
  rating: string;
  imdbScore: number;
  genres: string[];
  badges: string[];
  cast: CastMember[];
  reviews: Review[];
  ratingBreakdown: { stars: number; pct: number }[];
  similar: Movie[];
  trailerId?: string;
  id: number;
  title: string;
  year: number;
}

const mapMovieDetails = (data: any): MovieDetails => ({
  id: data.id,
  title: data.title,
  backdropUrl: data.backdropUrl,
  posterUrl: data.posterUrl,
  synopsis: data.synopsis || data.description,
  director: data.director,
  screenplay: data.screenplay,
  cinematography: data.cinematography,
  music: data.music,
  studio: data.studio,
  basedOn: data.basedOn,
  releaseDate: data.releaseDate,
  budget: data.budget ?? "N/A",
  boxOffice: data.boxOffice ?? "N/A",
  description: data.description,
  runtime: data.runtime || `${data.duration} mins`,
  rating: data.rating,
  imdbScore: data.imdbScore,
  year: data.releaseDate ? new Date(data.releaseDate).getFullYear() : 2026,
  genres: Array.isArray(data.genres)
    ? data.genres
    : data.genre
      ? [data.genre]
      : [],
  badges: data.badges ?? [],
  cast: data.cast ?? [],
  reviews: data.reviews ?? [],
  ratingBreakdown: [
    { stars: 5, pct: 60 },
    { stars: 4, pct: 25 },
    { stars: 3, pct: 10 },
    { stars: 2, pct: 3 },
    { stars: 1, pct: 2 },
  ],
  similar: (data.similar ?? []).map((m: any) => ({
    id: String(m.id),
    title: m.title,
    year: m.releaseDate ? new Date(m.releaseDate).getFullYear() : 2026,
    genre: m.genre || (m.genres ? m.genres[0] : "Action"),
    rating: m.imdbScore,
    gradientColors: ["#1a1a1a", "#2a2a2a"],
    posterUrl: m.posterUrl,
  })),
  trailerId: data.trailerId,
});

const StarRating: React.FC<{ count: number; max?: number }> = ({
  count,
  max = 5,
}) => (
  <View style={{ flexDirection: "row", gap: 2 }}>
    {Array.from({ length: max }).map((_, i) => (
      <Text
        key={i}
        style={{ fontSize: 11, color: i < count ? "#f59e0b" : "#333" }}
      >
        ★
      </Text>
    ))}
  </View>
);

const CastCard: React.FC<{ item: CastMember; theme: Theme }> = ({
  item,
  theme,
}) => {
  const [imgError, setImgError] = useState(false);
  return (
    <View style={styles.castCard}>
      {!imgError && item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={[styles.castImg, { borderColor: theme.primary + "44" }]}
          onError={() => setImgError(true)}
        />
      ) : (
        <View
          style={[
            styles.castImg,
            {
              backgroundColor: theme.inputBg,
              alignItems: "center",
              justifyContent: "center",
              borderColor: theme.primary + "44",
            },
          ]}
        >
          <Text
            style={{ color: theme.primary, fontWeight: "700", fontSize: 14 }}
          >
            {item.initials}
          </Text>
        </View>
      )}
      <Text style={[styles.castName, { color: theme.text }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text
        style={[styles.castRole, { color: theme.subText }]}
        numberOfLines={1}
      >
        {item.role}
      </Text>
    </View>
  );
};

const ReviewCard: React.FC<{ item: any; theme: Theme }> = ({ item, theme }) => (
  <View
    style={[
      styles.reviewCard,
      { backgroundColor: theme.card, borderColor: theme.primary + "1a" },
    ]}
  >
    <View style={styles.reviewHead}>
      <View style={[styles.reviewAvatar, { backgroundColor: theme.inputBg }]}>
        <Text style={{ color: theme.primary, fontWeight: "700", fontSize: 12 }}>
          {item.userName?.charAt(0)} {/* avatar initial */}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.reviewAuthor, { color: theme.text }]}>
          {item.userName}
        </Text>
        <StarRating count={item.rating} />
      </View>
    </View>

    <Text style={[styles.reviewText, { color: theme.subText }]}>
      {item.comment}
    </Text>
  </View>
);

const SimilarCard: React.FC<{ item: Movie; theme: Theme }> = ({
  item,
  theme,
}) => {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  return (
    <TouchableOpacity
      style={styles.similarCard}
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/Components/MovieDetail",
          params: { id: item.id },
        })
      }
    >
      {!imgError && item.posterUrl ? (
        <Image
          source={{ uri: item.posterUrl }}
          style={[styles.similarImg, { borderColor: theme.primary + "26" }]}
          onError={() => setImgError(true)}
        />
      ) : (
        <LinearGradient
          colors={item.gradientColors}
          style={[
            styles.similarImg,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Text
            style={{
              color: theme.primary,
              fontSize: 10,
              fontWeight: "800",
              textAlign: "center",
              padding: 4,
            }}
          >
            {item.title.toUpperCase()}
          </Text>
        </LinearGradient>
      )}
      <Text
        style={[styles.similarTitle, { color: theme.text }]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <Text style={styles.similarRating}>★ {item.rating}</Text>
    </TouchableOpacity>
  );
};

const RatingBar: React.FC<{ stars: number; pct: number; theme: Theme }> = ({
  stars,
  pct,
  theme,
}) => (
  <View style={styles.ratingBarRow}>
    <Text style={[styles.ratingBarLabel, { color: "#f59e0b" }]}>
      {"★".repeat(stars)}
      {"☆".repeat(5 - stars)}
    </Text>
    <View style={[styles.ratingBarTrack, { backgroundColor: theme.inputBg }]}>
      <View
        style={[
          styles.ratingBarFill,
          { width: `${pct}%` as any, backgroundColor: theme.primary },
        ]}
      />
    </View>
    <Text style={[styles.ratingBarPct, { color: theme.subText }]}>{pct}%</Text>
  </View>
);

const MovieDetailScreen = () => {
  const router = useRouter();

  const { theme, dark } = useTheme();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  useEffect(() => {
    if (!id) return;

    const fetchMovie = async () => {
      setLoading(true);
      try {
        const res = await mainApi.get(
          type === "upcoming" ? `/user/upcoming-movies/${id}` : `/movies/${id}`,
        );
        setMovie(mapMovieDetails(res.data));
      } catch (err) {
        console.error("Failed to fetch movie details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <View
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.subText, marginTop: 12, fontSize: 14 }}>
          Fetching movie details...
        </Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          },
        ]}
      >
        <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
        <View
          style={[
            styles.errorCircle,
            { backgroundColor: theme.card, borderColor: "#ef444433" },
          ]}
        >
          <Ionicons name="film-outline" size={40} color="#ef4444" />
        </View>
        <Text style={[styles.errorTitle, { color: theme.text }]}>
          Movie Not Found
        </Text>
        <Text style={[styles.errorSubtitle, { color: theme.subText }]}>
          The details for this film are currently unavailable or the link has
          expired.
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.errorBackButton, { backgroundColor: theme.primary }]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={theme.background}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.errorBackText, { color: theme.background }]}>
            Return to Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  const handleShare = async () => {
    if (!movie) return;

    try {
      await Share.share({
        message: `🎬 Check out this movie: ${movie.title}
        ${movie.posterUrl}

⭐ Rating: ${movie.rating}
📅 Year: ${movie.year}

${movie.description}

Watch trailer: https://www.youtube.com/watch?v=${movie.trailerId}`,
      });
    } catch (error) {
      console.error("Error sharing movie:", error);
    }
  };
  const handlePress = () => {
    router.push({
      pathname: "/Components/TheaterSelection",
      params: { movieId: parseInt(id) },
    });
  };
  const details = movie;

  const headerOpacity = scrollY.interpolate({
    inputRange: [140, 200],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Navbar search={searchText} setSearch={setSearchText} />
      <StatusBar
        barStyle={dark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      {/* 
      <View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={[theme.background + "f9", theme.background + "eb"]}
          style={StyleSheet.absoluteFill}
        />
       
        <Text
          style={[styles.stickyTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {movie.title}
        </Text>
        <TouchableOpacity
          onPress={() => setInWatchlist(!inWatchlist)}
          style={styles.stickyWatchlist}
        >
          <Text
            style={{
              fontSize: 18,
              color: inWatchlist ? theme.primary : theme.subText,
            }}
          >
            {inWatchlist ? "✓" : "+"}
          </Text>
        </TouchableOpacity>
      </View> */}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: movie.backdropUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />

          <LinearGradient
            colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.7)", "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.95)"]}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                borderColor: "#D1C4FF" + "33",
                backgroundColor: theme.card,
              },
            ]}
            onPress={() => router.replace("/")}
          >
            <Ionicons name="chevron-back" size={22} color={"#D1C4FF"} />
          </TouchableOpacity>

          <View style={styles.heroRow}>
            <Image source={{ uri: movie.posterUrl }} style={styles.poster} />

            <View style={styles.heroRight}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badgeGreen,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[styles.badgeGreenText, { color: theme.background }]}
                  >
                    {type === "upcoming" ? "COMING SOON" : "NOW SHOWING"}
                  </Text>
                </View>
                {details.badges.map((b) => (
                  <View
                    key={b}
                    style={[
                      styles.badgeOutline,
                      { borderColor: "#D1C4FF" + "66" },
                    ]}
                  >
                    <Text
                      style={[styles.badgeOutlineText, { color: "#D1C4FF" }]}
                    >
                      {b}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.title}>{movie.title}</Text>

              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: theme.subText }]}>
                  {movie.year}
                </Text>
                <View
                  style={[styles.dot, { backgroundColor: theme.subText }]}
                />
                <Text style={[styles.metaText, { color: theme.subText }]}>
                  {movie.genres.join(", ")}
                </Text>
                <View
                  style={[styles.dot, { backgroundColor: theme.subText }]}
                />
                <Text style={[styles.metaText, { color: theme.subText }]}>
                  {details.runtime}
                </Text>
                <View
                  style={[styles.dot, { backgroundColor: theme.subText }]}
                />
                <Text style={[styles.metaRating, { color: "#D1C4FF" }]}>
                  {movie.rating}
                </Text>
              </View>

              <View style={styles.formatRow}>
                <Text style={styles.format}>2D</Text>
                <Text style={styles.format}>DOLBY</Text>
              </View>
              <View>
                <Text style={[styles.metaText, { color: theme.subText }]}>
                  {details.description}
                </Text>
              </View>

              <View style={styles.interestBox}>
                <TouchableOpacity
                  style={[styles.trailerBtn, { borderColor: "#D1C4FF" }]}
                  onPress={() => {
                    if (!details.trailerId) {
                      console.log("No trailer ID found");
                      return;
                    }
                    Linking.openURL(
                      `https://www.youtube.com/watch?v=${details.trailerId}`,
                    );
                    // if (Platform.OS === "web") {
                    //   Linking.openURL(
                    //     `https://www.youtube.com/watch?v=${details.trailerId}`,
                    //   );
                    // } else {
                    //   setShowTrailer(true);
                    // }
                  }}
                >
                  <Text style={[styles.trailerText, { color: "#D1C4FF" }]}>
                    ▶ Watch Trailer
                  </Text>
                </TouchableOpacity>

                {type !== "upcoming" && (
                  <TouchableOpacity
                    style={[styles.trailerBtn, { borderColor: "#D1C4FF" }]}
                    onPress={handlePress}
                  >
                    <Text style={[styles.trailerText, { color: "#D1C4FF" }]}>
                      Book tickets
                    </Text>
                  </TouchableOpacity>
                )}
                {Platform.OS === "web" && (
                  <TouchableOpacity
                    style={[styles.shareBtn, { borderColor: "#D1C4FF" }]}
                    onPress={handleShare}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={16}
                      color="#D1C4FF"
                    />
                    <Text style={[styles.trailerText, { color: "#D1C4FF" }]}>
                      Share
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {Platform.OS === "android" && (
                <TouchableOpacity
                  style={[styles.shareBtn, { borderColor: theme.primary }]}
                  onPress={handleShare}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={16}
                    color={theme.primary}
                  />
                  <Text style={[styles.trailerText, { color: theme.primary }]}>
                    Share
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {type !== "upcoming" && (
          <View style={styles.statsRow}>
            {[
              { value: details.imdbScore, label: "IMDb Score" },
              { value: details.boxOffice, label: "Box Office" },
              { value: details.runtime, label: "Runtime" },
            ].map(({ value, label }) => (
              <View
                key={label}
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.primary + "1e",
                  },
                ]}
              >
                <Text style={[styles.statValue, { color: theme.primary }]}>
                  {value}
                </Text>
                <Text style={[styles.statLabel, { color: theme.subText }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {details.cast.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Cast
            </Text>
            <FlatList
              data={details.cast}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => <CastCard item={item} theme={theme} />}
            />
          </View>
        )}

        <View
          style={[styles.divider, { backgroundColor: theme.primary + "14" }]}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Film Details
          </Text>
          <View style={styles.detailGrid}>
            {[
              { label: "DIRECTOR", value: details.director },
              { label: "STUDIO", value: details.studio },
              { label: "SCREENPLAY", value: details.screenplay },
              { label: "RELEASE DATE", value: details.releaseDate },
              { label: "CINEMATOGRAPHY", value: details.cinematography },
              { label: "MUSIC", value: details.music },
              ...(details.basedOn
                ? [{ label: "BASED ON", value: details.basedOn }]
                : []),
              { label: "BUDGET", value: details.budget },
            ].map(({ label, value }) => (
              <View
                key={label}
                style={[
                  styles.detailRow,
                  { borderBottomColor: theme.primary + "11" },
                ]}
              >
                <Text style={[styles.detailLabel, { color: theme.primary }]}>
                  {label}
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[styles.divider, { backgroundColor: theme.primary + "14" }]}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Genres
          </Text>
          <View style={styles.genresWrap}>
            {details.genres.map((g) => (
              <View
                key={g}
                style={[
                  styles.genreTag,
                  {
                    backgroundColor: theme.primary + "14",
                    borderColor: theme.primary + "40",
                  },
                ]}
              >
                <Text style={[styles.genreTagText, { color: theme.subText }]}>
                  {g}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[styles.divider, { backgroundColor: theme.primary + "14" }]}
        />

        {type !== "upcoming" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Audience Score
            </Text>
            {details.ratingBreakdown.map(({ stars, pct }) => (
              <RatingBar key={stars} stars={stars} pct={pct} theme={theme} />
            ))}
          </View>
        )}

        <View
          style={[styles.divider, { backgroundColor: theme.primary + "14" }]}
        />

        {type !== "upcoming" && details.reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Reviews
            </Text>
            {details.reviews.map((r) => (
              <ReviewCard key={r.id} item={r} theme={theme} />
            ))}
          </View>
        )}

        {details.similar.length > 0 && (
          <>
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.primary + "14" },
              ]}
            />
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                More Like This
              </Text>
              <FlatList
                data={details.similar}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                renderItem={({ item }) => (
                  <SimilarCard item={item} theme={theme} />
                )}
              />
            </View>
          </>
        )}
      </Animated.ScrollView>

      {Platform.OS !== "web" && (
        <Modal
          visible={showTrailer}
          animationType="slide"
          onRequestClose={() => setShowTrailer(false)}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowTrailer(false)}
              style={styles.closeBtn}
            >
              <Text style={{ color: theme.text, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
            <YoutubePlayer
              key={details.trailerId}
              play={true}
              videoId={details.trailerId || ""}
            />
          </View>
        </Modal>
      )}
    </View>
  );
};



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  stickyHeader: {
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  stickyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 12,
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-condensed",
  },
  stickyWatchlist: {
    padding: 4,
    
      },

  // heroWrap: {
  //   height: 500,
  //   borderWidth: 1,

  //   overflow: "hidden",
  //   position: "relative",
  //   marginHorizontal: 20,
  //   marginTop: 10,
  //   borderRadius: 16,
  // },
  heroContent: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  badgeGreen: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeGreenText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  badgeOutline: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeOutlineText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 8,
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-condensed",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 12,
  },
  metaRating: {
    fontSize: 12,
    fontWeight: "700",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.5,
  },
  heroDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  btnTrailer: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnTrailerText: {
    fontWeight: "600",
    fontSize: 13,
  },
  btnOutline: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnOutlineText: {
    fontSize: 13,
    fontWeight: "500",
  },

  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 20,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: Platform.OS === "web" ? 17 : 14,
    fontWeight: "700",
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-condensed",
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 3,
    textAlign: "center",
  },

  section: {
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 16,
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-condensed",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },

  castCard: {
    width: 80,
    alignItems: "center",
  },
  castImg: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 2,
    marginBottom: 6,
    resizeMode: "cover",
  },
  castName: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
  },
  castRole: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
  },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
  },
  detailRow: {
    width: "50%",
    paddingVertical: 8,
    paddingRight: 8,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
  },

  genresWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  genreTag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  genreTagText: {
    fontSize: 12,
  },

  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  ratingBarLabel: {
    fontSize: 11,
    width: 68,
  },
  ratingBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  ratingBarPct: {
    fontSize: 10,
    width: 30,
    textAlign: "right",
  },

  backBtn: {
    position: "absolute",
    top: Platform.OS === "android" ? 10 : 30,
    left: Platform.OS === "android" ? 10 : 30,
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  reviewCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  reviewHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  reviewText: {
    fontSize: 12,
    lineHeight: 18,
  },

  similarCard: {
    width: 110,
  },
  similarImg: {
    width: 110,
    height: 155,
    borderRadius: 8,
    borderWidth: 1,
    resizeMode: "cover",
  },
  similarTitle: {
    fontSize: 11,
    marginTop: 5,
    lineHeight: 15,
  },
  similarRating: {
    fontSize: 10,
    color: "#f59e0b",
    marginTop: 2,
  },

  backButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 12,
    margin: 20,
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },

  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-condensed",
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  errorBackButton: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  errorBackText: {
    fontWeight: "700",
    fontSize: 15,
  },
  heroWrap: {
    height: 370,
    justifyContent: "center",
  },

  heroRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    alignItems: "center",
  },

  poster: {
    width: Platform.OS === "web" ? 200 : 120,
    height: Platform.OS === "web" ? 300 : 200,
    borderRadius: 12,
    marginVertical: Platform.OS === "web" ? 50 : 10,
    marginLeft: Platform.OS === "web" ? 100 : 0,
  },

  heroRight: {
    flex: 1,
    marginLeft: Platform.OS === "web" ? 30 : 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 10,
  },

  interestBox: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  interestText: {
    color: "#4ade80",
    fontWeight: "600",
  },

  meta: {
    color: "#ccc",
    fontSize: Platform.OS === "web" ? 13 : 8,
    marginBottom: 8,
  },

  formatRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  format: {
    backgroundColor: "#333",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: Platform.OS === "web" ? 12 : 10,
  },

  bookBtn: {
    backgroundColor: "#e63946",
    paddingVertical: Platform.OS === "web" ? 10 : 8,
    borderRadius: 10,
    paddingHorizontal: Platform.OS === "web" ? 14 : 8,
    alignItems: "center",
    marginBottom: 12,
  },

  bookText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: Platform.OS === "web" ? 16 : 10,
  },
  trailerBtn: {
    borderWidth: 1,
    paddingVertical: Platform.OS === "web" ? 10 : 8,
    borderRadius: 10,
    paddingHorizontal: Platform.OS === "web" ? 14 : 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    marginRight: 10,
  },
  shareBtn: {
    borderWidth: 1,
    paddingVertical: Platform.OS === "web" ? 10 : 8,
    borderRadius: 10,
    paddingHorizontal: Platform.OS === "web" ? 14 : 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
    marginRight: 10,
  },

  trailerText: {
    fontWeight: "600",
    fontSize: Platform.OS === "web" ? 16 : 10,
  },
});

export default MovieDetailScreen;
