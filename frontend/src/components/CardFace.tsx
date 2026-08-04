import React from 'react';
import { Ban } from 'lucide-react';

export const ABSTAIN_VALUE = 'A';

interface CardFaceProps {
  value: string;
  textClassName: string;
  iconClassName: string;
  sharedClassName?: string;
}

export const CardFace: React.FC<CardFaceProps> = ({ value, textClassName, iconClassName, sharedClassName }) => {
  const shared = sharedClassName ?? '';
  if (value === ABSTAIN_VALUE) {
    return <Ban className={`${shared} ${iconClassName}`} strokeWidth={2.5} aria-hidden="true" />;
  }
  return <span className={`${shared} ${textClassName}`}>{value}</span>;
};