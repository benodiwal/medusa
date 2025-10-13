package httpapi

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/binod-labs/utm/pkg/errors"
	"github.com/binod-labs/utm/pkg/log"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func Routes() http.Handler {
	mux := chi.NewRouter()

	mux.Use(
		middleware.Recoverer,
		cors.Handler(cors.Options{AllowedOrigins: []string{"*"}}),
		enrichRequest,
	)
	mux.NotFound(notFoundHandler)
	mux.MethodNotAllowed(methodNotAllowedHandler)

	mux.Get("/healthz", healthCheck)

	return mux
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func writeJSON(ctx context.Context, w http.ResponseWriter, code int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)

	if code == http.StatusNoContent {
		return
	}

	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Warn(ctx, "failed to write json response", log.Err(err))
	}
}

func writeErr(ctx context.Context, w http.ResponseWriter, err error) {
	e := errors.E(err)
	sendCause := !errors.OneOf(err, errors.ErrInternal, errors.ErrUnauthorized)

	m := map[string]string{
		"code":    e.Code,
		"message": e.Message,
	}
	if sendCause && e.Cause != "" {
		m["cause"] = e.Cause
	}

	log.Warn(ctx, "failed to handle request", log.Err(err), log.Str("err_code", e.Code))
	writeJSON(ctx, w, e.Status, m)
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	writeErr(r.Context(), w, errors.ErrNotFound)
}

func methodNotAllowedHandler(w http.ResponseWriter, r *http.Request) {
	writeErr(r.Context(), w, errors.Error{
		Code:    "method_not_allowed",
		Message: "Method is not allowed",
		Status:  http.StatusMethodNotAllowed,
	})
}
