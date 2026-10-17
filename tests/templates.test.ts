import { describe, expect, it } from 'vitest';
import { renderApproved, renderTrade, renderUnderReview } from '../src/email/templates';
import type { Env, Trade } from '../src/types';

const env = { SITE_ORIGIN: 'https://masonssignals.com' } as Env;
const UNSUB = 'https://masonssignals.com/unsubscribe?t=abc';

const trade: Trade = {
  pair: 'EURUSD',
  direction: 'Buy',
  entry: '1.0850',
  take_profit: '1.0920',
  stop_loss: '1.0820',
  note: null,
};

function expectRiskStatement(content: string) {
  expect(content).toContain('Forex trading carries substantial risk');
  expect(content).toContain('not individualized financial advice');
  expect(content).toContain('No result or profit is guaranteed');
}

describe('templates', () => {
  it('under review email carries subject, disclaimer and unsubscribe link', () => {
    const m = renderUnderReview(env, UNSUB);
    expect(m.subject).toBe("Your Mason's Signals application");
    expect(m.text).toContain("Mason's Signals");
    expectRiskStatement(m.text);
    expect(m.html).toContain(UNSUB);
  });

  it('approved email promises forex signals without the old market scope', () => {
    const m = renderApproved(env, UNSUB);
    expect(m.subject).toBe("Your Mason's Signals access is approved");
    expect(m.text).toContain('forex-market signals');
    expect(m.text).toContain("Mason's Signals");
    expect(m.text).not.toContain('commodities');
    expect(m.text).not.toContain('indexes');
    expect(m.text).not.toContain("Mason's Trade");
    expectRiskStatement(m.text);
    expect(m.html).toContain(UNSUB);
  });

  it('trade email keeps trailing zeros in prices', () => {
    const m = renderTrade(env, trade, UNSUB);
    expect(m.subject).toBe('EURUSD — Buy');
    expect(m.text).toContain('1.0850');
    expect(m.text).not.toContain('1.085\n');
    expect(m.text).toContain('Take profit: 1.0920');
    expect(m.text).toContain("Mason's Signals");
    expectRiskStatement(m.text);
    expect(m.html).toContain(UNSUB);
  });

  it('trade email omits the note line entirely when there is no note', () => {
    const m = renderTrade(env, trade, UNSUB);
    expect(m.text).not.toContain('undefined');
    expect(m.text).not.toContain('null');
    expectRiskStatement(m.text);
    expect(m.html).toContain(UNSUB);
  });

  it('trade email includes the note when present', () => {
    const m = renderTrade(env, { ...trade, note: 'London session only' }, UNSUB);
    expect(m.text).toContain('London session only');
    expectRiskStatement(m.text);
    expect(m.html).toContain(UNSUB);
  });
});
