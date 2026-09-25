package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/gorilla/websocket"
)

// serveWsRejection calls serveWs against a plain HTTP recorder and returns
// the response. Non-upgradable requests (missing params, oversized room
// name) are rejected before the upgrade, so no websocket machinery is
// involved.
func serveWsRejection(t *testing.T, query url.Values) *httptest.ResponseRecorder {
	t.Helper()

	hub := NewHub()
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r, "*")
	})

	req := httptest.NewRequest(http.MethodGet, "/ws?"+query.Encode(), nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	return rec
}

func TestServeWsMissingParams(t *testing.T) {
	cases := []struct {
		name  string
		query url.Values
	}{
		{"missing both", url.Values{}},
		{"missing room", url.Values{"name": {"Alice"}}},
		{"missing name", url.Values{"room": {"test-room"}}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := serveWsRejection(t, tc.query)
			if rec.Code != http.StatusBadRequest {
				t.Errorf("expected 400, got %d", rec.Code)
			}
		})
	}
}

func TestServeWsRoomNameTooLong(t *testing.T) {
	long := strings.Repeat("a", MaxRoomNameLength+1)
	rec := serveWsRejection(t, url.Values{"room": {long}, "name": {"Alice"}})
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for a %d-character room name, got %d", len(long), rec.Code)
	}
}

func TestServeWsRoomNameAtLimitAccepted(t *testing.T) {
	hub := NewHub()
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r, "*")
	}))
	defer ts.Close()

	query := url.Values{"room": {strings.Repeat("a", MaxRoomNameLength)}, "name": {"Alice"}}
	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http") + "/ws?" + query.Encode()
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("expected a %d-character room name to be accepted, dial failed: %v", MaxRoomNameLength, err)
	}
	defer conn.Close()

	// The upgrade must be followed by a WELCOME message.
	_, msg, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("failed to read welcome message: %v", err)
	}
	var welcome WelcomeMessage
	if err := json.Unmarshal(msg, &welcome); err != nil {
		t.Fatalf("failed to unmarshal welcome message: %v", err)
	}
	if welcome.Type != MessageTypeWelcome || welcome.ID == "" {
		t.Errorf("expected WELCOME with an ID, got %+v", welcome)
	}
}
