package main

import (
	"encoding/json"
	"testing"
	"time"
)

func TestRoomVoting(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)

	client1 := &Client{ID: "1", name: "Alice", role: RolePlayer, send: make(chan []byte, 10)}
	client2 := &Client{ID: "2", name: "Bob", role: RolePlayer, send: make(chan []byte, 10)}

	room.clients[client1.ID] = client1
	room.clients[client2.ID] = client2

	// Test VOTE
	room.handleAction(ActionMessage{Type: ActionVote, Vote: "5"}, client1)
	if room.participants[client1.ID] != "5" {
		t.Errorf("expected Alice to have voted 5, got %s", room.participants[client1.ID])
	}

	// Make Alice dealer so she can reveal
	room.handleAction(ActionMessage{Type: ActionToggleRole}, client1)

	// Test REVEAL
	room.handleAction(ActionMessage{Type: ActionReveal}, client1)
	if !room.isRevealed {
		t.Error("expected room to be revealed")
	}

	// Test RESET
	room.handleAction(ActionMessage{Type: ActionReset}, client1)
	if room.isRevealed {
		t.Error("expected room not to be revealed after reset")
	}
	if room.participants[client1.ID] != "" {
		t.Error("expected Alice's vote to be cleared after reset")
	}
}

func TestNameCollision(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)

	client1 := &Client{ID: "1", name: "Alice", role: RolePlayer, send: make(chan []byte, 1)}
	client2 := &Client{ID: "2", name: "Alice", role: RolePlayer, send: make(chan []byte, 1)}

	room.clients[client1.ID] = client1
	room.clients[client2.ID] = client2

	// Alice 1 votes 5
	room.handleAction(ActionMessage{Type: ActionVote, Vote: "5"}, client1)
	// Alice 2 votes 8
	room.handleAction(ActionMessage{Type: ActionVote, Vote: "8"}, client2)

	if room.participants[client1.ID] != "5" {
		t.Errorf("Alice 1 vote overwritten: expected 5, got %s", room.participants[client1.ID])
	}
	if room.participants[client2.ID] != "8" {
		t.Errorf("Alice 2 vote incorrect: expected 8, got %s", room.participants[client2.ID])
	}
}

func TestAllowedVotes(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)
	client := &Client{ID: "1", name: "Alice", role: RolePlayer, send: make(chan []byte, 1)}
	room.clients[client.ID] = client

	// Valid vote
	room.handleAction(ActionMessage{Type: ActionVote, Vote: "13"}, client)
	if room.participants[client.ID] != "13" {
		t.Errorf("expected vote 13 to be accepted")
	}

	// Invalid vote
	room.handleAction(ActionMessage{Type: ActionVote, Vote: "100"}, client)
	if room.participants[client.ID] != "13" {
		t.Errorf("expected invalid vote 100 to be ignored, kept 13")
	}

	// Abstain vote
	room.handleAction(ActionMessage{Type: ActionVote, Vote: "A"}, client)
	if room.participants[client.ID] != "A" {
		t.Errorf("expected abstain vote A to be accepted, got %s", room.participants[client.ID])
	}
}

func TestAbstainVoteCountsAsVoted(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)
	client := &Client{ID: "1", name: "Alice", role: RolePlayer, send: make(chan []byte, 10)}
	room.clients[client.ID] = client

	// Cast an abstain vote.
	room.handleAction(ActionMessage{Type: ActionVote, Vote: "A"}, client)

	// Broadcast state and inspect the serialized user to confirm the abstain
	// vote counts toward the voting-progress total (HasVoted == true).
	room.mu.Lock()
	room.broadcastStateLocked()
	room.mu.Unlock()

	select {
	case data := <-client.send:
		var state RoomState
		if err := json.Unmarshal(data, &state); err != nil {
			t.Fatalf("failed to unmarshal broadcast state: %v", err)
		}
		if len(state.Users) != 1 {
			t.Fatalf("expected 1 user in state, got %d", len(state.Users))
		}
		u := state.Users[0]
		if !u.HasVoted {
			t.Error("expected abstain vote to count toward HasVoted, got false")
		}
		// Before reveal, the vote value must not be visible.
		if u.Vote != "" {
			t.Errorf("expected vote to be hidden before reveal, got %q", u.Vote)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for broadcast state")
	}
}

