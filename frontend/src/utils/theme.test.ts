import { expect, test } from 'vitest';
import { getTheme } from './theme';
import { ABSTAIN_VALUE } from '../constants';

test('getTheme returns correct theme for "?"', () => {
  const theme = getTheme('?');
  expect(theme.text).toBe('text-gray-400');
});

test('getTheme returns the gray theme for the abstain value', () => {
  const theme = getTheme(ABSTAIN_VALUE);
  expect(theme.text).toBe('text-gray-400');
  expect(theme.bg).toBe('bg-gray-50');
  expect(theme.border).toBe('border-gray-200');
});

test('getTheme returns correct theme for small numbers', () => {
  const theme = getTheme('3');
  expect(theme.text).toBe('text-emerald-600');
});

test('getTheme returns correct theme for medium numbers', () => {
  const theme = getTheme('8');
  expect(theme.text).toBe('text-blue-600');
});

test('getTheme returns correct theme for large numbers', () => {
  const theme = getTheme('13');
  expect(theme.text).toBe('text-rose-600');
});

test('getTheme returns fallback for undefined', () => {
  const theme = getTheme(undefined);
  expect(theme.text).toBe('text-gray-400');
});
