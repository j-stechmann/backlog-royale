package main

import (
	"testing"
	"time"
)

func TestRoomVoting(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)

	client1 := &Client{ID: "1", name: "Alice", send: make(chan []byte, 1)}
	client2 := &Client{ID: "2", name: "Bob", send: make(chan []byte, 1)}

	room.clients[client1.ID] = client1
	room.clients[client2.ID] = client2

	// Test VOTE
	room.handleAction(ActionMessage{Type: "VOTE", Vote: "5"}, client1)
	if room.participants[client1.ID] != "5" {
		t.Errorf("expected Alice to have voted 5, got %s", room.participants[client1.ID])
	}

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

	client1 := &Client{ID: "1", name: "Alice", send: make(chan []byte, 1)}
	client2 := &Client{ID: "2", name: "Alice", send: make(chan []byte, 1)}

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
	client := &Client{ID: "1", name: "Alice", send: make(chan []byte, 1)}
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
	client1 := &Client{ID: "user-1", name: "Alice", send: make(chan []byte, 1)}
	room.register <- client1

	// Simulate reconnect with same ID
	client2 := &Client{ID: "user-1", name: "Alice-New", send: make(chan []byte, 1)}
	room.register <- client2

	// Give it a moment to process the channel
	time.Sleep(10 * time.Millisecond)

	if room.clients["user-1"] != client2 {
		t.Errorf("expected client2 to replace client1")
	}
}
