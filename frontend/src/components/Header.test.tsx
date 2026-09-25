import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { Header } from './Header';
import type { ThemeMode } from '../hooks/useTheme';

const renderHeader = ({
  roomID = 'engineering-sprint-21',
  connected = true,
  connectionError = null as string | null,
  isAFK = false,
  isDealer = false,
  onToggleAFK = vi.fn(),
  onToggleRole = vi.fn(),
  theme = 'system' as ThemeMode,
  onSetTheme = vi.fn(),
} = {}) =>
  render(
    <Header
      roomID={roomID}
      connected={connected}
      connectionError={connectionError}
      isAFK={isAFK}
      isDealer={isDealer}
      onToggleAFK={onToggleAFK}
      onToggleRole={onToggleRole}
      theme={theme}
      onSetTheme={onSetTheme}
    />
  );

describe('Header', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'navigator',
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the brand and room ID', () => {
    renderHeader({ roomID: 'my-room' });
    expect(screen.getByText('Backlog Royale')).toBeDefined();
    expect(screen.getByTestId('room-id').textContent).toBe('my-room');
  });

  it('shows the Live pill when connected and Reconnecting when not', () => {
    renderHeader({ connected: true });
    const pill = screen
      .getAllByTestId('connection-status')
      .find((el) => !el.closest('[data-testid="header-menu"]'))!;
    expect(pill.textContent).toContain('Live');

    cleanup();
    renderHeader({ connected: false });
    const pillDisconnected = screen
      .getAllByTestId('connection-status')
      .find((el) => !el.closest('[data-testid="header-menu"]'))!;
    expect(pillDisconnected.textContent).toContain('Reconnecting...');
  });

  it('shows the connection error in the pill instead of Reconnecting', () => {
    renderHeader({ connected: false, connectionError: 'Could not reach the room.' });
    const pill = screen
      .getAllByTestId('connection-status')
      .find((el) => !el.closest('[data-testid="header-menu"]'))!;
    expect(pill.textContent).toContain('Could not reach the room.');
    expect(pill.textContent).not.toContain('Reconnecting...');
  });

  it('toggles AFK from the inline control and reports pressed state', () => {
    const onToggleAFK = vi.fn();
    renderHeader({ onToggleAFK });

    const inlineAfk = screen
      .getAllByTestId('toggle-afk')
      .find((el) => !el.closest('[data-testid="header-menu"]'))!;
    expect(inlineAfk.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(inlineAfk);
    expect(onToggleAFK).toHaveBeenCalledTimes(1);
  });

  it('toggles the dealer role from the inline control', () => {
    const onToggleRole = vi.fn();
    renderHeader({ onToggleRole });

    const inlineDealer = screen
      .getAllByTestId('toggle-dealer')
      .find((el) => !el.closest('[data-testid="header-menu"]'))!;
    fireEvent.click(inlineDealer);
    expect(onToggleRole).toHaveBeenCalledTimes(1);
  });

  it('copies the invite link from the inline share button', async () => {
    renderHeader();

    const inlineShare = screen
      .getAllByTestId('share-link')
      .find((el) => !el.closest('[data-testid="header-menu"]'));
    fireEvent.click(inlineShare!);
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        window.location.href
      )
    );
  });

  describe('mobile menu', () => {
    const openMenu = () => {
      renderHeader();
      fireEvent.click(screen.getByTestId('header-menu-toggle'));
      expect(screen.getByTestId('header-menu').className).not.toContain('hidden');
      expect(screen.getByTestId('header-menu-toggle').getAttribute('aria-expanded')).toBe('true');
    };

    it('opens and closes via the burger button', () => {
      openMenu();

      fireEvent.click(screen.getByTestId('header-menu-toggle'));
      expect(screen.getByTestId('header-menu').className).toContain('hidden');
      expect(screen.getByTestId('header-menu-toggle').getAttribute('aria-expanded')).toBe('false');
    });

    it('closes on Escape and returns focus to the burger', () => {
      openMenu();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.getByTestId('header-menu-toggle').getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(screen.getByTestId('header-menu-toggle'));
    });

    it('closes on outside pointer-down', () => {
      openMenu();

      fireEvent.pointerDown(document.body);
      expect(screen.getByTestId('header-menu-toggle').getAttribute('aria-expanded')).toBe('false');
    });

    it('stays open on pointer-down inside the menu', () => {
      openMenu();

      fireEvent.pointerDown(screen.getByTestId('header-menu'));
      expect(screen.getByTestId('header-menu-toggle').getAttribute('aria-expanded')).toBe('true');
    });

    it('fires AFK and Dealer toggles from the menu and closes it', () => {
      const onToggleAFK = vi.fn();
      const onToggleRole = vi.fn();
      renderHeader({ onToggleAFK, onToggleRole });

      fireEvent.click(screen.getByTestId('header-menu-toggle'));

      const menu = screen.getByTestId('header-menu');
      const menuAfk = within(menu).getByTestId('toggle-afk');
      const inlineAfk = screen.getAllByTestId('toggle-afk').find((el) => !menu.contains(el));
      expect(inlineAfk).toBeDefined();
      fireEvent.click(menuAfk);
      expect(onToggleAFK).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('header-menu-toggle').getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(screen.getByTestId('header-menu-toggle'));

      fireEvent.click(screen.getByTestId('header-menu-toggle'));
      const menuDealer = within(screen.getByTestId('header-menu')).getByTestId('toggle-dealer');
      fireEvent.click(menuDealer);
      expect(onToggleRole).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('header-menu-toggle').getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(screen.getByTestId('header-menu-toggle'));
    });

    it('sets the theme from the menu and closes it with focus on the burger', () => {
      const onSetTheme = vi.fn();
      renderHeader({ onSetTheme });

      fireEvent.click(screen.getByTestId('header-menu-toggle'));
      const menu = screen.getByTestId('header-menu');
      const darkButton = within(menu).getByLabelText('Dark theme');
      fireEvent.click(darkButton);
      expect(onSetTheme).toHaveBeenCalledWith('dark');
      expect(screen.getByTestId('header-menu-toggle').getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(screen.getByTestId('header-menu-toggle'));
    });

    it('copies the invite link from the menu and closes it', async () => {
      openMenu();

      fireEvent.click(screen.getByTestId('share-link-menu'));
      await vi.waitFor(() =>
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          window.location.href
        )
      );
      expect(screen.getByTestId('header-menu-toggle').getAttribute('aria-expanded')).toBe('false');
    });

    it('shows the connection pill inside the menu', () => {
      openMenu();

      const menu = screen.getByTestId('header-menu');
      const pill = within(menu).getByTestId('connection-status');
      expect(pill.textContent).toContain('Live');
      expect(within(menu).getByText('Theme')).toBeDefined();
    });
  });
});
