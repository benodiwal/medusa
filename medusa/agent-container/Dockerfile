FROM alpine:3.19

# Install system dependencies including Node.js for Claude Code
RUN apk add --no-cache \
    git curl bash openssh-client ca-certificates jq \
    python3 py3-pip \
    nodejs npm \
    && pip3 install --no-cache-dir --break-system-packages \
        requests gitpython pyyaml

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /workspace

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PYTHONUNBUFFERED=1

ENTRYPOINT ["/entrypoint.sh"]