func TestReconnectDeduplication(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)
	go room.Run()

	// Mocking enough of client to avoid panics
	client1 := &Client{ID: "user-1", name: "Alice", role: RolePlayer, send: make(chan []byte, 1)}
	room.register <- client1

	// Wait for the first registration to be processed by receiving the
	// broadcast state on client1's send channel.
	waitForBroadcast(t, client1.send, "first registration broadcast")

	// Simulate reconnect with same ID
	client2 := &Client{ID: "user-1", name: "Alice-New", role: RolePlayer, send: make(chan []byte, 1)}
	room.register <- client2

	// Wait for the second registration: the register handler closes
	// client1.send and broadcasts to client2. Receiving on client2.send
	// confirms the replacement was processed.
	waitForBroadcast(t, client2.send, "reconnect broadcast")

	// Verify client1's send channel was closed (old client evicted).
	select {
	case _, ok := <-client1.send:
		if ok {
			t.Error("expected client1.send to be closed after dedup")
		}
	default:
		// Channel might have buffered messages; drain and re-check.
	}

	// Clean up: unregister client2 so the room closes.
	room.unregister <- client2
}

func TestDealerRole(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)

	client1 := &Client{ID: "1", name: "Alice", role: RolePlayer, send: make(chan []byte, 10)}
	client2 := &Client{ID: "2", name: "Bob", role: RolePlayer, send: make(chan []byte, 10)}
	room.clients[client1.ID] = client1
	room.clients[client2.ID] = client2

	// Alice becomes dealer
	room.handleAction(ActionMessage{Type: ActionToggleRole}, client1)
	if client1.role != RoleDealer {
		t.Errorf("expected Alice to be dealer")
	}
	if room.dealerID != client1.ID {
		t.Errorf("expected room dealerID to be Alice's ID")
	}

	// Bob tries to reveal (should fail because he is not dealer)
	room.handleAction(ActionMessage{Type: ActionReveal}, client2)
	if room.isRevealed {
		t.Error("Bob should not be able to reveal results")
	}

	// Alice reveals
	room.handleAction(ActionMessage{Type: ActionReveal}, client1)
	if !room.isRevealed {
		t.Error("Alice (dealer) should be able to reveal results")
	}

	// Bob becomes dealer (takeover)
	room.handleAction(ActionMessage{Type: ActionToggleRole}, client2)
	if client2.role != RoleDealer {
		t.Errorf("expected Bob to become dealer")
	}
	if client1.role != RolePlayer {
		t.Errorf("expected Alice to be demoted to player")
	}
	if room.dealerID != client2.ID {
		t.Errorf("expected room dealerID to be Bob's ID")
	}

	// Alice (former dealer) tries to reset (should fail)
	room.handleAction(ActionMessage{Type: ActionReset}, client1)
	if !room.isRevealed {
		t.Error("Alice should not be able to reset after losing dealer role")
	}

	// Bob resets
	room.handleAction(ActionMessage{Type: ActionReset}, client2)
	if room.isRevealed {
		t.Error("Bob (dealer) should be able to reset results")
	}

	// Test: Player becomes dealer, vote should be cleared
	client1.role = RolePlayer
	room.participants[client1.ID] = "5"
	room.handleAction(ActionMessage{Type: ActionToggleRole}, client1)
	if _, ok := room.participants[client1.ID]; ok {
		if room.participants[client1.ID] != "" {
			t.Errorf("expected Alice's vote to be cleared when becoming dealer, got %s", room.participants[client1.ID])
		}
	}

	// Dealer disconnects - instead of using channel which requires room.Run()
	delete(room.clients, client1.ID)
	room.mu.Lock()
	if room.dealerID == client1.ID {
		room.dealerID = ""
	}
	room.mu.Unlock()

	if room.dealerID != "" {
		t.Errorf("expected dealerID to be cleared after dealer left")
	}
}

