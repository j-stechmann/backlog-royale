import { expect, test } from 'vitest';
import { getTheme } from './theme';
import { ABSTAIN_VALUE } from '../constants';

const classesOf = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

test('getTheme returns correct theme for "?"', () => {
  const theme = getTheme('?');
  expect(classesOf(theme.text)).toEqual(new Set(['text-gray-400']));
  expect(classesOf(theme.bg)).toEqual(new Set(['bg-gray-50', 'dark:bg-gray-800']));
  expect(classesOf(theme.border)).toEqual(new Set(['border-gray-200', 'dark:border-gray-700']));
  expect(classesOf(theme.ring)).toEqual(new Set(['ring-gray-400/20']));
  expect(classesOf(theme.shadow)).toEqual(new Set(['shadow-gray-200', 'dark:shadow-gray-950']));
  expect(classesOf(theme.hoverBorder)).toEqual(new Set(['hover:border-gray-400', 'dark:hover:border-gray-500']));
});

test('getTheme returns the gray theme for the abstain value', () => {
  const theme = getTheme(ABSTAIN_VALUE);
  expect(classesOf(theme.text)).toEqual(new Set(['text-gray-400']));
  expect(classesOf(theme.bg)).toEqual(new Set(['bg-gray-50', 'dark:bg-gray-800']));
  expect(classesOf(theme.border)).toEqual(new Set(['border-gray-200', 'dark:border-gray-700']));
  expect(classesOf(theme.ring)).toEqual(new Set(['ring-gray-400/20']));
  expect(classesOf(theme.shadow)).toEqual(new Set(['shadow-gray-200', 'dark:shadow-gray-950']));
  expect(classesOf(theme.hoverBorder)).toEqual(new Set(['hover:border-gray-400', 'dark:hover:border-gray-500']));
});

test('getTheme returns correct theme for small numbers', () => {
  const theme = getTheme('3');
  expect(classesOf(theme.text)).toEqual(new Set(['text-emerald-600', 'dark:text-emerald-400']));
  expect(classesOf(theme.bg)).toEqual(new Set(['bg-emerald-50', 'dark:bg-emerald-900']));
  expect(classesOf(theme.border)).toEqual(new Set(['border-emerald-200', 'dark:border-emerald-700']));
  expect(classesOf(theme.ring)).toEqual(new Set(['ring-emerald-600/20', 'dark:ring-emerald-400/30']));
  expect(classesOf(theme.shadow)).toEqual(new Set(['shadow-emerald-200', 'dark:shadow-emerald-950']));
  expect(classesOf(theme.hoverBorder)).toEqual(new Set(['hover:border-emerald-400', 'dark:hover:border-emerald-500']));
});

test('getTheme returns correct theme for medium numbers', () => {
  const theme = getTheme('8');
  expect(classesOf(theme.text)).toEqual(new Set(['text-blue-600', 'dark:text-blue-400']));
  expect(classesOf(theme.bg)).toEqual(new Set(['bg-blue-50', 'dark:bg-blue-900']));
  expect(classesOf(theme.border)).toEqual(new Set(['border-blue-200', 'dark:border-blue-700']));
  expect(classesOf(theme.ring)).toEqual(new Set(['ring-blue-600/20', 'dark:ring-blue-400/30']));
  expect(classesOf(theme.shadow)).toEqual(new Set(['shadow-blue-200', 'dark:shadow-blue-950']));
  expect(classesOf(theme.hoverBorder)).toEqual(new Set(['hover:border-blue-400', 'dark:hover:border-blue-500']));
});

test('getTheme returns correct theme for large numbers', () => {
  const theme = getTheme('13');
  expect(classesOf(theme.text)).toEqual(new Set(['text-rose-600', 'dark:text-rose-400']));
  expect(classesOf(theme.bg)).toEqual(new Set(['bg-rose-50', 'dark:bg-rose-900']));
  expect(classesOf(theme.border)).toEqual(new Set(['border-rose-200', 'dark:border-rose-700']));
  expect(classesOf(theme.ring)).toEqual(new Set(['ring-rose-600/20', 'dark:ring-rose-400/30']));
  expect(classesOf(theme.shadow)).toEqual(new Set(['shadow-rose-200', 'dark:shadow-rose-950']));
  expect(classesOf(theme.hoverBorder)).toEqual(new Set(['hover:border-rose-400', 'dark:hover:border-rose-500']));
});

test('getTheme returns fallback for undefined', () => {
  const theme = getTheme(undefined);
  expect(classesOf(theme.text)).toEqual(new Set(['text-gray-400']));
  expect(classesOf(theme.bg)).toEqual(new Set(['bg-gray-50', 'dark:bg-gray-800']));
  expect(classesOf(theme.border)).toEqual(new Set(['border-gray-200', 'dark:border-gray-700']));
  expect(classesOf(theme.ring)).toEqual(new Set(['ring-gray-400/20']));
  expect(classesOf(theme.shadow)).toEqual(new Set(['shadow-gray-200', 'dark:shadow-gray-950']));
  expect(classesOf(theme.hoverBorder)).toEqual(new Set(['hover:border-gray-400', 'dark:hover:border-gray-500']));
});

test('getTheme returns fallback theme for out-of-range values', () => {
  const theme = getTheme('99');
  expect(classesOf(theme.text)).toEqual(new Set(['text-gray-600', 'dark:text-gray-300']));
  expect(classesOf(theme.bg)).toEqual(new Set(['bg-gray-50', 'dark:bg-gray-800']));
  expect(classesOf(theme.border)).toEqual(new Set(['border-gray-600', 'dark:border-gray-500']));
  expect(classesOf(theme.ring)).toEqual(new Set(['ring-gray-600/20']));
  expect(classesOf(theme.shadow)).toEqual(new Set(['shadow-gray-200', 'dark:shadow-gray-950']));
  expect(classesOf(theme.hoverBorder)).toEqual(new Set(['hover:border-gray-400', 'dark:hover:border-gray-400']));
});