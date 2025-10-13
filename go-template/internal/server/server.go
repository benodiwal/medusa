package server

import (
	"context"
	"net"
	"net/http"
	"time"

	"github.com/binod-labs/utm/internal/server/httpapi"
	"github.com/binod-labs/utm/pkg/log"
	"github.com/binod-labs/utm/pkg/server"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

type Options struct {
	HTTPAddr     string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

func Serve(ctx context.Context, opts Options) error {
	router := httpapi.Routes()
	handler := otelhttp.NewHandler(router, "ors", otelhttp.WithMessageEvents(otelhttp.ReadEvents, otelhttp.WriteEvents))

	httpSrv := &http.Server{
		Handler:      handler,
		ReadTimeout:  opts.ReadTimeout,
		WriteTimeout: opts.WriteTimeout,
		BaseContext:  func(l net.Listener) context.Context { return ctx },
	}

	log.Info(ctx, "starting server", log.Str("http_addr", opts.HTTPAddr))

	return server.Serve(ctx, server.WithHTTPTarget(opts.HTTPAddr, httpSrv))
}
