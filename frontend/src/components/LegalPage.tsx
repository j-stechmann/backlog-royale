import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  title: string;
  intro: string;
  onBack: () => void;
  children: React.ReactNode;
}

const LegalPage: React.FC<LegalPageProps> = ({ title, intro, onBack, children }) => {
  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:text-accent-strong transition-colors mb-8 focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>

        <div className="bg-surface rounded-3xl shadow-xl border border-glass p-6 sm:p-10">
          <h1 className="text-3xl font-black text-content tracking-tight mb-2">{title}</h1>
          <p className="text-mid-text mb-8">{intro}</p>

          <div className="space-y-8 text-sm text-content leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
};

interface SectionProps {
  heading: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ heading, children }) => {
  return (
    <section>
      <h2 className="text-lg font-bold text-content mb-2">{heading}</h2>
      <div className="space-y-2 text-mid-text">{children}</div>
    </section>
  );
};

export default LegalPage;
