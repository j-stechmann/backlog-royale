import React from 'react';
import LegalPage from './LegalPage';

interface ImprintProps {
  onBack: () => void;
}

export const Imprint: React.FC<ImprintProps> = ({ onBack }) => {
  return (
    <LegalPage title="Imprint" intro="Information according to § 5 DDG." onBack={onBack}>
      <section>
        <h2 className="text-lg font-bold text-content mb-2">Information according to § 5 DDG</h2>
        <div className="text-mid-text">
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
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-content mb-2">
          Responsible for content according to § 18(2) MStV
        </h2>
        <div className="text-mid-text">
          <p>
            Jonathan Stechmann
            <br />
            Bismarckstr. 17
            <br />
            24768 Rendsburg
            <br />
            Germany
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-content mb-2">Liability for content</h2>
        <div className="space-y-2 text-mid-text">
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
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-content mb-2">Liability for external links</h2>
        <div className="text-mid-text">
          <p>
            This website contains links to third-party websites over which I have no control.
            Therefore, I cannot assume any liability for such external content. The respective
            provider or operator of the linked pages is always responsible for their content. The
            linked pages were checked for possible legal violations at the time of linking; unlawful
            content was not identifiable at that time. Upon becoming aware of legal violations, I will
            remove such links immediately.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-content mb-2">Copyright</h2>
        <div className="text-mid-text">
          <p>
            The content and works created by the operator on these pages are subject to German
            copyright law. The reproduction, editing, distribution, and any kind of exploitation
            outside the limits of copyright law require the written consent of the respective author.
            The source code of this application is publicly available under the terms of the GPL-2.0
            license.
          </p>
        </div>
      </section>
    </LegalPage>
  );
};

export default Imprint;