/** Public restaurant projection. Menu prices are euros, unlike shop prices in cents. */
export type OpeningInterval = {
  weekday: number;
  opens: string;
  closes: string;
};
export type OpeningException = {
  from: string;
  until: string;
  opens?: string;
  closes?: string;
  label?: string;
  closed_from?: string;
  closed_until?: string;
};
export type RestaurantLocation = {
  id: number;
  location_name: string;
  location_street?: string | null;
  location_postal_code?: string | null;
  location_city?: string | null;
  location_phone?: string | null;
  table_reservations_enabled: boolean;
  opening_intervals: OpeningInterval[] | null;
  opening_exceptions: OpeningException[];
};
export type MenuItem = {
  token: string;
  name: string;
  beschreibung_md?: string | null;
  allergene?: string | null;
  zusatzstoffe?: string | null;
  prices: { label?: string | null; preis: number }[];
};
export type MenuSection = {
  id: string;
  title: string;
  intro_md?: string | null;
  items: MenuItem[];
  subsections?: MenuSection[];
};
export type Restaurant = {
  company: { name: string; city: string; website_url: string };
  modules: { events: boolean; vouchers: boolean };
  locations: RestaurantLocation[];
  menu: { sections: MenuSection[]; total_items: number } | null;
};

export async function loadRestaurant(signal: AbortSignal): Promise<Restaurant> {
  const response = await fetch("/api/shop/restaurant", {
    signal,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok) throw new Error("Restaurant content unavailable");
  return response.json();
}

export function hasMenu(sections: MenuSection[]): boolean {
  return sections.some(
    (section) => section.items.length > 0 || hasMenu(section.subsections ?? []),
  );
}

export const weekdays = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];
export function berlinDate(now: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
const minutes = (value: string) =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
const time = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
export const intervalLabel = (opens: string, closes: string) =>
  `${opens} - ${closes} Uhr${closes <= opens ? " (Folgetag)" : ""}`;

function ownWindows(
  location: RestaurantLocation,
  date: string,
): [number, number][] | null {
  const exception = location.opening_exceptions.find(
    (row) =>
      !row.closed_from &&
      !row.closed_until &&
      row.from <= date &&
      date <= row.until,
  );
  if (!exception && location.opening_intervals === null) return null;
  const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
  const intervals = exception
    ? exception.opens && exception.closes
      ? [exception]
      : []
    : (location.opening_intervals ?? []).filter(
        (row) => row.weekday === weekday,
      );
  return intervals.map((row) => {
    const start = minutes(row.opens as string);
    const end = minutes(row.closes as string);
    return [start, end <= start ? end + 1440 : end];
  });
}

/** Calendar-day hours in Berlin, subtracting timed closures and keeping split service. */
export function dayWindows(
  location: RestaurantLocation,
  date: string,
): [string, string][] | null {
  const own = ownWindows(location, date);
  if (own === null) return null;
  const previous = new Date(`${date}T12:00:00Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  const carry = (
    ownWindows(location, previous.toISOString().slice(0, 10)) ?? []
  )
    .filter(([, end]) => end > 1440)
    .map(([, end]) => [0, end - 1440] as [number, number]);
  let windows = [
    ...carry,
    ...own.map(
      ([start, end]) => [start, Math.min(end, 1440)] as [number, number],
    ),
  ];

  for (const exception of location.opening_exceptions) {
    if (!exception.closed_from || !exception.closed_until) continue;
    const start = berlinTimestamp(exception.closed_from),
      end = berlinTimestamp(exception.closed_until);
    if (start.slice(0, 10) > date || end.slice(0, 10) < date) continue;
    const low = start.slice(0, 10) < date ? 0 : minutes(start.slice(11));
    const high = end.slice(0, 10) > date ? 1440 : minutes(end.slice(11));
    windows = windows.flatMap(([a, b]) =>
      high <= a || low >= b
        ? [[a, b]]
        : ([
            [a, Math.min(b, low)],
            [Math.max(a, high), b],
          ].filter(([left, right]) => left < right) as [number, number][]),
    );
  }
  return windows
    .sort((a, b) => a[0] - b[0])
    .map(([start, end]) => [time(start), time(end)]);
}

export function address(location: RestaurantLocation) {
  return [
    location.location_street,
    [location.location_postal_code, location.location_city]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(", ");
}

export function reservationLocation<
  T extends { id: number; table_reservations_enabled?: boolean },
>(locations: T[], requested: string | null) {
  return (
    locations.find(
      (location) =>
        location.table_reservations_enabled &&
        String(location.id) === requested,
    ) ??
    locations.find((location) => location.table_reservations_enabled) ??
    locations[0]
  );
}

export function berlinTimestamp(value: string) {
  if (!/(Z|[+-]\d\d:\d\d)$/.test(value)) return value.slice(0, 16);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
  return parts.replace(" ", "T");
}