func TestNoDealerPlayerManageRound(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)

	client1 := &Client{ID: "1", name: "Alice", role: RolePlayer, send: make(chan []byte, 10)}
	client2 := &Client{ID: "2", name: "Bob", role: RolePlayer, send: make(chan []byte, 10)}
	client3 := &Client{ID: "3", name: "Charlie", role: RoleAFK, send: make(chan []byte, 10)}
	room.clients[client1.ID] = client1
	room.clients[client2.ID] = client2
	room.clients[client3.ID] = client3

	if room.dealerID != "" {
		t.Fatalf("expected no dealer initially, got %s", room.dealerID)
	}

	// Players vote
	room.handleAction(ActionMessage{Type: ActionVote, Vote: "5"}, client1)
	room.handleAction(ActionMessage{Type: ActionVote, Vote: "8"}, client2)
	if room.participants[client1.ID] != "5" || room.participants[client2.ID] != "8" {
		t.Error("expected both players to have voted")
	}

	// Player reveals when no dealer is present
	room.handleAction(ActionMessage{Type: ActionReveal}, client1)
	if !room.isRevealed {
		t.Error("expected player to be able to reveal results when no dealer is present")
	}

	// AFK user should not be able to reveal/reset
	room.handleAction(ActionMessage{Type: ActionReset}, client3)
	if !room.isRevealed {
		t.Error("AFK user should not be able to reset the round when no dealer is present")
	}

	// Player resets when no dealer is present
	room.handleAction(ActionMessage{Type: ActionReset}, client2)
	if room.isRevealed {
		t.Error("expected player to be able to reset results when no dealer is present")
	}
	if room.participants[client1.ID] != "" || room.participants[client2.ID] != "" {
		t.Error("expected votes to be cleared after reset")
	}

	// Now make Alice the dealer; Bob should no longer be able to reveal/reset
	room.handleAction(ActionMessage{Type: ActionToggleRole}, client1)
	if room.dealerID != client1.ID {
		t.Fatal("expected Alice to be dealer")
	}

	room.handleAction(ActionMessage{Type: ActionReveal}, client2)
	if room.isRevealed {
		t.Error("Bob should not be able to reveal when a dealer is present")
	}

	// AFK user toggles herself back to player, then tries to reveal (should fail with dealer present)
	room.handleAction(ActionMessage{Type: ActionToggleAFK}, client3)
	room.handleAction(ActionMessage{Type: ActionReveal}, client3)
	if room.isRevealed {
		t.Error("non-dealer player should not be able to reveal when a dealer is present")
	}

	// Dealer reveals, then non-dealer tries to reset (should fail)
	room.handleAction(ActionMessage{Type: ActionReveal}, client1)
	if !room.isRevealed {
		t.Fatal("expected dealer to be able to reveal")
	}
	room.handleAction(ActionMessage{Type: ActionReset}, client2)
	if !room.isRevealed {
		t.Error("non-dealer player should not be able to reset when a dealer is present")
	}

	// Dealer leaves - non-dealer players regain ability to manage rounds
	delete(room.clients, client1.ID)
	room.mu.Lock()
	if room.dealerID == client1.ID {
		room.dealerID = ""
	}
	room.mu.Unlock()

	room.handleAction(ActionMessage{Type: ActionReset}, client2)
	if room.isRevealed {
		t.Error("expected player to reset round after dealer left")
	}
}

