/**
 * Qypher SOC: Data Formatting & Humanization Layer
 */

/**
 * Truncates IPv6 addresses for UI readability while preserving unique segments.
 * Example: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 -> 2001:...:7334
 */
export function truncateIP(ip: string): string {
  if (!ip) return "Unknown";
  
  // Handle IPv6
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length <= 3) return ip;
    return `${parts[0]}:...:${parts[parts.length - 1]}`;
  }
  
  // IPv4 usually fits, but we can clamp extremely long strings just in case
  return ip.length > 15 ? ip.slice(0, 12) + "..." : ip;
}

/**
 * Formats timestamps into human-centric relative or simplified absolute strings.
 */
export function formatTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return "Invalid Time";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Relative time for very recent events (last 5 mins)
  if (diffInSeconds < 300) {
    if (diffInSeconds < 5) return "just now";
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  }

  // Simplified absolute time (HH:mm:ss)
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Capitalizes and cleans source/severity labels for metadata display.
 */
export function humanizeLabel(label: string): string {
  if (!label) return "";
  return label.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
