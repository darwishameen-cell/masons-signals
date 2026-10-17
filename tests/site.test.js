import { describe, expect, it, vi } from 'vitest';
import { submitSignup } from '../site/signup.js';

describe('submitSignup', () => {
  it('posts the normalized form payload to the same-origin subscribe route', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const result = await submitSignup({
      email: 'trader@example.com',
      honeypot: '',
      request,
    });

    expect(result).toEqual({ ok: true, message: 'Your request has been received.' });
    expect(request).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledWith('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'trader@example.com', subscribe_hp: '' }),
    });
  });

  it('returns the server message for a rejected or rate-limited request', async () => {
    const request = vi.fn(async () =>
      new Response(JSON.stringify({ ok: false, error: 'Too many requests. Try again later.' }), {
        status: 429,
      }),
    );

    await expect(submitSignup({ email: 'trader@example.com', request })).resolves.toEqual({
      ok: false,
      error: 'Too many requests. Try again later.',
    });
  });

  it('returns a useful fallback when the server error is not JSON', async () => {
    const request = vi.fn(async () => new Response('upstream error', { status: 502 }));

    await expect(submitSignup({ email: 'trader@example.com', request })).resolves.toEqual({
      ok: false,
      error: 'Something went wrong. Please try again.',
    });
  });

  it('returns a recoverable message when the network cannot be reached', async () => {
    const request = vi.fn(async () => {
      throw new TypeError('network down');
    });

    await expect(submitSignup({ email: 'trader@example.com', request })).resolves.toEqual({
      ok: false,
      error: 'Could not reach the server. Please try again.',
    });
  });
});
