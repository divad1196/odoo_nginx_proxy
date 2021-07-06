#!/bin/bash

# printenv

if [[ -v "$PROXY" ]]; then
    echo "PROXY environment variable must be defined" >&2
    exit 1
fi

NGINX_CONF=/etc/nginx/conf.d/default.conf

export PORT=80
export ORIGIN=$(test -n "$ORIGIN" && echo "$ORIGIN" || echo "$PROXY")
export CORS=$(test -n "$CORS" && echo "$CORS" || echo '$http_origin')
envsubst '${PORT} ${PROXY} ${ORIGIN} ${CORS}' < "$NGINX_CONF" | tee "$NGINX_CONF"

# echo $NGINX_CONF