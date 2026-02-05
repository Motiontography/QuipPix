import { useProStore } from '../store/useProStore';

function resetStore() {
  useProStore.setState({
    entitlement: { proActive: false, proType: null, expiresAt: null },
    credits: 3, // Default starting credits
    successfulGenerations: 0,
    softUpsellDismissed: false,
  });
}

describe('useProStore', () => {
  beforeEach(resetStore);

  it('starts with free entitlement', () => {
    const state = useProStore.getState();
    expect(state.entitlement.proActive).toBe(false);
    expect(state.entitlement.proType).toBeNull();
  });

  it('starts with 3 credits', () => {
    const state = useProStore.getState();
    expect(state.credits).toBe(3);
  });

  it('updates entitlement to pro', () => {
    useProStore.getState().setEntitlement({
      proActive: true,
      proType: 'annual',
      expiresAt: '2026-01-01',
    });
    expect(useProStore.getState().entitlement.proActive).toBe(true);
    expect(useProStore.getState().entitlement.proType).toBe('annual');
  });

  it('decrements credits', () => {
    useProStore.getState().decrementCredits();
    expect(useProStore.getState().credits).toBe(2);
    useProStore.getState().decrementCredits();
    expect(useProStore.getState().credits).toBe(1);
  });

  it('hasCredits returns true when credits > 0', () => {
    expect(useProStore.getState().hasCredits()).toBe(true);
    useProStore.getState().setCredits(0);
    expect(useProStore.getState().hasCredits()).toBe(false);
  });

  it('does not decrement credits below 0', () => {
    useProStore.getState().setCredits(1);
    useProStore.getState().decrementCredits();
    expect(useProStore.getState().credits).toBe(0);
    useProStore.getState().decrementCredits();
    expect(useProStore.getState().credits).toBe(0); // Should stay at 0
  });

  it('increments successful generations', () => {
    useProStore.getState().incrementSuccessfulGenerations();
    useProStore.getState().incrementSuccessfulGenerations();
    expect(useProStore.getState().successfulGenerations).toBe(2);
  });

  it('shows soft upsell after 2 generations when low credits', () => {
    useProStore.getState().setCredits(1);
    expect(useProStore.getState().shouldShowSoftUpsell()).toBe(false);

    useProStore.getState().incrementSuccessfulGenerations();
    useProStore.getState().incrementSuccessfulGenerations();

    expect(useProStore.getState().shouldShowSoftUpsell()).toBe(true);
  });

  it('does not show soft upsell when user has plenty of credits', () => {
    useProStore.getState().setCredits(10);
    useProStore.getState().incrementSuccessfulGenerations();
    useProStore.getState().incrementSuccessfulGenerations();
    useProStore.getState().incrementSuccessfulGenerations();

    expect(useProStore.getState().shouldShowSoftUpsell()).toBe(false);
  });

  it('dismisses soft upsell', () => {
    useProStore.getState().setCredits(1);
    useProStore.getState().incrementSuccessfulGenerations();
    useProStore.getState().incrementSuccessfulGenerations();
    expect(useProStore.getState().shouldShowSoftUpsell()).toBe(true);

    useProStore.getState().dismissSoftUpsell();
    expect(useProStore.getState().shouldShowSoftUpsell()).toBe(false);
  });
});
