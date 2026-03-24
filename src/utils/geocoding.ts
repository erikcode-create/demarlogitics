const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

interface GeoResult {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const trimmed = address.trim().slice(0, 200);
  if (!trimmed) return null;

  try {
    const res = await fetch(
      `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(trimmed)}&limit=1&countrycodes=us`,
      { headers: { 'User-Agent': 'DeMar-Logistics/1.0 (3PL@DeMarTransportation.com)' } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    if (isNaN(lat) || isNaN(lon)) return null;

    return { lat, lng: lon };
  } catch (err) {
    console.error('Geocoding failed for:', trimmed, err);
    return null;
  }
}

export async function geocodeBoth(
  origin: string,
  destination: string
): Promise<{ pickup: GeoResult | null; delivery: GeoResult | null }> {
  // Nominatim rate limit: 1 req/sec — run sequentially with delay
  const pickup = await geocodeAddress(origin);
  await new Promise(r => setTimeout(r, 1100));
  const delivery = await geocodeAddress(destination);
  return { pickup, delivery };
}
