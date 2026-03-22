import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const WEATHER_TEXT = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ hail",
  99: "Thunderstorm w/ hail",
};

function toFlagEmoji(countryCode) {
  if (!countryCode) return "";
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function codeToIcon(code, big = false) {
  const size = big ? 72 : 28;
  const commonProps = { width: size, height: size, viewBox: "0 0 24 24" };
  if (code == null) return null;
  if ([0, 1].includes(code))
    return (
      <svg {...commonProps} fill="currentColor" className="text-yellow-300">
        <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zM4.84 19.2l1.79-1.8-1.79-1.79-1.8 1.79 1.8 1.8zM13 1h-2v3h2V1zm7.03 3.05l-1.8 1.79 1.8 1.8 1.79-1.8-1.79-1.79zM20 11v2h3v-2h-3zm-8-5a5 5 0 100 10 5 5 0 000-10z" />
      </svg>
    );
  if ([2, 3].includes(code))
    return (
      <svg {...commonProps} fill="currentColor" className="text-gray-300">
        <path d="M19 18H6a4 4 0 110-8 5.5 5.5 0 0110.74-1.5A4.5 4.5 0 1119 18z" />
      </svg>
    );
  if ([61, 63, 65, 80, 81, 82, 51, 53, 55].includes(code))
    return (
      <svg {...commonProps} fill="currentColor" className="text-blue-300">
        <path d="M6 14a4 4 0 010-8 5.5 5.5 0 0110.74-1.5A4.5 4.5 0 1116 18H7c-.55 0-1-.45-1-1v-3z" />
        <g>
          <circle cx="8" cy="20" r="1.2" />
          <circle cx="12" cy="21.5" r="1.2" />
          <circle cx="16" cy="20" r="1.2" />
        </g>
      </svg>
    );
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return (
      <svg {...commonProps} fill="currentColor" className="text-sky-200">
        <path d="M6 14a4 4 0 010-8 5.5 5.5 0 0110.74-1.5A4.5 4.5 0 1116 18H7c-.55 0-1-.45-1-1v-3z" />
        <g>
          <rect x="7.4" y="19" width="1.4" height="1.4" rx="0.1" />
          <rect x="11.4" y="20.5" width="1.4" height="1.4" rx="0.1" />
          <rect x="15.4" y="19" width="1.4" height="1.4" rx="0.1" />
        </g>
      </svg>
    );
  if ([95, 96, 99].includes(code))
    return (
      <svg {...commonProps} fill="currentColor" className="text-indigo-300">
        <path d="M6 14a4 4 0 010-8 5.5 5.5 0 0110.74-1.5A4.5 4.5 0 1116 18H7c-.55 0-1-.45-1-1v-3z" />
        <path d="M11 18l-2.2 4H11l-1 3 4-5h-2l1-2z" />
      </svg>
    );
  return (
    <svg {...commonProps} fill="currentColor" className="text-gray-300">
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}

function shortDay(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

const BG_BY_MOOD = {
  sky: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=2000&auto=format&fit=crop",
  clouds: "https://images.unsplash.com/photo-1520880867055-1e30d1cb001c?q=80&w=2000&auto=format&fit=crop",
  rain: "https://images.unsplash.com/photo-1503435824048-a799a3a84bf7?q=80&w=2000&auto=format&fit=crop",
  snow: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=2000&auto=format&fit=crop",
  fog: "https://images.unsplash.com/photo-1501139083538-0139583c060f?q=80&w=2000&auto=format&fit=crop",
  storm: "https://images.unsplash.com/photo-1605721571516-95bbf0a43e2b?q=80&w=2000&auto=format&fit=crop",
};

export default function App() {
  const [query, setQuery] = useState("Bengaluru");
  const [units, setUnits] = useState("metric"); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [place, setPlace] = useState(null); 
  const [current, setCurrent] = useState(null);
  const [daily, setDaily] = useState(null);

  const mood = useMemo(() => {
    const code = current?.current?.weather_code;
    if (!code) return "sky";
    if ([61, 63, 65, 80, 81, 82].includes(code)) return "rain";
    if ([71, 73, 75, 85, 86].includes(code)) return "snow";
    if ([45, 48].includes(code)) return "fog";
    if ([2, 3].includes(code)) return "clouds";
    if ([95, 96, 99].includes(code)) return "storm";
    return "sky";
  }, [current]);

  const bgUrl = BG_BY_MOOD[mood];

  async function searchCity(name) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          name
        )}&count=1&language=en&format=json`
      );
      const data = await res.json();
      const first = data?.results?.[0];
      if (!first) throw new Error("No results found");
      setPlace({
        name: `${first.name}${first.admin1 ? ", " + first.admin1 : ""}`,
        country_code: first.country_code,
        latitude: first.latitude,
        longitude: first.longitude,
      });
    } catch (e) {
      setError(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function fetchWeather(lat, lon) {
    setLoading(true);
    setError(null);
    try {
      const isMetric = units === "metric";
      const tempUnit = isMetric ? "celsius" : "fahrenheit";
      const windUnit = isMetric ? "kmh" : "mph";
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code` +
        `&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      setCurrent(data);
      setDaily(data?.daily);
    } catch (e) {
      setError(e.message || "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const { latitude, longitude } = pos.coords;
        setPlace({ name: "My location", latitude, longitude });
      },
      (err) => {
        setLoading(false);
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  useEffect(() => {
    searchCity(query);
  
  }, []);

  useEffect(() => {
    if (place) fetchWeather(place.latitude, place.longitude);
  
  }, [place, units]);

  const forecastData = useMemo(() => {
    if (!daily?.time) return [];
    return daily.time.map((t, i) => ({
      date: shortDay(t),
      max: daily.temperature_2m_max?.[i],
      min: daily.temperature_2m_min?.[i],
      code: daily.weather_code?.[i],
      pop: daily.precipitation_probability_max?.[i],
    }));
  }, [daily]);

  const unitSymbol = units === "metric" ? "°C" : "°F";

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      {}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(2px)",
            opacity: 0.6,
          }}
        />
        <motion.div
          className="absolute -top-32 -left-32 w-[50rem] h-[50rem] rounded-full bg-blue-500/40 blur-3xl"
          animate={{ x: [0, 50, -40, 0], y: [0, -30, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[50rem] h-[50rem] rounded-full bg-indigo-500/40 blur-3xl"
          animate={{ x: [0, -40, 30, 0], y: [0, 20, -35, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.35),rgba(0,0,0,0.65))]" />
      </motion.div>

      {}
      <header className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight drop-shadow-lg">
          Breeze — Weather, elegantly.
        </h1>
        <div className="flex-1" />
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-2xl p-2 shadow-lg">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city..."
            className="bg-transparent px-3 py-2 rounded-xl focus:outline-none placeholder-white/70 w-48 sm:w-64"
          />
          <button
            onClick={() => searchCity(query)}
            className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition shadow"
          >
            Search
          </button>
          <button
            onClick={useMyLocation}
            className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition shadow"
            title="Use my location"
          >
            📍
          </button>
          <div className="h-6 w-px bg-white/20" />
          <button
            onClick={() =>
              setUnits((u) => (u === "metric" ? "imperial" : "metric"))
            }
            className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition shadow"
            title="Toggle units"
          >
            {units === "metric" ? "°C" : "°F"}
          </button>
        </div>
      </header>

      {}
      <main className="max-w-6xl mx-auto px-6 pb-16">
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-400/40 text-red-100 p-4 rounded-2xl">
            {error}
          </div>
        )}

        {}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl ring-1 ring-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-white/70">
                  {place ? (
                    <>
                      {place.name} {toFlagEmoji(place.country_code)}
                    </>
                  ) : (
                    "Choose a place"
                  )}
                </p>
                <h2 className="mt-1 text-5xl font-semibold leading-none drop-shadow">
                  {current ? (
                    <>
                      {Math.round(current?.current?.temperature_2m)}
                      {unitSymbol}
                    </>
                  ) : (
                    "—"
                  )}
                </h2>
                <p className="mt-2 text-white/80 text-lg flex items-center gap-2">
                  {codeToIcon(current?.current?.weather_code)}
                  <span>
                    {WEATHER_TEXT[current?.current?.weather_code] || "—"}
                  </span>
                </p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white/10 rounded-2xl p-3">
                    <p className="text-white/70">Feels like</p>
                    <p className="text-white text-lg font-medium">
                      {current
                        ? Math.round(current?.current?.apparent_temperature)
                        : "—"}
                      {unitSymbol}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3">
                    <p className="text-white/70">Wind</p>
                    <p className="text-white text-lg font-medium">
                      {current ? Math.round(current?.current?.wind_speed_10m) : "—"}
                      {units === "metric" ? " km/h" : " mph"}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3">
                    <p className="text-white/70">Precip prob (max)</p>
                    <p className="text-white text-lg font-medium">
                      {daily?.precipitation_probability_max?.[0] ?? "—"}%
                    </p>
                  </div>
                </div>
              </div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="pt-2 pr-2"
              >
                {codeToIcon(current?.current?.weather_code, true)}
              </motion.div>
            </div>

            {}
            {current?.hourly?.time && (
              <div className="mt-6">
                <h3 className="text-white/80 mb-2">Next hours</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {current.hourly.time.slice(0, 18).map((t, i) => (
                    <div
                      key={t}
                      className="min-w-[72px] bg-white/10 rounded-2xl p-3 text-center"
                    >
                      <div className="text-xs text-white/70">
                        {new Date(t).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-lg font-medium">
                        {Math.round(current.hourly.temperature_2m[i])}
                        {unitSymbol}
                      </div>
                      <div className="text-xs text-white/70">
                        {current.hourly.precipitation_probability?.[i] ?? 0}% rain
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl ring-1 ring-white/10">
            <h3 className="text-xl font-medium mb-3">This week</h3>
            <div className="space-y-2">
              {forecastData.slice(0, 7).map((d) => (
                <div
                  key={d.date}
                  className="flex items-center justify-between bg-white/5 rounded-2xl px-3 py-2"
                >
                  <span className="w-16 text-white/80">{d.date}</span>
                  <span className="flex items-center gap-2">
                    {codeToIcon(d.code)}
                    <span className="text-white/80 hidden sm:inline">
                      {WEATHER_TEXT[d.code]}
                    </span>
                  </span>
                  <span className="text-white/80 w-24 text-right">
                    {Math.round(d.min)}
                    {unitSymbol} — {Math.round(d.max)}
                    {unitSymbol}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {}
        {forecastData.length > 0 && (
          <section className="mt-8 bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl ring-1 ring-white/10">
            <h3 className="text-xl font-medium mb-4">7‑day temperature trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                  <XAxis dataKey="date" stroke="#fff" opacity={0.8} />
                  <YAxis stroke="#fff" opacity={0.8} domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(17,24,39,0.9)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 12,
                      color: "white",
                    }}
                  />
                  <Line type="monotone" dataKey="min" stroke="#93c5fd" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="max" stroke="#60a5fa" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {}
        <footer className="mt-10 text-sm text-white/70">
          Powered by Open‑Meteo • Backgrounds from Unsplash • Built with React + Tailwind + Framer Motion + Recharts
        </footer>
      </main>

      {}
      {loading && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-white/30 border-t-white"
          />
        </div>
      )}
    </div>
  );
}