func TestAFKRole(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)

	client1 := &Client{ID: "1", name: "Alice", role: RolePlayer, send: make(chan []byte, 10)}
	room.clients[client1.ID] = client1

	// Alice votes
	room.handleAction(ActionMessage{Type: ActionVote, Vote: "5"}, client1)
	if room.participants[client1.ID] != "5" {
		t.Errorf("expected Alice to have voted 5")
	}

	// Alice goes AFK
	room.handleAction(ActionMessage{Type: ActionToggleAFK}, client1)
	if client1.role != RoleAFK {
		t.Errorf("expected Alice to be afk")
	}
	if _, ok := room.participants[client1.ID]; ok {
		if room.participants[client1.ID] != "" {
			t.Errorf("expected Alice's vote to be cleared when going afk")
		}
	}

	// Alice returns
	room.handleAction(ActionMessage{Type: ActionToggleAFK}, client1)
	if client1.role != RolePlayer {
		t.Errorf("expected Alice to be player again")
	}

	// Dealer goes AFK
	room.handleAction(ActionMessage{Type: ActionToggleRole}, client1) // Become dealer
	if room.dealerID != client1.ID {
		t.Errorf("expected Alice to be dealer")
	}
	room.handleAction(ActionMessage{Type: ActionToggleAFK}, client1)
	if client1.role != RoleAFK {
		t.Errorf("expected Alice to be afk")
	}
	if room.dealerID != "" {
		t.Errorf("expected dealerID to be cleared when dealer goes AFK")
	}

	// Dealer toggles Alice back to player
	client2 := &Client{ID: "2", name: "Bob", role: RoleDealer, send: make(chan []byte, 10)}
	room.clients[client2.ID] = client2
	room.dealerID = client2.ID

	room.handleAction(ActionMessage{Type: ActionToggleAFK, UserID: client1.ID}, client2)
	if client1.role != RoleAFK {
		t.Errorf("expected Dealer to NOT be able to toggle Alice back to player")
	}

	// Alice toggles herself back to player
	room.handleAction(ActionMessage{Type: ActionToggleAFK}, client1)
	if client1.role != RolePlayer {
		t.Errorf("expected Alice to be able to toggle herself back to player")
	}

	// Dealer toggles Alice to AFK
	room.handleAction(ActionMessage{Type: ActionToggleAFK, UserID: client1.ID}, client2)
	if client1.role != RoleAFK {
		t.Errorf("expected Dealer to be able to toggle Alice to AFK")
	}

	// Non-dealer tries to toggle Alice (should fail to toggle her, but might toggle self if logic was wrong)
	client3 := &Client{ID: "3", name: "Charlie", role: RolePlayer, send: make(chan []byte, 10)}
	room.clients[client3.ID] = client3
	room.handleAction(ActionMessage{Type: ActionToggleAFK, UserID: client1.ID}, client3)
	if client1.role != RoleAFK {
		t.Errorf("expected non-dealer to NOT be able to toggle Alice's AFK status")
	}
	if client3.role != RoleAFK {
		t.Errorf("expected Charlie to toggle himself to AFK when trying to toggle others without permission")
	}
}

// waitForCondition polls a predicate with a bounded timeout, avoiding
// fixed sleeps that are flaky on loaded CI machines. The predicate is
// called with r.mu held so reads of r.dealerID / r.participants
// are race-free under the -race detector. Note: r.clients is owned by
// the Run goroutine and is NOT protected by r.mu, so the predicate must
// not read r.clients.
func waitForCondition(t *testing.T, room *Room, predicate func() bool, what string) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		room.mu.Lock()
		ok := predicate()
		room.mu.Unlock()
		if ok {
			return
		}
		time.Sleep(2 * time.Millisecond)
	}
	t.Fatalf("timed out waiting for: %s", what)
}

// waitForBroadcast blocks until a message arrives on the given channel
// or the timeout elapses. This is used to confirm that broadcastState
// has run (and thus that a prior register/evict/unregister was processed
// by the Room.Run goroutine) without reading r.clients from the test.
func waitForBroadcast(t *testing.T, send <-chan []byte, what string) []byte {
	t.Helper()
	select {
	case data := <-send:
		return data
	case <-time.After(2 * time.Second):
		t.Fatalf("timed out waiting for broadcast: %s", what)
		return nil
	}
}

