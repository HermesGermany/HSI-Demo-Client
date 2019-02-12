# Dockerfile for expressjs oauth2-client

ARG NODEIMAGE_VERSION=latest
FROM uwegerdes/nodejs:${NODEIMAGE_VERSION}

MAINTAINER Uwe Gerdes <entwicklung@uwegerdes.de>

ARG NODE_ENV='production'
ARG SERVER_PORT='8080'
ARG LIVERELOAD_PORT='8081'

ENV NODE_ENV ${NODE_ENV}
ENV SERVER_PORT ${SERVER_PORT}
ENV LIVERELOAD_PORT ${LIVERELOAD_PORT}

USER root

COPY package.json ${NODE_HOME}/

RUN apt-get update && \
	apt-get dist-upgrade -y && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
	chown -R ${USER_NAME}:${USER_NAME} ${NODE_HOME} && \
	npm -g config set user ${USER_NAME} && \
	if [ "${NODE_ENV}" = "development" ] ; then \
		npm install -g --cache /tmp/root-cache \
					gulp-cli \
					nodemon ; \
	fi

COPY . ${APP_HOME}

RUN chown -R ${USER_NAME}:${USER_NAME} ${APP_HOME}

USER ${USER_NAME}

WORKDIR ${NODE_HOME}

RUN npm install --cache /tmp/node-cache

WORKDIR ${APP_HOME}

EXPOSE ${SERVER_PORT} ${LIVERELOAD_PORT}

CMD [ "npm", "start" ]
