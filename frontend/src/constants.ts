export const CARD_VALUES = ['1', '2', '3', '5', '8', '13', '21', '?'];

export const ROLES = {
  PLAYER: 'player',
  DEALER: 'dealer',
  AFK: 'afk',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ACTIONS = {
  VOTE: 'VOTE',
  REVEAL: 'REVEAL',
  RESET: 'RESET',
  TOGGLE_ROLE: 'TOGGLE_ROLE',
  TOGGLE_AFK: 'TOGGLE_AFK',
} as const;

export type ActionType = (typeof ACTIONS)[keyof typeof ACTIONS];

export const MESSAGE_TYPES = {
  STATE: 'STATE',
} as const;
