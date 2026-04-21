package main

import (
	"crypto/rand"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Client struct {
	ID   string
	room *Room
	conn *websocket.Conn
	send chan []byte
	name string
}

func (c *Client) readPump() {
	defer func() {
		c.room.unregister <- c
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
		c.room.broadcast <- ClientMessage{client: c, payload: message}
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
	id := r.URL.Query().Get("id")
	if roomID == "" || name == "" {
		http.Error(w, "Missing room or name", http.StatusBadRequest)
		return
	}

	if id == "" {
		id = generateID()
	}

	upgrader.CheckOrigin = func(r *http.Request) bool {
		if allowedOrigin == "*" {
			return true
		}
		return r.Header.Get("Origin") == allowedOrigin
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("upgrade error", "error", err)
		return
	}

	room := hub.GetOrCreateRoom(roomID)
	client := &Client{ID: id, room: room, conn: conn, send: make(chan []byte, 256), name: name}
	client.room.register <- client

	go client.writePump()
	go client.readPump()
}
