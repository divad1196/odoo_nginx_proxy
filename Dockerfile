from nginx:stable

ENV PROXY=

COPY setup.sh /docker-entrypoint.d/setup.sh
# COPY entrypoint.sh .
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ENTRYPOINT [ "/entrypoint.sh" ]
# CMD ["nginx", "-g", "daemon off;"]