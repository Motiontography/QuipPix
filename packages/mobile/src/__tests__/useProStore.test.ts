import { useProStore } from '../store/useProStore';

function resetStore() {
  useProStore.setState({
    entitlement: { proActive: false, proType: null, expiresAt: null },
    dailyGenerations: 0,
    dailyDate: new Date().toISOString().split('T')[0],
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

  it('updates entitlement to pro', () => {
    useProStore.getState().setEntitlement({
      proActive: true,
      proType: 'annual',
      expiresAt: '2026-01-01',
    });
    expect(useProStore.getState().entitlement.proActive).toBe(true);
    expect(useProStore.getState().entitlement.proType).toBe('annual');
  });

  it('tracks daily generations', () => {
    useProStore.getState().incrementDailyGenerations();
    expect(useProStore.getState().dailyGenerations).toBe(1);
    useProStore.getState().incrementDailyGenerations();
    expect(useProStore.getState().dailyGenerations).toBe(2);
  });

  it('daily limit reached for free user at 5 generations', () => {
    for (let i = 0; i < 5; i++) {
      useProStore.getState().incrementDailyGenerations();
    }
    expect(useProStore.getState().isDailyLimitReached()).toBe(true);
  });

  it('daily limit never reached for pro user', () => {
    useProStore.getState().setEntitlement({
      proActive: true,
      proType: 'monthly',
      expiresAt: null,
    });
    for (let i = 0; i < 10; i++) {
      useProStore.getState().incrementDailyGenerations();
    }
    expect(useProStore.getState().isDailyLimitReached()).toBe(false);
  });

  it('increments successful generations', () => {
    useProStore.getState().incrementSuccessfulGenerations();
    useProStore.getState().incrementSuccessfulGenerations();
    expect(useProStore.getState().successfulGenerations).toBe(2);
  });

  it('shows soft upsell after 2 generations for free user', () => {
    expect(useProStore.getState().shouldShowSoftUpsell()).toBe(false);

    useProStore.getState().incrementSuccessfulGenerations();
    useProStore.getState().incrementSuccessfulGenerations();

    expect(useProStore.getState().shouldShowSoftUpsell()).toBe(true);
  });

  it('does not show soft upsell for pro users', () => {
    useProStore.getState().setEntitlement({
      proActive: true,
      proType: 'lifetime',
      expiresAt: null,
    });
    useProStore.getState().incrementSuccessfulGenerations();
    useProStore.getState().incrementSuccessfulGenerations();
    useProStore.getState().incrementSuccessfulGenerations();

    expect(useProStore.getState().shouldShowSoftUpsell()).toBe(false);
  });

  it('dismisses soft upsell', () => {
    useProStore.getState().incrementSuccessfulGenerations();
    useProStore.getState().incrementSuccessfulGenerations();
    expect(useProStore.getState().shouldShowSoftUpsell()).toBe(true);

    useProStore.getState().dismissSoftUpsell();
    expect(useProStore.getState().shouldShowSoftUpsell()).toBe(false);
  });
});
