package main

import (
	"log/slog"
	"sync"
)

// Hub maintains the set of active rooms and a global index of client
// connections by ID. The index is used to evict a client's previous
// connection from any room when it reconnects (e.g. when switching
// rooms), ensuring clean room transitions even if the old WebSocket
// has not fully closed yet.
type Hub struct {
	rooms map[string]*Room
	mu    sync.RWMutex

	index  map[string]*Room
	idxMu  sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		rooms: make(map[string]*Room),
		index: make(map[string]*Room),
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

// Associate records that a client with the given ID currently belongs
// to room. Called from the Room.register handler.
func (h *Hub) Associate(id string, room *Room) {
	h.idxMu.Lock()
	h.index[id] = room
	h.idxMu.Unlock()
}

// Disassociate removes a client ID from the global index. Called
// whenever a client is removed from a room (unregister, evict, or the
// broadcastStateLocked slow-client default path).
func (h *Hub) Disassociate(id string) {
	h.idxMu.Lock()
	delete(h.index, id)
	h.idxMu.Unlock()
}

// EvictClient removes the client with the given ID from whichever room
// it is currently in (if any). The actual removal is performed by the
// owning Room's Run goroutine via its evict channel, so no cross-
// goroutine mutation of r.clients occurs. The send is non-blocking so
// that EvictClient never waits on a room that may be busy or exiting.
func (h *Hub) EvictClient(id string) {
	h.idxMu.Lock()
	room, ok := h.index[id]
	h.idxMu.Unlock()

	if !ok {
		return
	}

	select {
	case room.evict <- id:
	default:
		slog.Warn("evict channel full, dropping eviction", "client", id, "room", room.ID)
	}
}
