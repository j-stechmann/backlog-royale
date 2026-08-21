package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"golang.org/x/time/rate"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
	// Rate limiting: 10 messages per second with a burst of 20
	messageRate  = 10
	messageBurst = 20
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Client struct {
	ID          string
	room        *Room
	conn        *websocket.Conn
	send        chan []byte
	name        string
	role        string
	rateLimiter *rate.Limiter
}

func (c *Client) readPump() {
	defer func() {
		select {
		case c.room.unregister <- c:
		default:
		}
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Error("read error", "error", err)
			}
			break
		}

		if !c.rateLimiter.Allow() {
			slog.Warn("Rate limit exceeded", "client", c.name, "id", c.ID)
			continue
		}

		select {
		case c.room.broadcast <- ClientMessage{client: c, payload: message}:
		default:
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func generateID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}

func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request, allowedOrigin string) {
	roomID := r.URL.Query().Get("room")
	name := r.URL.Query().Get("name")
	prevID := r.URL.Query().Get("prevId")

	if roomID == "" || name == "" {
		http.Error(w, "Missing room or name", http.StatusBadRequest)
		return
	}

	// Always generate ID server-side to prevent impersonation
	id := generateID()

	upgrader.CheckOrigin = func(r *http.Request) bool {
		if allowedOrigin == "*" {
			return true
		}
		origin := r.Header.Get("Origin")
		if origin == "" {
			return false
		}
		// Strict origin check
		return strings.EqualFold(origin, allowedOrigin)
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("upgrade error", "error", err)
		return
	}

	room := hub.GetOrCreateRoom(roomID)
	client := &Client{
		ID:          id,
		room:        room,
		conn:        conn,
		send:        make(chan []byte, 256),
		name:        name,
		role:        RolePlayer,
		rateLimiter: rate.NewLimiter(rate.Limit(messageRate), messageBurst),
	}

	select {
	case client.room.register <- client:
	default:
		slog.Warn("room register channel full, closing connection", "room", roomID)
		conn.Close()
		return
	}

	// Send welcome message with the generated ID
	welcome, _ := json.Marshal(WelcomeMessage{Type: MessageTypeWelcome, ID: id})
	client.send <- welcome

	// Evict the client's previous connection (if any) after the new
	// connection is registered. This ensures clean room transitions:
	// the old connection is removed from whichever room it was in
	// without emptying the target room's Run goroutine before the
	// new client is established.
	if prevID != "" {
		hub.EvictClient(prevID)
	}

	go client.writePump()
	go client.readPump()
}
