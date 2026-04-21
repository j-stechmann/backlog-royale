package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"
)

type Config struct {
	Port          string
	AllowedOrigin string
}

func loadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	origin := os.Getenv("ALLOWED_ORIGIN")
	if origin == "" {
		origin = "*" // Default for dev, should be restricted in prod
	}

	return Config{
		Port:          port,
		AllowedOrigin: origin,
	}
}

func main() {
	config := loadConfig()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	hub := NewHub()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r, config.AllowedOrigin)
	})

	slog.Info("Server starting", "port", config.Port)
	server := &http.Server{
		Addr:              ":" + config.Port,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	err := server.ListenAndServe()
	if err != nil {
		slog.Error("ListenAndServe failed", "error", err)
		os.Exit(1)
	}
}
