# 🎬 CineVault: Movie Ticket Booking App

CineVault is a movie ticket booking application where users can browse movies, find theaters on a **real-time map**, pick a showtime, choose seats from an interactive seat map, apply discount codes, and receive a digital ticket with a QR code. It supports light and dark themes and runs on mobile and web from a single codebase.

## Features

- **Movie discovery:** featured banner, "Now Showing" list, genre filters (Action, Drama, Sci-Fi, Comedy, Thriller, Horror, Animation) and movie search.
- **Movie details:** poster, genre, runtime, certificate, format tags (2D, Dolby), IMDb score, box office, cast, trailer and share options.
- **Real-time theater map:** visualize theaters on an interactive map, see where each theater is located, and switch between map and list views.
- **Theater and showtime selection:** choose a date, browse theaters with address, amenities (Dolby, 4K), seat capacity and starting price, and filter by city.
- **Interactive seat map:** row and seat layout with Premium and Standard tiers, live pricing, and sold/locked and selected seat states.
- **Booking summary:** selected seats grouped by tier with the total amount payable.
- **Multi-step booking flow:** Movie → Seats → Payment → Confirm progress tracker.
- **Discount codes:** promo code support (for example `SAVE10`) applied at checkout.
- **Digital ticket:** confirmation with movie, date, time, theater, seat, screen, amount paid, booking ID and a scannable QR code.
- **Theming:** light and dark mode toggle.
## Demo

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo), TypeScript |
| Navigation | Expo Router |
| Maps | Leaflet |OpenStreetMap |
| API calls | Axios, REST APIs |


## Booking Flow

1. Browse or search for a movie on the home screen.
2. Open the movie details page and tap **Book tickets**.
3. Select a date, then choose a theater from the list or the real-time map.
4. Pick a showtime and select seats on the seat map (Premium or Standard).
5. Review the summary, apply a discount code and complete payment.
6. Receive the confirmed ticket with a QR code and booking ID.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Expo CLI (`npx expo` works without a global install)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/cinevault.git
cd cinevault

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_API_URL=http://<your-api-host>:<port>
EXPO_PUBLIC_MAPS_API_KEY=<your-map-api-key>
```

### Run the app

```bash
# Start the development server
npx expo start

# Run on web
npx expo start --web
```

The web version runs at `http://localhost:8081` by default. Use the Expo Go app or an emulator to run it on a phone.

## App Routes

| Route | Screen |
|-------|--------|
| `/` | Home: featured movie, genres, now showing |
| `/Components/MovieDetail?id=<movieId>` | Movie details |
| `/Components/TheaterSelection?movieId=<movieId>` | Date, theater (list or map) and showtime selection |
| `/Components/MovieBooking?showId=<showId>&movieId=<movieId>` | Seat selection and booking summary |
| `/Components/Ticket?bookingId=<bookingId>` | Confirmed ticket with QR code |

## Pricing Example

| Seat Type | Rows | Price |
|-----------|------|-------|
| Premium | A, B | ₹280 per seat |
| Standard | C onwards | ₹180 per seat |

Discount codes (for example `SAVE10` for 10% off) are applied to the total before the ticket is confirmed.

## Roadmap

- Payment gateway integration
- Email and SMS ticket delivery
- Booking history and cancellation
- Seat locking with timeout during checkout
- Admin panel to manage movies, theaters and shows

## Author

**Alapati Shanmukhi**
[GitHub](https://github.com/shanmukhialapati) · [LinkedIn](https://www.linkedin.com/in/alapati-shanmukhi/)

## License

This project is licensed under the [MIT License](LICENSE).
