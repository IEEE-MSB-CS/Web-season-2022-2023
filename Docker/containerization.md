# Introduction

## Prerequisites

- Linux command line familiarity
- Basic knowledge of networking and operating systems

## Introduction to Docker

```sh
docker pull mongo:3
```

## Docker images but without Docker

we're going to run docker images without docker, so you can actually see what's going on

we are going first to use docker from a docker container

```sh
docker run -it -v /var/run/docker.sock:/var/run/docker.sok --privileged --rm --name docker # this will run a docker container which container a docker-host docker:18.06.1-ce client that's connected to your host VM! [we opened a tunnel to the host!]

docker run --rm -dit --name my-alpine:3.10 sh  # start it in background
docker ps
<output>


# what we are going to do is dumping the state out of this right and we're going to run it as our own container, which is exactly what an image is

docker export -o dockercontainer.tar my-alpine
ls


mkdir container-root

tar xf dockercontainer.tar -C container-root/
cd container-root
 unshare --mount --uts --ipc --net --pid --fork --user --map-root-user chroot /container-root sh
pwd
mount -t proc none /proc
mount -t sysfs none /sys
mount -t tmpfs none /tmp

ps aux

# so we've basically executed this docker image but with previous techniques
```

## Node on Docker

```sh
docker run -it node:12-stretch
```

#### tags

#### CLI

some important docker commands

```sh
docker inspect <image>
docker pause <image>
docker unpause <image>
docker kill <image>
docker kill $(docker ps -q) # kill all container all at once!
docker history <image>
docker top <image> == docker exec <image> ps aux
docker container prune => remove all stopped containers
docker image prune => remove all images
docker image list => list all images
docker info
docker restart <image>
docker search <image> => search about container in local and Docker hub
```

docker run => start a new container
docker exec => run something on existing container

## The Dockerfile

```sh
mkdir intro-to-containters
mkdir intro-to-containers/dockerfile
touch intro-to-containers/dockerfile/Dockerfile
```

now inside Dockerfile

```Dockerfile
FROM node:12-strectch #our base image

CMD ["node", "-e", "console.log(\"omg hi lol\")"
```

```sh
docker build --tag my-node-app:1.0 .
docker run my-node-app:1.0
omg hi lol
```

now do some changes to our base Dockerfile

```sh
FROM node:12-strectch #our base image

CMD ["node", "-e", "console.log(\"second lol\")"
```

if you tried to run our first container

```sh
docker run my-node-app:1.0
omg hi lol   # ?

```

as you might have noticed, with any changes done to Dockerfile,we've to build it again, and you've two choices

1. to build on clean state [removing old one using docker rm or docker rmi]
2. to make another container with another tag

```sh
docker build --tag my-node-app:2.0 .
docker run my-node-app:2.0
second lol
```

now let's make a containerized nodejs server

```sh
mkdir intro-to-containers/build-a-node-app
touch intro-to-containers/build-a-node-app/index.js

```

```js
const http = require('http');

http.createServer((req, res ) => {
console.log('received request');
res.end('hi lol');
}).listen(3000);
console.log('server started')
```

```sh
touch Dockerfile # in that directory
```

```Dockerfile
FROM node:12-stretch 

COPY index.js index.js # from source to dest

CMD ['node', 'index.js']
```

```sh
docker build -t my-node-app .

docker run my-node-app
server started
```

but you will notice if go to browser that localhost:3000 is not working? why????
> remember namespaces?
we didn't give explicit permission to container to talk to the host network

let's get work of that, but before that, try to CTRL+c to get out of that container!, it won't work, know why?
because you give CTRL+c to docker and docker pass it to node container, and node doesn't respond to this signal by default, so you should *as node developer* do this by your self from code

```sh
process.on("SIGINT", () => {
process.exit(1)
})
```

if you want to handle those SIGNTERMS without having to do anything with code you can do this

```sh
docker build --init my-node-app # tini "module" will handle this for you
```

now you container is listening to port 3000 for incoming-requests

now let's our node container again to listen to port 3000 on the host

```sh
docker run --init --rm -publish 3000:3000 my-node-app

```

By default, all commands you've previously run was "root", and this is not a best practice to do!

so the maintainers of "node" container, give you a "node" user on that container to execute commands

--chown=group:user

```Dockerfile
FROM node:12-stretch

USER node

WORKDIR /home/node/code
COPY --chown=node:node index.js index.js

ADD --chown=node:node index.js index.js

CMD ["node", "index.js"]
```

ADD and COPY do the exact the same thing, but with one noticable difference? any body knows why??!

ADD has additional features, like it can reach out to the network to download a file to destination and so on!