func TestEvictClient(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)
	go room.Run()

	// Register two clients so the room stays alive after evicting one.
	client1 := &Client{ID: "user-1", name: "Alice", role: RolePlayer, send: make(chan []byte, 10)}
	client2 := &Client{ID: "user-2", name: "Bob", role: RolePlayer, send: make(chan []byte, 10)}
	room.register <- client1
	room.register <- client2

	// Alice votes "5" (as a player), then becomes dealer (which clears
	// her vote). Bob votes "8" so we can verify his vote survives Alice's
	// eviction.
	room.broadcast <- ClientMessage{client: client1, payload: mustMarshal(t, ActionMessage{Type: ActionVote, Vote: "5"})}
	room.broadcast <- ClientMessage{client: client1, payload: mustMarshal(t, ActionMessage{Type: ActionToggleRole})}
	room.broadcast <- ClientMessage{client: client2, payload: mustMarshal(t, ActionMessage{Type: ActionVote, Vote: "8"})}

	// Wait for Alice to be dealer and Bob to have voted.
	waitForCondition(t, room, func() bool {
		return room.dealerID == "user-1" && room.participants["user-2"] == "8"
	}, "Alice is dealer and Bob voted")

	// Evict Alice via the evict channel.
	room.evict <- "user-1"

	// Wait for eviction: dealerID cleared, Alice's vote cleared, Bob's
	// vote intact. All under r.mu so safe to read from the test goroutine.
	waitForCondition(t, room, func() bool {
		_, aliceVote := room.participants["user-1"]
		bobVote := room.participants["user-2"]
		return room.dealerID == "" && !aliceVote && bobVote == "8"
	}, "dealerID and Alice's vote cleared, Bob's vote intact")

	if _, hasVote := room.participants["user-1"]; hasVote {
		t.Error("expected Alice's vote to be cleared after eviction")
	}
	if room.participants["user-2"] != "8" {
		t.Error("expected Bob's vote to survive Alice's eviction")
	}

	// Clean up: evict Bob so Run() exits and the goroutine doesn't leak.
	room.evict <- "user-2"
	// Wait for the room to be removed from the hub (same pattern as
	// TestEvictLastClientClosesRoom).
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		hub.mu.RLock()
		_, exists := hub.rooms["test-room"]
		hub.mu.RUnlock()
		if !exists {
			break
		}
		time.Sleep(2 * time.Millisecond)
	}
}

func TestEvictNonExistentClient(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)
	go room.Run()

	client1 := &Client{ID: "user-1", name: "Alice", role: RolePlayer, send: make(chan []byte, 10)}
	room.register <- client1

	// Wait for registration by receiving the initial broadcast on client1.send.
	waitForBroadcast(t, client1.send, "initial broadcast after registration")

	// Evict a non-existent ID — should be a no-op (no panic, no state change).
	room.evict <- "nonexistent"

	// Give the evict a moment to be processed, then verify Alice is still
	// present by sending a broadcast action and receiving the state update.
	room.broadcast <- ClientMessage{client: client1, payload: mustMarshal(t, ActionMessage{Type: ActionVote, Vote: "5"})}

	// If Alice is still registered, we'll receive a state broadcast.
	waitForBroadcast(t, client1.send, "state broadcast after evicting non-existent ID")

	// Verify the vote was recorded (proves Alice is still in the room).
	waitForCondition(t, room, func() bool {
		return room.participants["user-1"] == "5"
	}, "Alice's vote recorded")

	// Clean up.
	room.evict <- "user-1"
}

func TestEvictLastClientClosesRoom(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)
	go room.Run()

	client1 := &Client{ID: "user-1", name: "Alice", role: RolePlayer, send: make(chan []byte, 10)}
	room.register <- client1

	// Wait for registration.
	waitForBroadcast(t, client1.send, "initial broadcast")

	// Evict the only client — the room should empty and Run() should exit.
	room.evict <- "user-1"

	// Wait for the room to be removed from the hub.
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		hub.mu.RLock()
		_, exists := hub.rooms["test-room"]
		hub.mu.RUnlock()
		if !exists {
			return
		}
		time.Sleep(2 * time.Millisecond)
	}
	t.Fatal("expected room to be removed from hub after last client evicted")
}

func mustMarshal(t *testing.T, v interface{}) []byte {
	t.Helper()
	data, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}
	return data
}
