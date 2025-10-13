package log

import (
	"context"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type ctxKey int

const logFields ctxKey = iota

// Field represents a field key/value pair.
type Field = zap.Field

// Fields used for logging.
var (
	Any      = zap.Any
	Int      = zap.Int
	Int64    = zap.Int64
	Err      = zap.Error
	Bool     = zap.Bool
	Str      = zap.String
	Time     = zap.Time
	Float64  = zap.Float64
	Duration = zap.Duration
)

// Setup configures the global logger instance.
// mode can be "off", "dev" or "prod" (other values will be assumed as prod).
// First return value is a function that should be called to flush the logs
// before the program exits. defer it right after calling Setup().
func Setup(mode, level string) (func(), error) {
	if mode == "off" || mode == "none" {
		globalLogger = zap.NewNop()
		return noOp, nil
	}

	var cfg zap.Config
	if mode == "dev" {
		cfg = zap.NewDevelopmentConfig()
		cfg.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		cfg.EncoderConfig.ConsoleSeparator = " | "
	} else {
		cfg = zap.NewProductionConfig()
	}
	cfg.DisableStacktrace = true

	lvl, err := zapcore.ParseLevel(level)
	if err != nil {
		lvl = zap.WarnLevel // default to info
	}
	cfg.Level = zap.NewAtomicLevelAt(lvl)

	lg, err := cfg.Build(zap.WithCaller(true), zap.AddCallerSkip(1))
	if err != nil {
		return noOp, err
	}
	globalLogger = lg

	return func() { _ = lg.Sync() }, nil
}

// NewCtx returns a new context with the fields injected into the context.
// The fields will be added to all subsequent log calls made with the context.
func NewCtx(ctx context.Context, fields ...Field) context.Context {
	return context.WithValue(ctx, logFields, fields)
}

// MergeCtx returns a new context with the fields injected into the context.
// Existing fields in the context will also be preserved. But this is costlier
// than NewCtx as it has to merge the fields.
func MergeCtx(ctx context.Context, fields ...Field) context.Context {
	if ctx == nil {
		return NewCtx(ctx, fields...)
	}
	ctxFields, _ := ctx.Value(logFields).([]Field)
	return NewCtx(ctx, append(ctxFields, fields...)...)
}

func noOp() {}
