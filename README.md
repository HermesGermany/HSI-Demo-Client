# HSI Demo Client

## Install with Node.JS (Docker users see below)

Node.js: [download](https://nodejs.org/en/download/) latest LTS or Current version and install.

Open a terminal in the project directory and install the node dependencies (only once) with:

```
C:> npm install
```

Start the server:

```
C:> node server.js
```

Open [`http://localhost:8080/hsi/`](http://localhost:8080/hsi/) in your favorite browser.

To stop the server simply hit CTRL-C and the script should end.

To use the client you need login credentials - ask your Hermes business service contact.

## Proxy configuration

If there is a proxy in your company network to access the internet, the proxy must be configured for npm installation and for the HSI Demo Client.

Add a file `C:\users\[username]\.npmrc` (when renaming the file in Windows add a dot at the end: `.npmrc.` - and it works) with this content:

```
proxy = http://proxyhostname:8080/
https-proxy = http://proxyhostname:8080/
strict-ssl = false
```

Please add the proxy information to the file `modules/hsi/configuration.yaml` so the HSI Demo Client gets access to the Hermes servers.

## Install with Docker

For Windows or Mac users: open [https://www.docker.com/get-started](https://www.docker.com/get-started) in your browser.

For Linus users: install Docker with:

```bash
$ curl -sSL https://get.docker.com | sh
$ sudo adduser [yourusername] docker
```

### Build the Docker image

If you have proxy caches for apt-get and npm or a company proxy you should build [uwegerdes/baseimage](https://github.com/UweGerdes/docker-baseimage) (or [uwegerdes/baseimage-arm32v7](https://github.com/UweGerdes/docker-baseimage-arm32v7) for Raspberry Pi 3) and [uwegerdes/nodejs](https://github.com/UweGerdes/docker-nodejs) before building this image.

You should build the HSI Demo Client image with:

```bash
$ docker build -t hermesgermany/hsi-demo-client .
```

### Run the Docker container

Run the container with:

```bash
$ docker run -it --rm -p 8080:8080 --name hsi-demo-client hermesgermany/hsi-demo-client
```

The container is removed and recreated on the next start.
