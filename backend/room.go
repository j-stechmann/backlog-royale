package main

import (
	"encoding/json"
	"fmt"
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
	participants map[string]string // Name -> Vote
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
	Name     string `json:"name"`
	HasVoted bool   `json:"hasVoted"`
	Vote     string `json:"vote,omitempty"`
}

func (r *Room) Run() {
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
				delete(r.participants, client.name)
				r.mu.Unlock()
				r.broadcastState()
			}
			if len(r.clients) == 0 {
				r.hub.RemoveRoom(r.ID)
				return
			}
		case message := <-r.broadcast:
			var msg map[string]interface{}
			if err := json.Unmarshal(message.payload, &msg); err != nil {
				fmt.Printf("error: %v\n", err)
				continue
			}

			action, ok := msg["type"].(string)
			if !ok {
				continue
			}

			r.handleAction(action, msg, message.client)
		}
	}
}

func (r *Room) handleAction(action string, msg map[string]interface{}, client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	switch action {
	case "VOTE":
		vote, _ := msg["vote"].(string)
		if allowedVotes[vote] {
			r.participants[client.name] = vote
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
		vote := r.participants[client.name]
		users = append(users, User{
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

	data, _ := json.Marshal(state)
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
