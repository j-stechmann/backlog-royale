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
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      ring: 'ring-gray-400/20',
      shadow: 'shadow-gray-200',
      hoverBorder: 'hover:border-gray-400',
    };
  }

  const num = parseInt(val);
  if (num <= 3) {
    return {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      ring: 'ring-emerald-600/20',
      shadow: 'shadow-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
    };
  }

  if (num <= 8) {
    return {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      ring: 'ring-blue-600/20',
      shadow: 'shadow-blue-200',
      hoverBorder: 'hover:border-blue-400',
    };
  }

  if (num <= 21) {
    return {
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      ring: 'ring-rose-600/20',
      shadow: 'shadow-rose-200',
      hoverBorder: 'hover:border-rose-400',
    };
  }

  return {
    text: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-600',
    ring: 'ring-gray-600/20',
    shadow: 'shadow-gray-200',
    hoverBorder: 'hover:border-gray-400',
  };
};
