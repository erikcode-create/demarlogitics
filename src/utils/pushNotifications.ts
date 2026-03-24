import { supabase } from '@/integrations/supabase/client';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushResult {
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Fetch all Expo push tokens for a driver phone number.
 */
export async function getDriverTokens(driverPhone: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('driver_push_tokens')
    .select('expo_push_token')
    .eq('driver_phone', driverPhone);

  if (error || !data) return [];
  return data.map((row: { expo_push_token: string }) => row.expo_push_token);
}

/**
 * Send a push notification to a driver by phone number.
 */
export async function sendPushToDriver(
  driverPhone: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<PushResult> {
  const tokens = await getDriverTokens(driverPhone);
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, errors: ['No push tokens found for this driver. The driver needs to open the app first.'] };
  }

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title,
    body,
    data: data || {},
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      return { sent: 0, failed: tokens.length, errors: [`Expo API error: ${res.status}`] };
    }

    const result = await res.json();
    const tickets = result.data || [];
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const ticket of tickets) {
      if (ticket.status === 'ok') {
        sent++;
      } else {
        failed++;
        if (ticket.details?.error) errors.push(ticket.details.error);
      }
    }

    return { sent, failed, errors };
  } catch (err) {
    return { sent: 0, failed: tokens.length, errors: [(err as Error).message] };
  }
}

/**
 * Send a push notification to multiple drivers.
 */
export async function sendPushToMultipleDrivers(
  driverPhones: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<PushResult> {
  const allTokens: string[] = [];
  for (const phone of driverPhones) {
    const tokens = await getDriverTokens(phone);
    allTokens.push(...tokens);
  }

  if (allTokens.length === 0) {
    return { sent: 0, failed: 0, errors: ['No push tokens found for any selected drivers.'] };
  }

  const messages = allTokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title,
    body,
    data: data || {},
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      return { sent: 0, failed: allTokens.length, errors: [`Expo API error: ${res.status}`] };
    }

    const result = await res.json();
    const tickets = result.data || [];
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const ticket of tickets) {
      if (ticket.status === 'ok') {
        sent++;
      } else {
        failed++;
        if (ticket.details?.error) errors.push(ticket.details.error);
      }
    }

    return { sent, failed, errors };
  } catch (err) {
    return { sent: 0, failed: allTokens.length, errors: [(err as Error).message] };
  }
}
