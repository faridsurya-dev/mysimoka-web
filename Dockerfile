FROM nginxinc/nginx-unprivileged:1.27-alpine

LABEL org.opencontainers.image.source="https://github.com/faridsurya-dev/mysimoka-web"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY assets/ /usr/share/nginx/html/assets/
COPY models/ /usr/share/nginx/html/models/

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
