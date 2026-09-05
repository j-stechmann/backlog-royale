import { renderHook, act } from '@testing-library/react';
import { expect, test, beforeEach, afterEach, vi } from 'vitest';
import { useHashRoute } from './useHashRoute';

const setHash = (hash: string) => {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('returns null route with no hash', () => {
  const { result } = renderHook(() => useHashRoute());
  expect(result.current.route).toBeNull();
});

test('parses #/imprint on initial load', () => {
  setHash('#/imprint');
  const { result } = renderHook(() => useHashRoute());
  expect(result.current.route).toBe('imprint');
});

test('parses #/privacy on initial load', () => {
  setHash('#/privacy');
  const { result } = renderHook(() => useHashRoute());
  expect(result.current.route).toBe('privacy');
});

test('normalizes #imprint and trailing slashes', () => {
  setHash('#imprint');
  const { result } = renderHook(() => useHashRoute());
  expect(result.current.route).toBe('imprint');

  act(() => {
    setHash('#/privacy/');
  });
  expect(result.current.route).toBe('privacy');
});

test('unknown hashes resolve to null', () => {
  setHash('#/nonsense');
  const { result } = renderHook(() => useHashRoute());
  expect(result.current.route).toBeNull();
});

test('route follows hashchange events', () => {
  const { result } = renderHook(() => useHashRoute());
  expect(result.current.route).toBeNull();

  act(() => {
    setHash('#/imprint');
  });
  expect(result.current.route).toBe('imprint');

  act(() => {
    setHash('#/privacy');
  });
  expect(result.current.route).toBe('privacy');
});

test('navigate writes the hash and updates the route', () => {
  const { result } = renderHook(() => useHashRoute());

  act(() => {
    result.current.navigate('imprint');
  });
  expect(window.location.hash).toBe('#/imprint');
  expect(result.current.route).toBe('imprint');
});

test('navigate(null) clears the hash but keeps the query string', () => {
  window.history.replaceState({}, '', '/?room=abc');
  setHash('#/imprint');
  const { result } = renderHook(() => useHashRoute());
  expect(result.current.route).toBe('imprint');

  act(() => {
    result.current.navigate(null);
  });

  expect(window.location.search).toBe('?room=abc');
  expect(window.location.hash).toBe('');
  expect(result.current.route).toBeNull();
});

test('popstate syncs the route after a pushState history entry', () => {
  const { result } = renderHook(() => useHashRoute());

  act(() => {
    result.current.navigate('privacy');
  });
  expect(result.current.route).toBe('privacy');

  // In a browser the URL is already updated when popstate fires.
  // jsdom applies history.back() asynchronously, so simulate the
  // post-traversal state directly.
  act(() => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(result.current.route).toBeNull();
});