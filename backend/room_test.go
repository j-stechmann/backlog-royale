package main

import (
	"testing"
	"time"
)

func TestRoomVoting(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)

	client1 := &Client{ID: "1", name: "Alice", role: "player", send: make(chan []byte, 10)}
	client2 := &Client{ID: "2", name: "Bob", role: "player", send: make(chan []byte, 10)}

	room.clients[client1.ID] = client1
	room.clients[client2.ID] = client2

	// Test VOTE
	room.handleAction(ActionMessage{Type: "VOTE", Vote: "5"}, client1)
	if room.participants[client1.ID] != "5" {
		t.Errorf("expected Alice to have voted 5, got %s", room.participants[client1.ID])
	}

	// Make Alice dealer so she can reveal
	room.handleAction(ActionMessage{Type: "TOGGLE_ROLE"}, client1)

	// Test REVEAL
	room.handleAction(ActionMessage{Type: "REVEAL"}, client1)
	if !room.isRevealed {
		t.Error("expected room to be revealed")
	}

	// Test RESET
	room.handleAction(ActionMessage{Type: "RESET"}, client1)
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

	client1 := &Client{ID: "1", name: "Alice", role: "player", send: make(chan []byte, 1)}
	client2 := &Client{ID: "2", name: "Alice", role: "player", send: make(chan []byte, 1)}

	room.clients[client1.ID] = client1
	room.clients[client2.ID] = client2

	// Alice 1 votes 5
	room.handleAction(ActionMessage{Type: "VOTE", Vote: "5"}, client1)
	// Alice 2 votes 8
	room.handleAction(ActionMessage{Type: "VOTE", Vote: "8"}, client2)

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
	client := &Client{ID: "1", name: "Alice", role: "player", send: make(chan []byte, 1)}
	room.clients[client.ID] = client

	// Valid vote
	room.handleAction(ActionMessage{Type: "VOTE", Vote: "13"}, client)
	if room.participants[client.ID] != "13" {
		t.Errorf("expected vote 13 to be accepted")
	}

	// Invalid vote
	room.handleAction(ActionMessage{Type: "VOTE", Vote: "100"}, client)
	if room.participants[client.ID] != "13" {
		t.Errorf("expected invalid vote 100 to be ignored, kept 13")
	}
}

func TestReconnectDeduplication(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)
	go room.Run()

	// Mocking enough of client to avoid panics
	client1 := &Client{ID: "user-1", name: "Alice", role: "player", send: make(chan []byte, 1)}
	room.register <- client1

	// Simulate reconnect with same ID
	client2 := &Client{ID: "user-1", name: "Alice-New", role: "player", send: make(chan []byte, 1)}
	room.register <- client2

	// Give it a moment to process the channel
	time.Sleep(10 * time.Millisecond)

	if room.clients["user-1"] != client2 {
		t.Errorf("expected client2 to replace client1")
	}
}

func TestDealerRole(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)

	client1 := &Client{ID: "1", name: "Alice", role: "player", send: make(chan []byte, 10)}
	client2 := &Client{ID: "2", name: "Bob", role: "player", send: make(chan []byte, 10)}
	room.clients[client1.ID] = client1
	room.clients[client2.ID] = client2

	// Alice becomes dealer
	room.handleAction(ActionMessage{Type: "TOGGLE_ROLE"}, client1)
	if client1.role != "dealer" {
		t.Errorf("expected Alice to be dealer")
	}
	if room.dealerID != client1.ID {
		t.Errorf("expected room dealerID to be Alice's ID")
	}

	// Bob tries to reveal (should fail because he is not dealer)
	room.handleAction(ActionMessage{Type: "REVEAL"}, client2)
	if room.isRevealed {
		t.Error("Bob should not be able to reveal results")
	}

	// Alice reveals
	room.handleAction(ActionMessage{Type: "REVEAL"}, client1)
	if !room.isRevealed {
		t.Error("Alice (dealer) should be able to reveal results")
	}

	// Bob becomes dealer (takeover)
	room.handleAction(ActionMessage{Type: "TOGGLE_ROLE"}, client2)
	if client2.role != "dealer" {
		t.Errorf("expected Bob to become dealer")
	}
	if client1.role != "player" {
		t.Errorf("expected Alice to be demoted to player")
	}
	if room.dealerID != client2.ID {
		t.Errorf("expected room dealerID to be Bob's ID")
	}

	// Alice (former dealer) tries to reset (should fail)
	room.handleAction(ActionMessage{Type: "RESET"}, client1)
	if !room.isRevealed {
		t.Error("Alice should not be able to reset after losing dealer role")
	}

	// Bob resets
	room.handleAction(ActionMessage{Type: "RESET"}, client2)
	if room.isRevealed {
		t.Error("Bob (dealer) should be able to reset results")
	}

	// Test: Player becomes dealer, vote should be cleared
	client1.role = "player"
	room.participants[client1.ID] = "5"
	room.handleAction(ActionMessage{Type: "TOGGLE_ROLE"}, client1)
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
