# Usage Guide

How to run a story-pointing session with Backlog Royale. This is the player/facilitator-facing view; the rules behind each screen are in [Game rules](../product/game-rules.md).

## Joining

1. Open the app. You'll see the join screen with two fields: **Room Name** and **Your Display Name**.
2. If you followed a shared link, the room name is already filled in — just enter your name.
3. Click **Start Voting**. Your display name is remembered for next time (one-click rejoin).

Anyone with the same room name ends up in the same session — the room name is the invitation.

## The room at a glance

- **Header:** room name, copy-invite button (share the link with teammates), your AFK/Dealer toggles, a connection indicator (`Live` / `Reconnecting...`), and the theme toggle.
- **Voting area (center):** the card grid, or one of the special panels depending on your role and the round phase.
- **Player list (bottom):** everyone in the room with their status; the `x / y Voted` counter and the round controls at the top.

## Voting

Click any card to vote: **1, 2, 3, 5, 8, 13, 21**, **?** (no idea), or **A** (formally abstain). Your card lifts and locks in; everyone sees that you voted (green checkmark with a subtle bounce) but not *what* you picked. You can change your vote any time before the reveal.

Cards are color-banded by size — small estimates are green, mid ones blue, large ones rose, and the oddball cards are gray — so the revealed distribution reads at a glance.

## Revealing and the next round

- **Reveal Results** (eye icon) shows everyone's votes at once. Voting locks visually; the summary replaces the card grid as a distribution (`3 × 5`, `1 × 8`, …).
- **Next Round** (reset icon) clears all votes and returns everyone to the card grid.
- Who can do this: the **dealer**, or — when no dealer exists — **any player who isn't AFK**. The buttons appear in the player-list header for whoever is authorized; the Reveal button is enabled once every player has voted.

## The dealer

Click **Become Dealer** to facilitate: you'll see the voting progress and the Reveal/Next-Round controls, but you don't vote — the dealer deliberately sits out the estimation to avoid anchoring the team. Anyone can take the seat (the previous dealer is demoted automatically). Step down the same way, or just go AFK / leave; the seat vacates itself.

When the dealer leaves or a room starts dealer-free, the fallback kicks in automatically: non-AFK players manage the round themselves.

## Going AFK

**Go AFK** (coffee icon) steps you out: your vote is cleared, you're excluded from the progress count and from round management, and you show as a coffee cup. Only **you** can return — click **Return to Game**. The dealer can send *you* AFK (hover over your row), but can never pull you back in; nobody can be forced back into a vote.

## Tips for facilitators

- **Reveal on everyone's vote:** the Reveal button enables when the counter reaches `y / y` — wait for it to avoid cutting off slow voters.
- **Discuss outliers, not the average:** the summary is deliberately a distribution. A `1` next to a `21` is where the interesting conversation is.
- **Use "?" productively:** a cluster of "?" usually means the story needs to be split or clarified before it can be pointed.
- **Abstain counts:** "A" keeps the round honest when someone must recuse themselves (e.g. they'll work on the story).

## Theme and accessibility

The theme toggle (sun/moon/monitor) switches between light, dark, and follow-the-OS. Your choice is remembered across sessions and applied before first paint (no flash on reload). The same toggle lives on the join screen, so you can set it before joining.

## Leaving

Just close the tab. Your row disappears for everyone immediately (or within a minute on an abrupt network loss, when the server's keepalive notices). Your room state — the votes of everyone else — is unaffected. Rooms themselves vanish once the last person leaves.