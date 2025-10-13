package server

import (
	"context"
	"errors"
	"net"
	"net/http"

	"google.golang.org/grpc"
)

type muxTarget interface {
	Address() string
	Serve(l net.Listener) error
	Shutdown(ctx context.Context) error
}

type httpServeTarget struct {
	*http.Server
}

func (h httpServeTarget) Address() string { return h.Addr }

func (h httpServeTarget) Serve(l net.Listener) error {
	if err := h.Server.Serve(l); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

type gRPCServeTarget struct {
	*grpc.Server

	addr string
}

func (g gRPCServeTarget) Address() string { return g.addr }

func (g gRPCServeTarget) Shutdown(ctx context.Context) error {
	signal := make(chan struct{})
	go func() {
		g.GracefulStop()
		close(signal)
	}()

	select {
	case <-ctx.Done():
		g.Stop()
		return errors.New("graceful stop failed")

	case <-signal:
	}

	return nil
}
