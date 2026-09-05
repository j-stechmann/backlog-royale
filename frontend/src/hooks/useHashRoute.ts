import { useState, useEffect, useCallback } from 'react';

export type LegalRoute = 'imprint' | 'privacy';

export const LEGAL_ROUTES: LegalRoute[] = ['imprint', 'privacy'];

// Lenient parse: "#/imprint", "#imprint", "#/imprint/" all normalize to
// "imprint"; anything else (including no hash) means "not on a legal page".
const parseHash = (): LegalRoute | null => {
  const raw = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  return (LEGAL_ROUTES as string[]).includes(raw) ? (raw as LegalRoute) : null;
};

export const useHashRoute = () => {
  // Lazy initializer so a direct load of /#/imprint resolves on first render.
  const [route, setRoute] = useState<LegalRoute | null>(() => parseHash());

  useEffect(() => {
    // hashchange fires for hash edits; popstate covers back/forward across
    // pushState entries (which do not fire hashchange).
    const sync = () => setRoute(parseHash());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const navigate = useCallback((next: LegalRoute | null) => {
    if (next) {
      // Assigning the hash fires hashchange and adds a history entry,
      // so the browser Back button returns to the app. State is set
      // directly: some environments dispatch hashchange asynchronously,
      // and the subsequent event parses to the same route (no-op).
      window.location.hash = `#/${next}`;
      setRoute(next);
    } else {
      // pushState fires no event: rewrite without the fragment, keeping
      // the query string (?room=), then sync state manually.
      const url = new URL(window.location.href);
      url.hash = '';
      window.history.pushState({}, '', url.pathname + url.search);
      setRoute(null);
    }
  }, []);

  return { route, navigate };
};