now to see your WORKDIR

```sh
docker run --init --rm -publish 3000:3000 my-node-app pwd
/home/node/code

```

### Making more complicated Container

it's kind of best practice to run `npm ci` instead of 'npm install' inside a container

```sh
# we're using the demo of more-complicatd-node example
$ touch Dockerfile
```

```Dockerfile
FROM node:12-stretch

USER node

WORKDIR=/home/node/code

COPY --chown=node:node . .

RUN npm ci

CMD ["node", "index.js"]
```

:red_circle: a note about EXPOSE:
you can use EXPOSE in Dockerfile

```Dockerfile
# AFTER RUN
...
EXPOSE 3000
...
```

then you can use it like this, after building

```sh
docker run --init --rm -P my-node-app
```

Docker contaienrs is composed of layers, and docker "usually" do a cahing to those layers so everytime you build, it doesn't build those layers from scratch again

`.dockerignore` is a file you put to ignore bunch of stuffs, like directories you don't want to be in there in the container e.g [node_modules, .git]

```sh
git init # to make .git directory
touch .dockerignore

# inside .dockerignore

.git
node_modules
```

## Making tiny containers

reasons for using alpine or any minimal linux distros?

1. less vuls
2. less storage

using alpine will make it much much light weight!

```dockerfile
FROM node:alpine
..
...
```

But we can make it more "much" lighter by using only alpine linux and installing nodejs ourselves

```dockerfile
FROM alpine:3.10

RUN apk add --update nodejs npm
RUN addgroup -S node && adduser -S node -G node
USER node 

RUN mkdir /home/node/code

WORKDIR /home/node/code

COPY --chown=node:node package-lock.json package.json
RUN npm ci

COPY --chown=node:node . .

CMD ["node", "index.js"]
```

now build your container and run it, then inspect it

```sh
docker built -t my-alpine-node .
docker run --init --rm -p3000:30000 my-alpine-node

docker inspect my-alpine-node # notice the difference in Size?
```

we can even go lower "lighter"

### Multi-stage Builds

sometimes you don't want to send "toolchains" to production, because of "security vulns" somethings :"D

:red_circle: :red_circle: in general this is not a good idea :"D

```dockerfile
# Build Stage
FROM node:12-stretch AS build
WORKDIR /build
COPY package-lock.json package.json ./
RUN npm ci
COPY . .

# runtime stage
FROM alpine:3.10
RUN apk add --update nodejs npm
RUN addgroup -S node && adduser -S node -G node
USER node 

RUN mkdir /home/node/code

WORKDIR /home/node/code

COPY --from=build --chown=node:node ./build .

CMD ["node", "index.js"]
```

:red_circle: you can actually build a bunch of containers in a row.
so you can say like, here's my dev container, here's my build container, you can build them all in on dockerfile and it'll export all of them for you

refer to Docker documentation for more about <a href="https://docs.docker.com/build/building/multi-stage/">Multi-stage build</a>

#### Demo project (Static Assests) using multi-stage build

```sh
npx --ignore-existing create-react-app static-assests-project --template typescript --use-npm 

# change every css file to .scss then
npm i node-sass
npm run start # to check everything is working properly
react-scripts build

```

now I need you to containerize this project into Nginx container
using nginx:latest or nginx:alpine
in usr/share/nginx/html

:red_circle: do it yourself first, then comeback see the solution

:red_circle: you don't need to specif y CMD because the nginx container has it's own CMD that will run automatically

```dockerfile
FROM node:12-stretch AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:1.17
COPY --from=builder /app/build /usr/share/nginx/html
```

```sh
docker build -t static-app .
docker run -p8080:80 static-app
```

now head over to <a href="localhost:8080">localhost:8080</a>

## Features in Docker

### Bind mounts

To have some sort of storage persisent
> when containers get closed, they drop everything that thy had before

search about "snowflake servers"

there are about 5 different types of mounts, but our focus here on two main types ["bind", "volume"]

we're binding the container point of storage on specfic folder on host computer, and anything that host changes ends up in the container, and anything that container changes ends up in the computer and so on, like a tunnel ['bounded']

```sh

cd static-assets-project
docker run --mount type=bind,source="$(pwd)"/build,target=/usr/share/nginx/html -p 8080:80 nginx:1.17
```

so what actually does this line mean?

Here we don't actually built a container, we've run it directlry from the command line, so how the Nginx container serve the project, it the project isn't found on a container?
because we've bind mounted the build directory from 'our host computer' so then nginx container will go grap

### Volume mounts

## Making tiny containers

## Features in Docker

## Multi-container projects

## OCI
