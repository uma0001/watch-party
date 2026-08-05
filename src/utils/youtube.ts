/**
 * Utility to extract YouTube video ID from various YouTube URL formats or raw video IDs.
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;

  const trimmed = urlOrId.trim();

  // If it's already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regular expression for youtube.com, music.youtube.com, shorts, youtu.be, embed, v
  const regex = /(?:(?:https?:\/\/)?(?:www\.|music\.)?youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|(?:https?:\/\/)?youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Format seconds into mm:ss or hh:mm:ss string.
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';

  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}
