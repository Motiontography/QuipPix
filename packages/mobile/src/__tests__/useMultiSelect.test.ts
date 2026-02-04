import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { useMultiSelect } from '../hooks/useMultiSelect';

function renderHook<T>(hookFn: () => T) {
  let result: { current: T } = { current: undefined as unknown as T };
  function TestComponent() {
    result.current = hookFn();
    return null;
  }
  let renderer: ReactTestRenderer;
  act(() => {
    renderer = create(React.createElement(TestComponent));
  });
  return {
    result,
    rerender: () => {
      act(() => {
        renderer.update(React.createElement(TestComponent));
      });
    },
    unmount: () => {
      act(() => {
        renderer.unmount();
      });
    },
  };
}

describe('useMultiSelect', () => {
  it('starts not in selection mode with empty selection', () => {
    const { result } = renderHook(() => useMultiSelect());
    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('enterSelectionMode activates selection mode', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => {
      result.current.enterSelectionMode();
    });
    expect(result.current.isSelectionMode).toBe(true);
    expect(result.current.selectedCount).toBe(0);
  });

  it('enterSelectionMode with initialId selects that item', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => {
      result.current.enterSelectionMode('item-1');
    });
    expect(result.current.isSelectionMode).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected('item-1')).toBe(true);
  });

  it('exitSelectionMode clears selection and exits mode', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => {
      result.current.enterSelectionMode('item-1');
    });
    act(() => {
      result.current.exitSelectionMode();
    });
    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it('toggleSelection adds and removes items', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => {
      result.current.toggleSelection('a');
    });
    expect(result.current.isSelected('a')).toBe(true);
    expect(result.current.selectedCount).toBe(1);

    act(() => {
      result.current.toggleSelection('b');
    });
    expect(result.current.selectedCount).toBe(2);

    // Toggle off
    act(() => {
      result.current.toggleSelection('a');
    });
    expect(result.current.isSelected('a')).toBe(false);
    expect(result.current.selectedCount).toBe(1);
  });

  it('selectAll replaces selection with provided ids', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => {
      result.current.toggleSelection('x');
    });
    act(() => {
      result.current.selectAll(['a', 'b', 'c']);
    });
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isSelected('a')).toBe(true);
    expect(result.current.isSelected('b')).toBe(true);
    expect(result.current.isSelected('c')).toBe(true);
    // Old selection replaced
    expect(result.current.isSelected('x')).toBe(false);
  });

  it('clearSelection empties selection without exiting mode', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => {
      result.current.enterSelectionMode('item-1');
    });
    act(() => {
      result.current.toggleSelection('item-2');
    });
    expect(result.current.selectedCount).toBe(2);

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedCount).toBe(0);
    // Mode is still active (clearSelection doesn't exit mode)
    expect(result.current.isSelectionMode).toBe(true);
  });

  it('isSelected returns false for unselected items', () => {
    const { result } = renderHook(() => useMultiSelect());
    expect(result.current.isSelected('nonexistent')).toBe(false);
  });
});
