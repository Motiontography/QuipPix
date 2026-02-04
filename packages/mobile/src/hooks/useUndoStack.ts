import { useReducer, useCallback } from 'react';

interface UndoStackOptions<T> {
  initialState: T;
  maxHistory?: number;
}

interface UndoStackReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  reset: (defaultState: T) => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface UndoState<T> {
  past: T[];
  present: T;
  future: T[];
}

type UndoAction<T> =
  | { type: 'SET'; payload: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; payload: T };

function createReducer<T>(maxHistory: number) {
  return function undoReducer(
    state: UndoState<T>,
    action: UndoAction<T>,
  ): UndoState<T> {
    switch (action.type) {
      case 'SET': {
        const newPast = [...state.past, state.present];
        if (newPast.length > maxHistory) {
          newPast.splice(0, newPast.length - maxHistory);
        }
        return {
          past: newPast,
          present: action.payload,
          future: [],
        };
      }
      case 'UNDO': {
        if (state.past.length === 0) {
          return state;
        }
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);
        return {
          past: newPast,
          present: previous,
          future: [state.present, ...state.future],
        };
      }
      case 'REDO': {
        if (state.future.length === 0) {
          return state;
        }
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        return {
          past: [...state.past, state.present],
          present: next,
          future: newFuture,
        };
      }
      case 'RESET': {
        return {
          past: [],
          present: action.payload,
          future: [],
        };
      }
      default:
        return state;
    }
  };
}

export function useUndoStack<T>(options: UndoStackOptions<T>): UndoStackReturn<T> {
  const { initialState, maxHistory = 20 } = options;

  const [undoState, dispatch] = useReducer(createReducer<T>(maxHistory), {
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      if (typeof newState === 'function') {
        const updater = newState as (prev: T) => T;
        dispatch({ type: 'SET', payload: updater(undoState.present) });
      } else {
        dispatch({ type: 'SET', payload: newState });
      }
    },
    [undoState.present],
  );

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const reset = useCallback((defaultState: T) => {
    dispatch({ type: 'RESET', payload: defaultState });
  }, []);

  return {
    state: undoState.present,
    setState,
    undo,
    redo,
    reset,
    canUndo: undoState.past.length > 0,
    canRedo: undoState.future.length > 0,
  };
}
