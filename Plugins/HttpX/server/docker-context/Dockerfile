FROM golang:1.23-alpine AS builder
WORKDIR /app
RUN go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /go/bin/httpx /usr/local/bin/httpx
RUN chmod +x /usr/local/bin/httpx

CMD ["httpx"] 