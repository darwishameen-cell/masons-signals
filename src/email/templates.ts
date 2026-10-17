import type { Env, Trade } from '../types';
import { displayPair } from '../trade/pairs';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const DISCLAIMER =
  'Forex trading carries substantial risk. Signals are informational and are not ' +
  'individualized financial advice. You are responsible for your own trading decisions ' +
  'and losses. No result or profit is guaranteed.';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(bodyHtml: string, bodyText: string, env: Env, unsubUrl: string): { html: string; text: string } {
  const origin = env.SITE_ORIGIN.replace(/^https?:\/\//, '');
  const html = `<!doctype html><html><body style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#222">
${bodyHtml}
<hr style="border:none;border-top:1px solid #ddd;margin:24px 0">
<p style="font-size:12px;color:#666">${escapeHtml(DISCLAIMER)}</p>
<p style="font-size:12px;color:#666">You're receiving this because you requested access at ${escapeHtml(origin)}.<br>
<a href="${escapeHtml(unsubUrl)}">Unsubscribe</a></p>
</body></html>`;

  const text = `${bodyText}

---
${DISCLAIMER}

You're receiving this because you requested access at ${origin}.
Unsubscribe: ${unsubUrl}`;

  return { html, text };
}

export function renderUnderReview(env: Env, unsubUrl: string): RenderedEmail {
  const bodyText = `We've received your request for access to Mason's Signals.

Applications are reviewed before access is granted. You'll hear back from us within roughly 30 hours — no action is needed from you in the meantime.

Mason's Signals`;
  const bodyHtml = `<p>We've received your request for access to Mason's Signals.</p>
<p>Applications are reviewed before access is granted. You'll hear back from us within roughly 30 hours &mdash; no action is needed from you in the meantime.</p>
<p>Mason's Signals</p>`;
  return { subject: "Your Mason's Signals application", ...wrap(bodyHtml, bodyText, env, unsubUrl) };
}

export function renderApproved(env: Env, unsubUrl: string): RenderedEmail {
  const bodyText = `Your application has been approved.

You'll now receive our forex-market signals as they're published. Nothing else is required from you.

Mason's Signals`;
  const bodyHtml = `<p>Your application has been approved.</p>
<p>You'll now receive our forex-market signals as they're published. Nothing else is required from you.</p>
<p>Mason's Signals</p>`;
  return { subject: "Your Mason's Signals access is approved", ...wrap(bodyHtml, bodyText, env, unsubUrl) };
}

export function renderTrade(env: Env, trade: Trade, unsubUrl: string): RenderedEmail {
  const heading = `${displayPair(trade.pair)} — ${trade.direction}`;
  const noteText = trade.note ? `\n\n${trade.note}` : '';
  const noteHtml = trade.note ? `<p>${escapeHtml(trade.note)}</p>` : '';

  const bodyText = `${heading}

Entry: ${trade.entry}
Take profit: ${trade.take_profit}
Stop loss: ${trade.stop_loss}${noteText}

Mason's Signals`;

  const bodyHtml = `<p><strong>${escapeHtml(heading)}</strong></p>
<p>Entry: ${escapeHtml(trade.entry)}<br>
Take profit: ${escapeHtml(trade.take_profit)}<br>
Stop loss: ${escapeHtml(trade.stop_loss)}</p>
${noteHtml}
<p>Mason's Signals</p>`;

  return { subject: `${trade.pair} — ${trade.direction}`, ...wrap(bodyHtml, bodyText, env, unsubUrl) };
}
