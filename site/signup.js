export async function submitSignup({ email, honeypot = '', request = globalThis.fetch }) {
  try {
    const response = await request('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, subscribe_hp: honeypot }),
    });

    if (response.ok) {
      return { ok: true, message: 'Your request has been received.' };
    }

    const body = await response.json().catch(() => ({}));
    return {
      ok: false,
      error: body.error || 'Something went wrong. Please try again.',
    };
  } catch {
    return {
      ok: false,
      error: 'Could not reach the server. Please try again.',
    };
  }
}
