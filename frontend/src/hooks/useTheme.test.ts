import { renderHook, act } from '@testing-library/react';
import { expect, test, vi, beforeEach, afterEach } from 'vitest';
import { useTheme } from './useTheme';

const STORAGE_KEY = 'backlog_royale_theme';

// Helper: create a controllable matchMedia mock
type Listener = (e: { matches: boolean }) => void;
const createMatchMediaMock = (initialMatches: boolean) => {
  const listeners = new Set<Listener>();
  let matches = initialMatches;
  const mq = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: 'change', l: Listener) => listeners.add(l),
    removeEventListener: (_type: 'change', l: Listener) => listeners.delete(l),
    addListener: () => {},
    removeListener: () => {},
    dispatch: (e: { matches: boolean }) => {
      matches = e.matches;
      listeners.forEach((l) => l(e));
    },
  };
  Object.defineProperty(mq, 'matches', { get: () => matches });
  return mq;
};

let matchMediaMock: ReturnType<typeof createMatchMediaMock>;
let storage: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => (key in storage ? storage[key] : null),
  setItem: (key: string, value: string) => {
    storage[key] = value;
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    storage = {};
  },
};

beforeEach(() => {
  storage = {};
  document.documentElement.classList.remove('dark');
  matchMediaMock = createMatchMediaMock(false);
  vi.stubGlobal('matchMedia', () => matchMediaMock);
  vi.stubGlobal('localStorage', localStorageMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('defaults to system mode with no localStorage', () => {
  const { result } = renderHook(() => useTheme());
  expect(result.current.theme).toBe('system');
});

test('reads light from localStorage', () => {
  localStorage.setItem(STORAGE_KEY, 'light');
  const { result } = renderHook(() => useTheme());
  expect(result.current.theme).toBe('light');
  expect(result.current.resolvedTheme).toBe('light');
  expect(document.documentElement.classList.contains('dark')).toBe(false);
});

test('reads dark from localStorage', () => {
  localStorage.setItem(STORAGE_KEY, 'dark');
  const { result } = renderHook(() => useTheme());
  expect(result.current.theme).toBe('dark');
  expect(result.current.resolvedTheme).toBe('dark');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});

test('normalizes invalid localStorage to system', () => {
  localStorage.setItem(STORAGE_KEY, 'purple');
  const { result } = renderHook(() => useTheme());
  expect(result.current.theme).toBe('system');
});

test('system mode follows OS dark preference', () => {
  matchMediaMock = createMatchMediaMock(true);
  vi.stubGlobal('matchMedia', () => matchMediaMock);
  const { result } = renderHook(() => useTheme());
  expect(result.current.theme).toBe('system');
  expect(result.current.resolvedTheme).toBe('dark');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});

test('system mode subscribes to OS changes', () => {
  const { result } = renderHook(() => useTheme());
  expect(result.current.resolvedTheme).toBe('light');
  act(() => {
    matchMediaMock.dispatch({ matches: true });
  });
  expect(result.current.resolvedTheme).toBe('dark');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});

test('explicit dark mode does not react to OS changes', () => {
  localStorage.setItem(STORAGE_KEY, 'light');
  const { result } = renderHook(() => useTheme());
  expect(result.current.resolvedTheme).toBe('light');
  act(() => {
    matchMediaMock.dispatch({ matches: true });
  });
  expect(result.current.resolvedTheme).toBe('light');
  expect(document.documentElement.classList.contains('dark')).toBe(false);
});

test('setTheme persists to localStorage and toggles class', () => {
  const { result } = renderHook(() => useTheme());
  expect(result.current.theme).toBe('system');

  act(() => {
    result.current.setTheme('dark');
  });

  expect(result.current.theme).toBe('dark');
  expect(result.current.resolvedTheme).toBe('dark');
  expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});

test('setTheme light removes dark class', () => {
  localStorage.setItem(STORAGE_KEY, 'dark');
  const { result } = renderHook(() => useTheme());
  expect(document.documentElement.classList.contains('dark')).toBe(true);

  act(() => {
    result.current.setTheme('light');
  });

  expect(result.current.resolvedTheme).toBe('light');
  expect(document.documentElement.classList.contains('dark')).toBe(false);
  expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
});

test('switching from explicit to system re-syncs to current OS value', () => {
  localStorage.setItem(STORAGE_KEY, 'dark');
  const { result } = renderHook(() => useTheme());
  expect(result.current.resolvedTheme).toBe('dark');

  // OS is light (default mock). Switching to system should sync to light.
  act(() => {
    result.current.setTheme('system');
  });

  expect(result.current.resolvedTheme).toBe('light');
  expect(document.documentElement.classList.contains('dark')).toBe(false);
});
