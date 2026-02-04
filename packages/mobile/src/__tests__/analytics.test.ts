jest.unmock('../services/analytics');
import { trackEvent, flushEvents } from '../services/analytics';
import { api } from '../api/client';

const mockSendEvents = api.sendEvents as jest.Mock;

beforeEach(() => {
  mockSendEvents.mockClear();
  // Drain any leftover events from previous tests
  flushEvents();
  mockSendEvents.mockClear();
});

describe('Analytics', () => {
  it('trackEvent queues events without flushing', () => {
    trackEvent('share_clicked');
    trackEvent('generation_completed', { styleId: 'caricature-classic' });

    // Not flushed yet (threshold is 10)
    expect(mockSendEvents).not.toHaveBeenCalled();

    // Drain for next test
    flushEvents();
  });

  it('auto-flushes at 10 events', () => {
    for (let i = 0; i < 10; i++) {
      trackEvent('share_clicked');
    }

    expect(mockSendEvents).toHaveBeenCalledTimes(1);
    const sentEvents = mockSendEvents.mock.calls[0][0];
    expect(sentEvents).toHaveLength(10);
  });

  it('flushEvents sends queued events via API', () => {
    trackEvent('paywall_shown');
    trackEvent('paywall_dismissed');

    flushEvents();

    expect(mockSendEvents).toHaveBeenCalledTimes(1);
    const sentEvents = mockSendEvents.mock.calls[0][0];
    expect(sentEvents).toHaveLength(2);
    expect(sentEvents[0].event).toBe('paywall_shown');
    expect(sentEvents[1].event).toBe('paywall_dismissed');
  });

  it('empty queue does not flush', () => {
    flushEvents();
    expect(mockSendEvents).not.toHaveBeenCalled();
  });

  it('event payload has correct shape', () => {
    trackEvent('generation_completed', { styleId: 'pop-art' });
    flushEvents();

    const sentEvents = mockSendEvents.mock.calls[0][0];
    expect(sentEvents[0]).toHaveProperty('event', 'generation_completed');
    expect(sentEvents[0]).toHaveProperty('properties');
    expect(sentEvents[0].properties.styleId).toBe('pop-art');
    expect(sentEvents[0]).toHaveProperty('timestamp');
    expect(typeof sentEvents[0].timestamp).toBe('string');
  });
});
