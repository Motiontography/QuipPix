import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { useUndoStack } from '../hooks/useUndoStack';

// Lightweight renderHook helper using react-test-renderer
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

describe('useUndoStack', () => {
  it('initializes with given state', () => {
    const { result } = renderHook(() =>
      useUndoStack({ initialState: { count: 0 } }),
    );
    expect(result.current.state).toEqual({ count: 0 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('setState pushes to undo stack', () => {
    const { result } = renderHook(() =>
      useUndoStack({ initialState: 'a' }),
    );
    act(() => {
      result.current.setState('b');
    });
    expect(result.current.state).toBe('b');
    expect(result.current.canUndo).toBe(true);
  });

  it('undo restores previous state', () => {
    const { result } = renderHook(() =>
      useUndoStack({ initialState: 'a' }),
    );
    act(() => {
      result.current.setState('b');
    });
    expect(result.current.state).toBe('b');

    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe('a');
    expect(result.current.canUndo).toBe(false);
  });

  it('redo restores undone state', () => {
    const { result } = renderHook(() =>
      useUndoStack({ initialState: 'a' }),
    );
    act(() => {
      result.current.setState('b');
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe('a');

    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toBe('b');
    expect(result.current.canRedo).toBe(false);
  });

  it('undo when empty does nothing', () => {
    const { result } = renderHook(() =>
      useUndoStack({ initialState: 42 }),
    );
    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe(42);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('redo when empty does nothing', () => {
    const { result } = renderHook(() =>
      useUndoStack({ initialState: 42 }),
    );
    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toBe(42);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('setState clears redo stack', () => {
    const { result } = renderHook(() =>
      useUndoStack({ initialState: 'a' }),
    );
    act(() => {
      result.current.setState('b');
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.setState('c');
    });
    expect(result.current.state).toBe('c');
    expect(result.current.canRedo).toBe(false);
  });

  it('respects maxHistory limit', () => {
    const { result } = renderHook(() =>
      useUndoStack({ initialState: 0, maxHistory: 5 }),
    );

    // Push 25 states (0 -> 1, 1 -> 2, ..., 24 -> 25)
    for (let i = 1; i <= 25; i++) {
      act(() => {
        result.current.setState(i);
      });
    }
    expect(result.current.state).toBe(25);

    // Undo 5 times should work
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.undo();
      });
    }
    expect(result.current.canUndo).toBe(false);

    // We went back 5 steps from 25, so state should be 20
    expect(result.current.state).toBe(20);

    // One more undo should do nothing
    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe(20);
  });

  it('reset clears history', () => {
    const { result } = renderHook(() =>
      useUndoStack({ initialState: 'a' }),
    );
    act(() => {
      result.current.setState('b');
    });
    act(() => {
      result.current.setState('c');
    });
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.reset('x');
    });
    expect(result.current.state).toBe('x');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('setState with updater function', () => {
    const { result } = renderHook(() =>
      useUndoStack({ initialState: { count: 10 } }),
    );
    act(() => {
      result.current.setState((prev) => ({ count: prev.count + 5 }));
    });
    expect(result.current.state).toEqual({ count: 15 });
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toEqual({ count: 10 });
  });
});
