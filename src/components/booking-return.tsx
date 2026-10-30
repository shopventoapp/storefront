"use client";
import { BookingResult } from "@shopvento/ui";
import { useEffect, useState } from "react";
export function BookingReturn() {
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(window.location.href), []);
  const outcome =
    url && new URL(url).searchParams.get("outcome") === "cancel"
      ? "cancel"
      : "success";
  return <BookingResult url={url} outcome={outcome} retryUrl="/events" />;
}
