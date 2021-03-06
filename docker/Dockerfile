FROM registry.access.redhat.com/ubi8/ubi-minimal:8.3

# njs > 0.4.3 fails to run js-yaml.js
ENV NGINX_VERSION 1.18.0-1.el8
ENV NGINX_MODULE_NJS_VERSION 1.18.0.0.4.3-1.el8

LABEL name="nginxinc/nginx" \
      vendor="NGINX Inc." \
      version="${NGINX_VERSION}" \
      release="1" \
      summary="NGINX" \
      description="nginx will do ....."
### Required labels above - recommended below
LABEL url="https://www.nginx.com/" \
      io.k8s.display-name="NGINX" \
      io.openshift.expose-services="8443:https" \
      io.openshift.tags="nginx,nginxinc"

ADD nginx.repo /etc/yum.repos.d/nginx.repo

RUN curl -sO http://nginx.org/keys/nginx_signing.key && \
    rpm --import ./nginx_signing.key && \
    microdnf -y install --setopt=tsflags=nodocs nginx-${NGINX_VERSION}.ngx nginx-module-njs-${NGINX_MODULE_NJS_VERSION}.ngx && \
    rm -f ./nginx_signing.key && \
    microdnf clean all

# Copy licenses
RUN mkdir -p /opt/fuse/licenses
COPY licenses /opt/fuse/licenses

# forward request and error logs to docker log collector
# - Change pid file location & remove nginx user & change port to 8080
# - modify perms for non-root runtime
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log && \
    sed -i 's/\/var\/run\/nginx.pid/\/var\/cache\/nginx\/nginx.pid/g' /etc/nginx/nginx.conf && \
    sed -i -e '/user/!b' -e '/nginx/!b' -e '/nginx/d' /etc/nginx/nginx.conf && \
    echo -e "load_module modules/ngx_http_js_module.so;\n$(cat /etc/nginx/nginx.conf)" > /etc/nginx/nginx.conf && \
    rm -f /etc/nginx/conf.d/default.conf && \
    chown -R 998 /var/cache/nginx /etc/nginx && \
    chmod -R g=u /var/cache/nginx /etc/nginx

#VOLUME ["/var/cache/nginx"]

EXPOSE 8443

# Add symbolic link to config.json to avoid mounting issues
RUN ln -sf /usr/share/nginx/html/config/config.json /usr/share/nginx/html/config.json

RUN rm /usr/share/nginx/html/index.html

RUN touch config.js && \
    chown 998 config.js && chmod g=u config.js && \
    mkdir -p /usr/share/nginx/html/online/osconsole && \
    ln -sf /config.js /usr/share/nginx/html/online/osconsole/config.js && \
    mkdir -p /usr/share/nginx/html/integration/osconsole && \
    ln -sf /config.js /usr/share/nginx/html/integration/osconsole/config.js

USER 998

COPY nginx.js rbac.js js-yaml.js /etc/nginx/conf.d/
COPY nginx.conf nginx-gateway.conf osconsole/config.sh nginx.sh ACL.yaml /
COPY site /usr/share/nginx/html
COPY branding/favicon.ico branding/Logo-Red_Hat-Fuse-A-Reverse-RGB.png branding/Logo-RedHat-A-Reverse-RGB.png /usr/share/nginx/html/online/img/
COPY branding/hawtconfig.json /usr/share/nginx/html/online
COPY branding/hawtconfig.json /usr/share/nginx/html/integration

CMD ["./nginx.sh"]
