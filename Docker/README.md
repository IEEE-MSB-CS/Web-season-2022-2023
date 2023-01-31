# Docker

## Table of contents

- [x] What's a container?
- [x] Container vs image
- [x] Docker vs Virtual machine
- [x] Main Docker commands
- [x] Build own Docker image - Dockerfile
- [x] Run multiple containers - Docker compose
- [ ] persist data in docker - Volumes
- [ ] Push to private Docker repo
- [ ] Deploy containerized application - NodeJs example
- [ ] Deploy and setup nexus as Docker container
- [ ] Create private docker repository on nexus
- [ ] push/fetch from repo
- [ ] Beyond Docker: Containerization in practice!

## Resources

- Frontendmasters - complete introduction to Containerization feat Docker
- Docker in action [book]
- my articles

## Introduction

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

## Containers

1. What's ? (packaging)
2. What problems they solve? (portability, compatability, availabilit, different versions, the traditional deployment process vs containerized [spinning off container in a cluter of containers])

container has it's own linux base image (alpine, ubuntu, whatever) own isolated enviroment

the beneifts that image is collection of layers is [only different layers are downloaded when for example, we upgrade from application image to higher one!]

```sh
# notice the difference
$ docker run postgres:9.10

# run it again 
$ docker run postgres:10.10 # notice something? [some layers already exists]
```

Docker image vs Docker container:
image: the actual package (with all dependecies and tools) we could say it's the artifact that can be moved around
container: when you actually pull that image from any repo, and start it, you here are "creating" a container enviroment
tdlr; a container is a running docker image!

Docker vs virual machine

Docker only virualize the application layer, because it used the host kernel feature!
Virtual machine: virutalizes the [Application + os kernel] of every machine

Docker architecture and it's components

- Docker engine (docker server [responsible for pulling image, starting/stopping images, storing images], docker api [interacting with the docker server], docker cli [docker client to perform commands again docker server])

Docker Server:

- Container runtime: pulling images, manaing container lifecycle.
- Volumes: persisting data
- Network: configuring network for container communication
- build images: building your own docker image

## Docker commands

- Container vs image
- version and tag
- docker commands [run, pull, start, attatch, detach]

Container: the `actual` runnig _enviroment_ for image
Containe has it's own _virtual file system_  
also a _port binded_ : talk to application running inside of a container
besides having an _application image_: postgres, redis, etc

tags: the defaul tag is _latest_

```sh
docker pull redis:latest
docker run redis:latest

docker pull redis:4.0
docker run redis:4.0

docker ps # notice something, they both are listening to the same port?!

CONTAINER ID   IMAGE       COMMAND                  CREATED          STATUS          PORTS      NAMES
0d497dfe0aa2   redis:4.0   "docker-entrypoint.s…"   11 seconds ago   Up 10 seconds   6379/tcp   epic_bell
9c49022add36   redis       "docker-entrypoint.s…"   48 seconds ago   Up 47 seconds   6379/tcp   optimistic_zhukovsky
```

How to avoid port binding confilct?
let's first see Container ports vs HOST ports

you could have two different containers each one is running the same port e.g (3000) but each one is bind to different host port
using the port of the host after binding you can connect to the container binding to it

```sh
docker run -p<host_port>:<container_port>
docker run -p6000:6379 redis:latest
docker run -p6001:6379 redis:4.0 --name redis-older
```

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
because you give CTRL+c to docker and docker pass it to node container, and node doesn't respond to this signal by default, so you should _as node developer_ do this by your self from code

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

## Docker Network

- What is available networking options ?
- What is Docker Network?

### Simple application

![alt](./screenshots/Screenshot%202023-01-31%20170459.png)

![alt](./screenshots/Screenshot%202023-01-31%20171333.png)

![alt](./screenshots/Screenshot%202023-01-31%20171444.png)

```sh

docker pull mongo
docker pull mongo-express

docker network ls
docker network create mongo-network


docker run -d -p27017:27017 --network mongo-network --name mongodb -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=secret mongo

docker run -d -p8081:8081 --network mongo-network --name mongo-express -e -e ME_CONFIG_MONGODB_SERVER="mongodb"  -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin -e ME_CONFIG_MONGODB_ADMINPASSWORD=secret
mongo-express 

docker logs monog -f # to stream the logs e.g tail example.txt -f



docker network inspect mongo-network inspect

node index.js
```

