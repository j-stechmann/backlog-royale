package main

import (
	"encoding/json"
	"log/slog"
	"sync"
)

var allowedVotes = map[string]bool{
	"1":  true,
	"2":  true,
	"3":  true,
	"5":  true,
	"8":  true,
	"13": true,
	"21": true,
	"?":  true,
}

type ActionMessage struct {
	Type string `json:"type"`
	Vote string `json:"vote,omitempty"`
}

type ClientMessage struct {
	client  *Client
	payload []byte
}

type Room struct {
	ID           string
	clients      map[*Client]bool
	broadcast    chan ClientMessage
	register     chan *Client
	unregister   chan *Client
	hub          *Hub
	mu           sync.Mutex
	isRevealed   bool
	participants map[string]string // ID -> Vote
}

func NewRoom(id string, hub *Hub) *Room {
	return &Room{
		ID:           id,
		clients:      make(map[*Client]bool),
		broadcast:    make(chan ClientMessage),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		hub:          hub,
		participants: make(map[string]string),
	}
}

type RoomState struct {
	Type   string `json:"type"`
	ID     string `json:"id"`
	Users  []User `json:"users"`
	Reveal bool   `json:"reveal"`
}

type User struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	HasVoted bool   `json:"hasVoted"`
	Vote     string `json:"vote,omitempty"`
}

func (r *Room) Run() {
	slog.Info("Room started", "id", r.ID)
	for {
		select {
		case client := <-r.register:
			r.clients[client] = true
			r.broadcastState()
		case client := <-r.unregister:
			if _, ok := r.clients[client]; ok {
				delete(r.clients, client)
				close(client.send)
				r.mu.Lock()
				delete(r.participants, client.ID)
				r.mu.Unlock()
				r.broadcastState()
			}
		case message := <-r.broadcast:
			var action ActionMessage
			if err := json.Unmarshal(message.payload, &action); err != nil {
				slog.Warn("failed to unmarshal action", "error", err, "payload", string(message.payload))
				continue
			}

			r.handleAction(action, message.client)
		}

		if len(r.clients) == 0 {
			slog.Info("Room closing", "id", r.ID)
			r.hub.RemoveRoom(r.ID)
			return
		}
	}
}

func (r *Room) handleAction(action ActionMessage, client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	slog.Debug("Handling action", "room", r.ID, "type", action.Type, "user", client.name, "id", client.ID)

	switch action.Type {
	case "VOTE":
		if allowedVotes[action.Vote] {
			r.participants[client.ID] = action.Vote
		}
	case "REVEAL":
		r.isRevealed = true
	case "RESET":
		r.isRevealed = false
		for k := range r.participants {
			r.participants[k] = ""
		}
	}
	r.broadcastStateLocked()
}

func (r *Room) broadcastState() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.broadcastStateLocked()
}

func (r *Room) broadcastStateLocked() {
	var users []User
	for client := range r.clients {
		vote := r.participants[client.ID]
		users = append(users, User{
			ID:       client.ID,
			Name:     client.name,
			HasVoted: vote != "",
			Vote:     r.getVisibleVote(vote),
		})
	}

	state := RoomState{
		Type:   "STATE",
		ID:     r.ID,
		Users:  users,
		Reveal: r.isRevealed,
	}

	data, err := json.Marshal(state)
	if err != nil {
		slog.Error("failed to marshal state", "error", err)
		return
	}

	for client := range r.clients {
		select {
		case client.send <- data:
		default:
			close(client.send)
			delete(r.clients, client)
		}
	}
}

func (r *Room) getVisibleVote(vote string) string {
	if r.isRevealed {
		return vote
	}
	return ""
}
