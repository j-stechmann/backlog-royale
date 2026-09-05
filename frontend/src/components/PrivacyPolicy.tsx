import React from 'react';
import LegalPage, { Section } from './LegalPage';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <LegalPage title="Privacy Policy" intro="How your data is handled when using Backlog Royale." onBack={onBack}>
      <Section heading="1. Controller">
        <p>
          Responsible for the data processing described below (the "controller" within the meaning of
          the GDPR) is:
        </p>
        <p>
          Jonathan Stechmann
          <br />
          Bismarckstr. 17
          <br />
          24768 Rendsburg
          <br />
          Germany
          <br />
          Email:{' '}
          <a
            href="mailto:jonathanstechmann@pm.me"
            className="text-accent-text hover:text-accent-strong focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            jonathanstechmann@pm.me
          </a>
        </p>
      </Section>

      <Section heading="2. Overview">
        <p>
          Backlog Royale is designed to collect as little personal data as possible: there are no
          accounts, no cookies, no analytics, no tracking, and no third-party services embedded in the
          page. You choose what data enters the app: the display name you type is the only personal
          data you actively provide, and it can be any name you like.
        </p>
      </Section>

      <Section heading="3. What is processed, and why">
        <h3 className="font-bold text-content">a) Game sessions (WebSocket service)</h3>
        <p>
          To play, your browser connects to the service via WebSocket. Processed data: the display
          name you choose, your votes, and room state (room ID, player list, roles). Your display name
          and votes are visible to everyone in the same room. This processing is necessary to provide
          the service you explicitly requested (Art. 6(1)(b) GDPR). Session data exists only in
          server memory and is deleted when the room empties.
        </p>
        <h3 className="font-bold text-content">b) Connection handling</h3>
        <p>
          Your IP address is processed transiently in memory to establish and maintain the connection
          (TLS, routing). No access logs are kept, so IP addresses are not stored (Art. 6(1)(f) GDPR;
          our legitimate interest in a functioning, secure service).
        </p>
        <h3 className="font-bold text-content">c) Rate limiting and misuse prevention</h3>
        <p>
          Requests are rate-limited to protect the service from abuse. The application itself does not
          log IP addresses (it only sees the proxy's internal address) (Art. 6(1)(f) GDPR).
        </p>
        <h3 className="font-bold text-content">d) Server logs</h3>
        <p>
          The application writes technical logs. These contain room events and — only on warnings such
          as rate limiting or protocol errors — your self-chosen player name plus a randomly generated
          client ID (never IP addresses, never votes). Logs are rotated at a maximum of 3 × 10 MB
          (oldest entries overwritten first) and are deleted when the server container is recreated.
          Server-side infrastructure (operating system) security logs (e.g. SSH, fail2ban, journald)
          are auto-rotated and retained for approximately 4 weeks (Art. 6(1)(f) GDPR).
        </p>
        <h3 className="font-bold text-content">e) Browser storage (localStorage)</h3>
        <p>
          The app stores three entries in your browser's localStorage: your display name (
          <code>backlog_royale_name</code>), a random reconnect ID (<code>backlog_royale_id</code>),
          and your theme preference (<code>backlog_royale_theme</code>). This storage is strictly
          necessary to provide the service you requested (§ 25(2) TDDDG; Art. 6(1)(b) GDPR) — it is
          not used for tracking, and no third party can read it. You can delete these entries at any
          time via your browser settings ("clear site data"); they are not cookies, so they do not
          appear in cookie lists.
        </p>
      </Section>

      <Section heading="4. Hosting">
        <p>
          This website is operated on a virtual private server hosted by Hetzner Online GmbH,
          Hanauer Straße 8, 63263 Neu-Isenburg, Germany. As the hosting provider, Hetzner processes
          connection data under a data processing agreement for hosting purposes (Art. 6(1)(f) GDPR).
          Details: <a className="text-accent-text hover:text-accent-strong underline" href="https://www.hetzner.com/AV/DPA_en.pdf" target="_blank" rel="noopener noreferrer">Hetzner data processing agreement</a>.
        </p>
      </Section>

      <Section heading="5. Data transfer">
        <p>
          All processing takes place in Germany. No data is transferred to countries outside the
          European Union, and no data is disclosed to third parties beyond what is technically
          necessary (hosting) and described above. Your display name and votes are shared with other
          members of the room you join — that is the nature of the service.
        </p>
      </Section>

      <Section heading="6. Storage duration">
        <p>
          Game session data (names, votes, room state) is kept only for the duration of the session
          and is gone when the room empties or the server restarts. Application logs rotate at 3 × 10
          MB; system security logs are retained for approximately 4 weeks. Browser storage persists
          until you delete it.
        </p>
      </Section>

      <Section heading="7. Your rights">
        <p>
          You have the right to access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17),
          restriction of processing (Art. 18), data portability (Art. 20), and objection (Art. 21)
          regarding your personal data, in each case within the legal limits. Because session data is
          ephemeral and pseudonymous, in most cases there will be no stored data attributable to you;
          the quickest way to remove data attributed to your browser is clearing the site data in your
          browser settings.
        </p>
        <p>
          You also have the right to lodge a complaint with a data protection supervisory authority,
          in particular in the German federal state where you reside or work, or where an alleged
          infringement took place. The supervisory authority responsible for the controller is the{' '}
          <a
            className="text-accent-text hover:text-accent-strong underline"
            href="https://www.datenschutzzentrum.de/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Unabhängiges Landeszentrum für Datenschutz Schleswig-Holstein (ULD)
          </a>
          .
        </p>
      </Section>

      <Section heading="8. Security">
        <p>
          All traffic between your browser and the service is encrypted via TLS. Votes are
          additionally protected server-side: hidden votes are never transmitted to other clients
          before a reveal.
        </p>
      </Section>
    </LegalPage>
  );
};

export default PrivacyPolicy;