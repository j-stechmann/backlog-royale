# Build stage
FROM golang:1.26.1-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o backlog-server .

# Final stage
FROM alpine:latest

WORKDIR /root/

# Copy the binary from the builder stage
COPY --from=builder /app/backlog-server .

# Expose port (adjust if necessary, checking main.go for port)
EXPOSE 8080

CMD ["./backlog-server"]
