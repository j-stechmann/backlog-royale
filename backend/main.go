package main

import (
	"log/slog"
	"net"
	"net/http"
	"os"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type Config struct {
	Port          string
	AllowedOrigin string
}

var (
	ipLimiters sync.Map
)

func getIPLimiter(ip string) *rate.Limiter {
	if l, ok := ipLimiters.Load(ip); ok {
		return l.(*rate.Limiter)
	}
	l := rate.NewLimiter(rate.Every(time.Second), 10) // 1 request per second, burst of 10
	ipLimiters.Store(ip, l)
	return l
}

func securityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Rate limiting by IP
		ip, _, _ := net.SplitHostPort(r.RemoteAddr)
		limiter := getIPLimiter(ip)
		if !limiter.Allow() {
			http.Error(w, "Too many requests", http.StatusTooManyRequests)
			return
		}

		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; connect-src 'self' ws: wss:;")

		next.ServeHTTP(w, r)
	})
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

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r, config.AllowedOrigin)
	})

	slog.Info("Server starting", "port", config.Port)
	server := &http.Server{
		Addr:              ":" + config.Port,
		Handler:           securityMiddleware(mux),
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
