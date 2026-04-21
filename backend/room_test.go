package main

import (
	"testing"
)

func TestRoomVoting(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)

	client1 := &Client{name: "Alice", send: make(chan []byte, 1)}
	client2 := &Client{name: "Bob", send: make(chan []byte, 1)}

	room.clients[client1] = true
	room.clients[client2] = true

	// Test VOTE
	room.handleAction(ActionMessage{Type: "VOTE", Vote: "5"}, client1)
	if room.participants["Alice"] != "5" {
		t.Errorf("expected Alice to have voted 5, got %s", room.participants["Alice"])
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
	if room.participants["Alice"] != "" {
		t.Error("expected Alice's vote to be cleared after reset")
	}
}

func TestAllowedVotes(t *testing.T) {
	hub := NewHub()
	room := NewRoom("test-room", hub)
	client := &Client{name: "Alice", send: make(chan []byte, 1)}
	room.clients[client] = true

	// Valid vote
	room.handleAction(ActionMessage{Type: "VOTE", Vote: "13"}, client)
	if room.participants["Alice"] != "13" {
		t.Errorf("expected vote 13 to be accepted")
	}

	// Invalid vote
	room.handleAction(ActionMessage{Type: "VOTE", Vote: "100"}, client)
	if room.participants["Alice"] != "13" {
		t.Errorf("expected invalid vote 100 to be ignored, kept 13")
	}
}
