"use client";

import { useEffect } from "react";
import { installSiteEventTelemetry } from "@/lib/client/siteEvents";

export default function SiteTelemetry() {
  useEffect(() => installSiteEventTelemetry(), []);
  return null;
}
