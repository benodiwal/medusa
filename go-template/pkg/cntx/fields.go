package cntx

import (
	"context"

	"github.com/rs/xid"
)

type field string

func (f field) String() string {
	return string(f)
}

const (
	// RequestID is the key used to store the trace ID in the context.
	RequestID field = "request_id"
)

// WithRequestID returns a new context with the trace ID set.
func WithRequestID(ctx context.Context, rID string) context.Context {
	// check for request ID in the context
	if _, ok := ctx.Value(RequestID).(string); ok {
		return ctx
	}

	// if request ID is not set, generate a new one
	if rID == "" {
		rID = xid.New().String()
	}

	return context.WithValue(ctx, RequestID, rID)
}

// GetRequestID returns the trace ID from the context.
func GetRequestID(ctx context.Context) string {
	if tID, ok := ctx.Value(RequestID).(string); ok {
		return tID
	}
	return ""
}
