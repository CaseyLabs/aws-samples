FROM amazonlinux:latest

ENV PORT=3030

WORKDIR /usr/src/app

# Install dependencies
COPY package.json /usr/src/app/
RUN curl --silent --location https://rpm.nodesource.com/setup_10.x | bash -; \
yum -y install nodejs; \
npm install;

# Copy source
COPY server.js /usr/src/app

EXPOSE $PORT
CMD [ "npm", "start" ]
