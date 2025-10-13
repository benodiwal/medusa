VERSION=$(shell git describe --tags --always --first-parent 2>/dev/null)
COMMIT=$(shell git rev-parse --short HEAD)
BUILT_ON:=$(shell date +'%Y-%m-%d_%T')
OUT_PATH="./out"

all: clean fmt test build

setup:
	go install golang.org/x/tools/cmd/goimports@latest

build:
	@echo "Building..."
	@mkdir -p ${OUT_PATH}
	@go build -ldflags "-X main.Version=$(VERSION) -X main.Commit=$(COMMIT) -X main.BuiltOn=$(BUILT_ON)" -o ${OUT_PATH}/utm ./cmd/utm

fmt:
	@echo "Formatting..."
	@goimports -l -w ./

clean:
	@echo "Cleaning up..."
	@go mod tidy -v
	@rm -rf ${OUT_PATH}
	@mkdir -p ${OUT_PATH}

generate:
	@echo "Running generate..."
	@go generate ./...

test:
	@echo "Running unit tests..."
	@go test -race -cover -coverprofile=${OUT_PATH}/coverage.out ./... | grep -v "no test files"
	@go tool cover -html=${OUT_PATH}/coverage.out -o ${OUT_PATH}/coverage.html
	@go tool cover -func=${OUT_PATH}/coverage.out | grep -i total:

test-verbose:
	@echo "Running unit tests..."
	@go test -race -cover -v -coverprofile=${OUT_PATH}/coverage.out ./...
	@go tool cover -html=${OUT_PATH}/coverage.out -o ${OUT_PATH}/coverage.html
	@go tool cover -func=${OUT_PATH}/coverage.out | grep -i total:

benchmark:
	@echo "Running benchmarks..."
	@go test -benchmem -run="none" -bench="Benchmark.*" -v ./...

.PHONY: build