### Docker compose [Running multiple services]

a structured way to contain very normal docker commands

💯Docker compose takes care of creating a common network  
by creating a _default_ network group

:small_red_triangle: you can actually configure the docker-compose file to a logical processing order of spinning off containers!

```yaml
version: '3'
services:
    mongodb:
        image: mongo
        porst:
            - 27017:27017
        enviroment:
            - MONGO_INITDB_ROOT_USERNAME=admin
            - MONGO_INITDB_ROOT_PASSWORD=secret
    mongo-express:
        image: mongo-express
        ports:
            - 8080:8081 
        enviroment:
            - ME_CONFIG_MONGODB_ADMINUSERNAME=admin
            - ME_CONFIG_MONGODB_ADMINPASSWORD=secret 
            - ME_CONFIG_MONGODB_SERVER=mongodb
```

```sh
docker-compose -f mongo.yml up -d # start in detached mode
docker-compose -f mongo.yaml down # this will remove the network and next time upping it, it will create a new network
```

⛔ recreating a container => data lost, we can have data persistency with Docker volumes

## Building Images with Dockerfile

A blueprint for creating docker images
FROM `image` => basing it on another image
RUN `any linux command` to be applied on the container enviroment
COPY `any linux command` to be applied from host to a container
CMD = entrypoint command

```dockerfile
FROM node:13-alpine
ENV MONGO_DB_USERNAME=admin \
    MONGO_DB_PWD=secret
RUN mkdir -p /home/app

COPY . /home/app # executes on the HOST machine
CMD ["node", "server.js"] # cmd command
```

To actually build

```sh
docker build -t my-app:1.0 . # (.) for current folder which contains Dockerfile
```

:red_circle: when you readjust the `Dockerfile` you've to rebuild the image

```sh
docker rm <container_name> # notice sometimes you should first delete the container, then delete the image; otherwise it wouldn't go right
docker rmi <image_name> # my-app:1.0 here
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

emo project (Static Assests) using multi-stage build

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

## Docker Volumes

- When do we need Docker volumes?

Virutal File Systems

Host File system
Folder in physical host file system is _mounted_ into virual file system of Docker

Data gets automatically replicated from/to virtual and host
<insert image>

### 3 volumes types

using Docker run command:
Host Volumes
anonymous volumes
named volumes: you can reference the volume by name

1. `docker run -v <host_dir>:<vf_dir>`
for example

```sh
docker run -v /home/mount/data:/var/lib/mysql/data
```

2. `docker run -v <only_vf_dir>`
and Dockre automatically for each container create/generate a folder that gets mounted e.g `/var/lib/docker/volumes/random-hash/_data`
3. `docker run -v name:/var/lib/mysql/data`

- named volumes is commonly used on production

using Docker compose

```yaml
version:
services:
  <service>:
      image: <image_name>
      ports: <ports>
      volumes:
       - db-data:/var/lib/mysql/data # named volume
volumes:
  db-data # you must list those volumes
```

You can referene one volume for more than one containers, if for example those containers need to share the same data!

### Bind mounts

To have some sort of storage persisent
> when containers get closed, they drop everything that thy had before

search about "snowflake servers"

there are about 5 different types of mounts, but our focus here on two main types ["bind", "volume"]

we're binding the container point of storage on specfic folder on host computer, and anything that host changes ends up in the container, and anything that container changes ends up in the computer and so on, like a tunnel ['bounded']

```sh
cd /task/volume
docker build -t nodeapp .
docker run --name my-node-app -p3000:3000 -v $(pwd):/usr/src/app nodeapp -v /usr/src/app/node_modules
```

pwd => on our local machine
pwd -> link it with /usr/src/app [for sync]

But why the second `-v` ?
This is because in our host we don't have node_modules, and on the container we have node_modules, this will produce because `in sync` the host and the container should have the same state at any given moment!
so we tell the container to not watch for node_modules and exclude it from sync

```sh

cd static-assets-project
docker run --mount type=bind,source="$(pwd)"/build,target=/usr/share/nginx/html -p 8080:80 nginx:1.17
```

so what actually does this line mean?

Here we don't actually built a container, we've run it directlry from the command line, so how the Nginx container serve the project, it the project isn't found on a container?
because we've bind mounted the build directory from 'our host computer' so then nginx container will go grap

### Volume mounts

#### Demo project: Docker volumes
