package log

import (
	"context"
	"os"

	"github.com/binod-labs/utm/pkg/cntx"
	"go.uber.org/zap"
)

var globalLogger = zap.L()

// Info logs a message at the Info level.
func Info(ctx context.Context, msg string, fields ...Field) {
	globalLogger.Info(msg, mergeCtxFields(ctx, fields)...)
}

// Debug logs a message at the Debug level.
func Debug(ctx context.Context, msg string, fields ...Field) {
	globalLogger.Debug(msg, mergeCtxFields(ctx, fields)...)
}

// Warn logs a message at the Warn level.
func Warn(ctx context.Context, msg string, fields ...Field) {
	globalLogger.Warn(msg, mergeCtxFields(ctx, fields)...)
}

// Error logs a message at the Error level.
func Error(ctx context.Context, msg string, fields ...Field) {
	globalLogger.Error(msg, mergeCtxFields(ctx, fields)...)
}

// Fatal logs a message at the Fatal level and then calls os.Exit.
func Fatal(ctx context.Context, msg string, fields ...Field) {
	globalLogger.Fatal(msg, mergeCtxFields(ctx, fields)...)
	os.Exit(1)
}

// Log logs a message at the given level
// Supported levels are: info, debug, warn, error, fatal
func Log(ctx context.Context, level string, msg string, fields ...Field) {
	switch level {
	case "info":
		Info(ctx, msg, fields...)
	case "debug":
		Debug(ctx, msg, fields...)
	case "warn":
		Warn(ctx, msg, fields...)
	case "error":
		Error(ctx, msg, fields...)
	case "fatal":
		Fatal(ctx, msg, fields...)
	default:
		Info(ctx, msg, fields...)
	}
}

func mergeCtxFields(ctx context.Context, fields []Field) []Field {
	if ctx == nil {
		return fields
	}

	requestID := cntx.GetRequestID(ctx)
	if requestID != "" {
		fields = append(fields, Str(cntx.RequestID.String(), requestID))
	}
	ctxFields, _ := ctx.Value(logFields).([]Field)
	if len(ctxFields) == 0 {
		return fields
	}
	return append(ctxFields, fields...)
}
