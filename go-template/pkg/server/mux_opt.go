package server

import (
	"net/http"
	"time"

	"google.golang.org/grpc"
)

// Option values can be used with Serve() for customisation.
type Option func(m *muxServer) error

// WithHTTPTarget adds an HTTP server target to the mux. Multiple HTTP targets
// can be added to the mux.
func WithHTTPTarget(addr string, srv *http.Server) Option {
	srv.Addr = addr
	return func(m *muxServer) error {
		m.targets = append(m.targets, httpServeTarget{Server: srv})
		return nil
	}
}

// WithGRPCTarget adds a gRPC server target to the mux. Multiple gRPC targets
// can be added to the mux.
func WithGRPCTarget(addr string, srv *grpc.Server) Option {
	return func(m *muxServer) error {
		m.targets = append(m.targets, gRPCServeTarget{
			addr:   addr,
			Server: srv,
		})
		return nil
	}
}

// WithGracePeriod sets the wait duration for graceful shutdown. If the duration
// is zero or less, the default grace period of 10 seconds is used.
func WithGracePeriod(d time.Duration) Option {
	return func(m *muxServer) error {
		if d <= 0 {
			d = defaultGracePeriod
		}
		m.gracePeriod = d
		return nil
	}
}
