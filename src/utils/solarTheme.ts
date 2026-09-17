/**
 * Solar and Auto-Theme Calculation Engine
 * Calculates local sunrise and sunset based on GPS coordinates or timezone approximation,
 * and monitors system color scheme preference (prefers-color-scheme).
 */

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  isNight: boolean;
  source: 'gps' | 'local_estimate';
}

/**
 * Checks whether the operating system or browser prefers dark mode.
 */
export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return true; // Default to dark mode for sports UI
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Standard astronomical calculation of sunrise and sunset for a given lat/lng and date.
 * Uses official solar zenith (90.8333 degrees).
 */
export function calculateSunTimes(latitude: number, longitude: number, date = new Date()): { sunrise: Date; sunset: Date } {
  const zenith = 90.8333; // Official zenith for sunrise/sunset in degrees
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);

  // Approximate time
  const lngHour = longitude / 15;

  const calcTime = (isSunrise: boolean): Date => {
    const t = dayOfYear + ((isSunrise ? 6 : 18) - lngHour) / 24;

    // Sun's mean anomaly
    const M = (0.9856 * t) - 3.289;

    // Sun's true longitude
    let L = M + (1.916 * Math.sin(M * rad)) + (0.020 * Math.sin(2 * M * rad)) + 282.634;
    L = (L + 360) % 360;

    // Sun's right ascension
    let RA = deg * Math.atan(0.91764 * Math.tan(L * rad));
    RA = (RA + 360) % 360;

    // RA value needs to be in the same quadrant as L
    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = (RA + (Lquadrant - RAquadrant)) / 15;

    // Sun's declination
    const sinDec = 0.39782 * Math.sin(L * rad);
    const cosDec = Math.cos(Math.asin(sinDec));

    // Sun's local hour angle
    const cosH = (Math.cos(zenith * rad) - (sinDec * Math.sin(latitude * rad))) / (cosDec * Math.cos(latitude * rad));

    if (cosH > 1) {
      // Polar night - never rises
      const polarNight = new Date(date);
      polarNight.setHours(isSunrise ? 0 : 23, 59, 0, 0);
      return polarNight;
    }
    if (cosH < -1) {
      // Midnight sun - never sets
      const midnightSun = new Date(date);
      midnightSun.setHours(isSunrise ? 0 : 23, 59, 0, 0);
      return midnightSun;
    }

    const H = (isSunrise ? 360 - deg * Math.acos(cosH) : deg * Math.acos(cosH)) / 15;

    // Local mean time of rising/setting
    const T = H + RA - (0.06571 * t) - 6.622;

    // Universal Coordinated Time (UTC)
    let UT = (T - lngHour + 24) % 24;

    const result = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      Math.floor(UT),
      Math.floor((UT % 1) * 60)
    ));

    return result;
  };

  return {
    sunrise: calcTime(true),
    sunset: calcTime(false),
  };
}

/**
 * Gets sunrise and sunset times based on cached GPS coordinates,
 * or falls back to standard local civil dawn/dusk estimates (6:00 AM / 6:30 PM).
 */
export function getSolarTimes(cachedLat?: number | null, cachedLng?: number | null): SunTimes {
  const now = new Date();

  if (typeof cachedLat === 'number' && typeof cachedLng === 'number' && !isNaN(cachedLat) && !isNaN(cachedLng)) {
    try {
      const { sunrise, sunset } = calculateSunTimes(cachedLat, cachedLng, now);
      const isNight = now < sunrise || now > sunset;
      return { sunrise, sunset, isNight, source: 'gps' };
    } catch {
      // Fall through to local estimate on math error
    }
  }

  // Fallback to local astronomical estimate (sunrise 06:00, sunset 18:30 in local time)
  const sunrise = new Date(now);
  sunrise.setHours(6, 0, 0, 0);

  const sunset = new Date(now);
  sunset.setHours(18, 30, 0, 0);

  const isNight = now < sunrise || now > sunset;
  return { sunrise, sunset, isNight, source: 'local_estimate' };
}

/**
 * Requests location safely and stores coordinates in localStorage for solar calculation
 */
export async function requestUserLocationCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        try {
          localStorage.setItem('bd_sports_user_coords', JSON.stringify(coords));
        } catch {}
        resolve(coords);
      },
      () => {
        // User denied or unavailable
        resolve(null);
      },
      { timeout: 8000, maximumAge: 3600000 }
    );
  });
}

/**
 * Reads cached user coordinates if available
 */
export function getCachedUserCoordinates(): { latitude: number; longitude: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('bd_sports_user_coords');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return null;
}
