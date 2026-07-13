import { useTheme } from "@/Context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import React from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = Platform.OS === "web" ? 250 : 150;

const MovieCard = ({ movie, type }: any) => {
  const router = useRouter();
  const { theme, dark } = useTheme();

  const handlePress = () => {
    router.push({
      pathname: "/Components/MovieDetail",
      params: {
        id: movie.id,
        type: type,
      },
    });
  };

  const displayDate = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : movie.year || "N/A";
  const displayYear =
    movie.year ||
    (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "N/A");

  return (
    <TouchableOpacity
      style={styles.movieCard}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <View style={[styles.posterContainer, { borderColor: theme.primary }]}>
        {movie.posterUrl ? (
          <Image source={{ uri: movie.posterUrl }} style={styles.posterImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Poster</Text>
          </View>
        )}

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.9)"]}
          style={styles.overlay}
        />

        {type !== "upcoming" && (
          <View style={styles.rating}>
            <Text style={styles.ratingText}>★ {movie.imdbScore || "N/A"}</Text>
          </View>
        )}
        {type == "upcoming" && (
          <View style={styles.releaseDate}>
            <Text style={styles.releaseText}>Releasing on {displayDate}</Text>
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {movie.title}
          </Text>
          {type !== "upcoming" && (
            <Text style={styles.meta}>
              {displayDate} • {movie.genre}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  movieCard: {
    width: CARD_WIDTH,
    marginVertical: 10,
    marginHorizontal: 2,
  },
  posterContainer: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#180a2e",
  },
  posterImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#4ade80",
    fontSize: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  rating: {
    position: "absolute",
    top: 9,
    right: 9,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "rgba(34, 197, 94, 0.5)",
  },
  ratingText: {
    color: "#21ff72",
    fontSize: 12,
    fontWeight: "700",
  },
  textContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  meta: {
    color: "#ff4d4d",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
    opacity: 0.9,
  },
  releaseDate: {
    position: "absolute",
    top: 0,
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.94)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
    borderTopEndRadius: 6,
    borderWidth: 0.5,
  },
  releaseText: {
    color: "#ff2121",
    fontSize: Platform.OS === "web" ? 12 : 9,
    fontWeight: "700",
  },
});

export default MovieCard;
