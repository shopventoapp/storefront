import { type BookingLabels, mergeAccountLabels } from "@shopvento/ui";

// Starter-specific terminology and editorial choices. The package supplies translations.
export const englishBookingLabels: Partial<BookingLabels> = {
  eventsLoading: "Loading experiences…",
  eventUnavailable: "This experience is unavailable.",
  guestDisabled:
    "Guest booking is currently unavailable. Please contact us to book this experience.",
  eventVoucherRequired:
    "Please enter a valid experience voucher for every place.",
  eventVoucherMissing: (count) =>
    `${count} ${count === 1 ? "place still needs" : "places still need"} an experience voucher.`,
  eventVoucherDescription:
    "Experience voucher for one person, covering one place",
  eventVoucherNotice:
    "Each place needs an experience voucher. Sign in with your account to book. Older codes are checked when you book.",
  eventDetails: "More about this experience",
};

export const englishAccountLabels = mergeAccountLabels(
  {
    event: "Experience",
    events: "Experiences",
    eventVoucher: "Experience vouchers",
    eventVoucherSingular: "Experience voucher",
    newsletter: "News from the atelier",
    ageHint: "Please check the minimum age for this offer.",
  },
  { locale: "en" },
);

export const englishShopCopy = {
  newsletterOptInLabel: "Subscribe to the newsletter",
  giftDeliveryNote: "Your voucher arrives by email.",
};

export const englishAccountNotice = "Please sign in to access your account.";
