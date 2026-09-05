import React from 'react';
import LegalPage, { Section } from './LegalPage';

interface ImprintProps {
  onBack: () => void;
}

export const Imprint: React.FC<ImprintProps> = ({ onBack }) => {
  return (
    <LegalPage title="Imprint" intro="Information according to § 5 DDG." onBack={onBack}>
      <Section heading="Information according to § 5 DDG">
        <p>
          Jonathan Stechmann
          <br />
          Bismarckstr. 17
          <br />
          24768 Rendsburg
          <br />
          Germany
        </p>
        <p>
          Contact:{' '}
          <a
            href="mailto:jonathanstechmann@pm.me"
            className="text-accent-text hover:text-accent-strong focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            jonathanstechmann@pm.me
          </a>
        </p>
      </Section>

      <Section heading="Responsible for content according to § 18(2) MStV">
        <p>
          Jonathan Stechmann
          <br />
          Bismarckstr. 17
          <br />
          24768 Rendsburg
          <br />
          Germany
        </p>
      </Section>

      <Section heading="Liability for content">
        <p>
          As the service provider, I am responsible for my own content on these pages in accordance
          with general legislation. However, I am not obliged to monitor transmitted or stored
          third-party information or to investigate circumstances that indicate illegal activity.
        </p>
        <p>
          Obligations to remove or block the use of information in accordance with general laws
          remain unaffected. Liability in this regard is only possible from the time of knowledge of
          a specific legal violation. Upon becoming aware of corresponding legal violations, I will
          remove this content immediately.
        </p>
      </Section>

      <Section heading="Liability for external links">
        <p>
          This website contains links to third-party websites over which I have no control.
          Therefore, I cannot assume any liability for such external content. The respective
          provider or operator of the linked pages is always responsible for their content. The
          linked pages were checked for possible legal violations at the time of linking; unlawful
          content was not identifiable at that time. Upon becoming aware of legal violations, I will
          remove such links immediately.
        </p>
      </Section>

      <Section heading="Copyright">
        <p>
          The content and works created by the operator on these pages are subject to German
          copyright law. The reproduction, editing, distribution, and any kind of exploitation
          outside the limits of copyright law require the written consent of the respective author.
          The source code of this application is publicly available under the terms of the GPL-2.0
          license.
        </p>
      </Section>
    </LegalPage>
  );
};

export default Imprint;
