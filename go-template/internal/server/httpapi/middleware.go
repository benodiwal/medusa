package httpapi

import (
	"net/http"
	"time"

	"github.com/binod-labs/utm/pkg/log"
)

func enrichRequest(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := log.NewCtx(r.Context(),
			log.Str("method", r.Method),
			log.Str("path", r.URL.Path),
			log.Str("remote_addr", r.RemoteAddr),
			log.Str("user_agent", r.UserAgent()))
		handler.ServeHTTP(w, r.WithContext(ctx))
	})
}

func requestLogger(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		handler.ServeHTTP(w, r)
		log.Debug(r.Context(), "request handled", log.Str("duration", time.Since(start).String()))
	})
}
