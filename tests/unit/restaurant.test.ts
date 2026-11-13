import { expect, test } from "bun:test";
import {
  berlinDate,
  dayWindows,
  hasMenu,
  intervalLabel,
  type RestaurantLocation,
} from "../../src/lib/restaurant";

const location: RestaurantLocation = {
  id: 1,
  location_name: "Kitchen",
  table_reservations_enabled: false,
  opening_intervals: [
    { weekday: 4, opens: "12:00", closes: "14:30" },
    { weekday: 4, opens: "17:30", closes: "02:00" },
  ],
  opening_exceptions: [],
};
test("Berlin calendar dates do not depend on the visitor time zone", () => {
  expect(berlinDate(new Date("2026-11-12T23:30:00Z"))).toBe("2026-11-13");
});
test("split service and overnight carry remain distinct", () => {
  expect(dayWindows(location, "2026-11-13")).toEqual([
    ["12:00", "14:30"],
    ["17:30", "24:00"],
  ]);
  expect(dayWindows(location, "2026-11-14")).toEqual([["00:00", "02:00"]]);
  expect(intervalLabel("17:30", "02:00")).toBe("17:30 - 02:00 Uhr (Folgetag)");
});
test("unknown hours never claim closed or open", () => {
  expect(
    dayWindows({ ...location, opening_intervals: null }, "2026-11-13"),
  ).toBeNull();
  expect(
    dayWindows({ ...location, opening_intervals: [] }, "2026-11-13"),
  ).toEqual([]);
});
test("date exceptions replace regular hours and timed closures subtract windows", () => {
  const exceptions = [
    {
      from: "2026-11-13",
      until: "2026-11-13",
      opens: "10:00",
      closes: "16:00",
    },
    {
      from: "2026-11-13",
      until: "2026-11-13",
      closed_from: "2026-11-13T11:00:00+01:00",
      closed_until: "2026-11-13T13:00:00+01:00",
    },
  ];
  expect(
    dayWindows({ ...location, opening_exceptions: exceptions }, "2026-11-13"),
  ).toEqual([
    ["10:00", "11:00"],
    ["13:00", "16:00"],
  ]);
  expect(
    dayWindows(
      {
        ...location,
        opening_exceptions: [{ from: "2026-11-13", until: "2026-11-13" }],
      },
      "2026-11-13",
    ),
  ).toEqual([]);
});
test("menu discovery includes nested categories and excludes empty categories", () => {
  expect(
    hasMenu([
      {
        id: "wine",
        title: "Wine",
        items: [],
        subsections: [
          {
            id: "red",
            title: "Red",
            items: [{ token: "1", name: "Wine", prices: [{ preis: 9.9 }] }],
          },
        ],
      },
    ]),
  ).toBe(true);
  expect(hasMenu([{ id: "empty", title: "Empty", items: [] }])).toBe(false);
});

test("location actions select only published reservable locations", async () => {
  const { reservationLocation } = await import("../../src/lib/restaurant");
  const locations = [
    { id: 1, table_reservations_enabled: true },
    { id: 2, table_reservations_enabled: true },
    { id: 3, table_reservations_enabled: false },
  ];
  expect(reservationLocation(locations, "2")?.id).toBe(2);
  expect(reservationLocation(locations, "3")?.id).toBe(1);
  expect(reservationLocation(locations, "999")?.id).toBe(1);
});

test("timed exception labels convert absolute timestamps to Berlin time", async () => {
  const { berlinTimestamp } = await import("../../src/lib/restaurant");
  expect(berlinTimestamp("2026-11-13T17:00:00Z")).toBe("2026-11-13T18:00");
  expect(berlinTimestamp("2026-07-13T22:00:00Z")).toBe("2026-07-14T00:00");
  expect(berlinTimestamp("2026-11-13T18:00")).toBe("2026-11-13T18:00");
});
