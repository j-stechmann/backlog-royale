import React from 'react';
import { Ban } from 'lucide-react';
import { ABSTAIN_VALUE } from '../constants';

interface CardFaceProps {
  value: string;
  textClassName: string;
  iconClassName: string;
}

export const CardFace: React.FC<CardFaceProps> = ({ value, textClassName, iconClassName }) => {
  if (value === ABSTAIN_VALUE) {
    return <Ban className={iconClassName} strokeWidth={2.5} aria-hidden="true" />;
  }
  return <span className={textClassName}>{value}</span>;
};
