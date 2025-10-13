package errors

import (
	"errors"
	"fmt"
	"strings"
)

var (
	New = errors.New
	Is  = errors.Is
	As  = errors.As
)

// OneOf checks if err is one of the provided errors.
func OneOf(err error, errs ...error) bool {
	for _, e := range errs {
		if Is(err, e) {
			return true
		}
	}
	return false
}

// Error represents a generic error.
type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Cause   string `json:"cause,omitempty"`
	Status  int    `json:"status,omitempty"`
}

// WithCause returns clone of err with the cause added.
func (err Error) WithCause(msg string) Error {
	cloned := err
	cloned.Cause = msg
	return cloned
}

func (err Error) WithCausef(msg string, args ...interface{}) Error {
	cloned := err
	cloned.Cause = fmt.Sprintf(msg, args...)
	return cloned
}

// WithMsg returns a clone of the error with message set.
func (err Error) WithMsg(msg string, args ...interface{}) Error {
	cloned := err
	cloned.Message = fmt.Sprintf(msg, args...)
	return cloned
}

// Is checks if 'other' is of type Error and has the same code.
// See https://blog.golang.org/go1.13-errors.
func (err Error) Is(other error) bool {
	oe, ok := other.(Error)
	equivalent := ok && oe.Code == err.Code
	return equivalent
}

func (err Error) Error() string {
	if err.Cause == "" {
		return fmt.Sprintf("%s: %s", err.Code, strings.ToLower(err.Message))
	}
	return fmt.Sprintf("%s: %s", err.Code, err.Cause)
}

// UserMessage returns the message that should be shown to the user.
func (err Error) UserMessage() string { return err.Message }

// Errorf returns a formatted error similar to `fmt.Errorf` but uses the
// Error type defined in this package. returned value is equivalent to
// ErrInternal (i.e., errors.Is(retVal, ErrInternal) = true).
func Errorf(msg string, args ...interface{}) error {
	return ErrInternal.WithMsg(msg, args...)
}

// E converts a generic error to an Error.
func E(err error) Error {
	var e Error
	if !errors.As(err, &e) {
		e = ErrInternal.WithCause(err.Error())
	}
	return e
}
