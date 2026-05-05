package main

import (
	"encoding/json"
	"log/slog"
	"sort"
	"strings"
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
	clients      map[string]*Client // Changed from map[*Client]bool to map[string]*Client
	broadcast    chan ClientMessage
	register     chan *Client
	unregister   chan *Client
	hub          *Hub
	mu           sync.Mutex
	isRevealed   bool
	participants map[string]string // ID -> Vote
	dealerID     string
}

func NewRoom(id string, hub *Hub) *Room {
	return &Room{
		ID:           id,
		clients:      make(map[string]*Client),
		broadcast:    make(chan ClientMessage),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		hub:          hub,
		participants: make(map[string]string),
	}
}

type RoomState struct {
	Type     string `json:"type"`
	ID       string `json:"id"`
	Users    []User `json:"users"`
	Reveal   bool   `json:"reveal"`
	DealerID string `json:"dealerId"`
}

type User struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	HasVoted bool   `json:"hasVoted"`
	Vote     string `json:"vote,omitempty"`
	Role     string `json:"role"`
}

func (r *Room) Run() {
	slog.Info("Room started", "id", r.ID)
	for {
		select {
		case client := <-r.register:
			// If client with same ID already exists, close the old one
			if oldClient, ok := r.clients[client.ID]; ok {
				close(oldClient.send)
				if oldClient.conn != nil {
					oldClient.conn.Close()
				}
			}
			r.clients[client.ID] = client
			r.broadcastState()
		case client := <-r.unregister:
			if current, ok := r.clients[client.ID]; ok && current == client {
				delete(r.clients, client.ID)
				close(client.send)
				r.mu.Lock()
				delete(r.participants, client.ID)
				if r.dealerID == client.ID {
					r.dealerID = ""
				}
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
		if client.role == "player" && allowedVotes[action.Vote] {
			r.participants[client.ID] = action.Vote
		}
	case "REVEAL":
		if client.ID == r.dealerID {
			r.isRevealed = true
		}
	case "RESET":
		if client.ID == r.dealerID {
			r.isRevealed = false
			for k := range r.participants {
				r.participants[k] = ""
			}
		}
	case "TOGGLE_ROLE":
		if client.role == "dealer" {
			client.role = "player"
			r.dealerID = ""
		} else {
			// If there's already a dealer, they become a player
			if r.dealerID != "" {
				if oldDealer, ok := r.clients[r.dealerID]; ok {
					oldDealer.role = "player"
				}
			}
			client.role = "dealer"
			r.dealerID = client.ID
			delete(r.participants, client.ID) // Dealer doesn't vote
		}
	case "TOGGLE_AFK":
		if client.role == "afk" {
			client.role = "player"
		} else {
			if client.role == "dealer" {
				r.dealerID = ""
			}
			client.role = "afk"
			delete(r.participants, client.ID)
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
	for _, client := range r.clients {
		vote := r.participants[client.ID]
		users = append(users, User{
			ID:       client.ID,
			Name:     client.name,
			HasVoted: vote != "",
			Vote:     r.getVisibleVote(vote),
			Role:     client.role,
		})
	}

	sort.Slice(users, func(i, j int) bool {
		return strings.ToLower(users[i].Name) < strings.ToLower(users[j].Name)
	})

	state := RoomState{
		Type:     "STATE",
		ID:       r.ID,
		Users:    users,
		Reveal:   r.isRevealed,
		DealerID: r.dealerID,
	}

	data, err := json.Marshal(state)
	if err != nil {
		slog.Error("failed to marshal state", "error", err)
		return
	}

	for id, client := range r.clients {
		select {
		case client.send <- data:
		default:
			close(client.send)
			delete(r.clients, id)
		}
	}
}

func (r *Room) getVisibleVote(vote string) string {
	if r.isRevealed {
		return vote
	}
	return ""
}
