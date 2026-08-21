import { ABSTAIN_VALUE } from '../constants';

export interface Theme {
  text: string;
  bg: string;
  border: string;
  ring: string;
  shadow: string;
  hoverBorder: string;
}

export const getTheme = (val: string | undefined): Theme => {
  if (!val || val === '?' || val === ABSTAIN_VALUE) {
    return {
      text: 'text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-800',
      border: 'border-gray-200 dark:border-gray-700',
      ring: 'ring-gray-400/20',
      shadow: 'shadow-gray-200 dark:shadow-gray-950',
      hoverBorder: 'hover:border-gray-400 dark:hover:border-gray-500',
    };
  }

  const num = parseInt(val);
  if (num <= 3) {
    return {
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900',
      border: 'border-emerald-200 dark:border-emerald-700',
      ring: 'ring-emerald-600/20 dark:ring-emerald-400/30',
      shadow: 'shadow-emerald-200 dark:shadow-emerald-950',
      hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    };
  }

  if (num <= 8) {
    return {
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900',
      border: 'border-blue-200 dark:border-blue-700',
      ring: 'ring-blue-600/20 dark:ring-blue-400/30',
      shadow: 'shadow-blue-200 dark:shadow-blue-950',
      hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500',
    };
  }

  if (num <= 21) {
    return {
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-900',
      border: 'border-rose-200 dark:border-rose-700',
      ring: 'ring-rose-600/20 dark:ring-rose-400/30',
      shadow: 'shadow-rose-200 dark:shadow-rose-950',
      hoverBorder: 'hover:border-rose-400 dark:hover:border-rose-500',
    };
  }

  return {
    text: 'text-gray-600 dark:text-gray-300',
    bg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-600 dark:border-gray-500',
    ring: 'ring-gray-600/20',
    shadow: 'shadow-gray-200 dark:shadow-gray-950',
    hoverBorder: 'hover:border-gray-400 dark:hover:border-gray-400',
  };
};
