# Build stage
FROM golang:1.27.0-alpine3.23 AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o backlog-server .

# Final stage
FROM alpine:3.24.1

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/backlog-server .

# Drop privileges: run as unprivileged user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port (adjust if necessary, checking main.go for port)
EXPOSE 8080

CMD ["./backlog-server"]
