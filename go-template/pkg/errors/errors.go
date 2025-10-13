package errors

import "net/http"

var (
	ErrInvalid = Error{
		Code:    "bad_request",
		Message: "Your request was invalid. Please try again.",
		Status:  http.StatusBadRequest,
	}

	ErrNotFound = Error{
		Code:    "not_found",
		Message: "The requested resource was not found",
		Status:  http.StatusNotFound,
	}

	ErrConflict = Error{
		Code:    "conflict",
		Message: "A conflicting resource exists",
		Status:  http.StatusConflict,
	}

	ErrUnsupported = Error{
		Code:    "unsupported",
		Message: "Requested feature is not supported",
		Status:  http.StatusUnprocessableEntity,
	}

	ErrUnauthorized = Error{
		Code:    "unauthorized",
		Message: "Client is not authorized for the requested action",
		Status:  http.StatusUnauthorized,
	}

	ErrForbidden = Error{
		Code:    "forbidden",
		Message: "You are denied from performing this action",
		Status:  http.StatusForbidden,
	}

	ErrVendor = Error{
		Code:    "vendor_failure",
		Message: "Something went wrong with the vendor. Please try again.",
		Status:  http.StatusUnprocessableEntity,
	}

	ErrInternal = Error{
		Code:    "internal_error",
		Message: "Something went wrong. Please try again.",
		Status:  http.StatusInternalServerError,
	}
)
