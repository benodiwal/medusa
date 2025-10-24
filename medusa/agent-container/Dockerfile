FROM alpine:3.19
RUN apk add --no-cache \
    git curl bash openssh-client ca-certificates jq \
    python3 py3-pip \
    && pip3 install --no-cache-dir --break-system-packages \
        requests gitpython pyyaml
WORKDIR /workspace
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENV PYTHONUNBUFFERED=1
ENTRYPOINT ["/entrypoint.sh"]