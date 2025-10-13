package server

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"
)

const defaultGracePeriod = 10 * time.Second

// Serve starts TCP listeners and serves targets registered and blocks until
// the servers exits. Context can be cancelled to perform graceful shutdown.
func Serve(ctx context.Context, opts ...Option) error {
	mux := muxServer{gracePeriod: defaultGracePeriod}
	for _, opt := range opts {
		if err := opt(&mux); err != nil {
			return err
		}
	}

	if len(mux.targets) == 0 {
		return errors.New("mux serve: at least one serve target must be set")
	}

	return mux.Serve(ctx)
}

type muxServer struct {
	targets     []muxTarget
	gracePeriod time.Duration
}

func (mux *muxServer) Serve(ctx context.Context) error {
	var serveErr error

	wg := &sync.WaitGroup{}
	for _, target := range mux.targets {
		wg.Add(1)
		go func(t muxTarget) {
			defer wg.Done()
			if err := serveMuxTarget(ctx, t); err != nil {
				serveErr = err
			}
		}(target)
	}
	wg.Wait()

	return serveErr
}

func serveMuxTarget(ctx context.Context, target muxTarget) error {
	l, err := net.Listen("tcp", target.Address())
	if err != nil {
		return fmt.Errorf("serve: %w", err)
	}
	defer l.Close()

	errCh := make(chan error)
	go func() {
		defer close(errCh)

		if err := target.Serve(l); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- fmt.Errorf("server exited with error: %w", err)
		}
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), defaultGracePeriod)
		defer cancel()

		return target.Shutdown(shutdownCtx)

	case err := <-errCh:
		return err
	}
}
