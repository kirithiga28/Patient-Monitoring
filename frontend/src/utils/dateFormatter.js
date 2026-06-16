/**
 * Safely formats Firestore Timestamp objects, ISO strings, or epoch numbers
 * into a human-readable local date and time string.
 * @param {any} timestamp
 * @returns {string}
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return "N/A";
  
  // Handle Firestore Timestamp object (has seconds and nanoseconds)
  if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
    return new Date(timestamp.seconds * 1000).toLocaleString();
  }
  
  // Handle Firestore Timestamp object in JSON format (has _seconds)
  if (timestamp && typeof timestamp === "object" && "_seconds" in timestamp) {
    return new Date(timestamp._seconds * 1000).toLocaleString();
  }

  // Handle ISO string or milliseconds
  try {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString();
    }
  } catch (e) {
    // Fallback
  }
  
  return String(timestamp);
}
