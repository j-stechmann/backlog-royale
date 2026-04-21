package main

import (
	"log/slog"
	"sync"
)

// Hub maintains the set of active rooms.
type Hub struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		rooms: make(map[string]*Room),
	}
}

func (h *Hub) GetOrCreateRoom(id string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()

	if room, ok := h.rooms[id]; ok {
		return room
	}

	slog.Info("Creating new room", "id", id)
	room := NewRoom(id, h)
	h.rooms[id] = room
	go room.Run()
	return room
}

func (h *Hub) RemoveRoom(id string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	slog.Info("Removing room", "id", id)
	delete(h.rooms, id)
}
