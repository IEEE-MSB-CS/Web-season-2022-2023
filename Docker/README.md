# Docker

## Table of contents

1. What's a container?
2. Container vs image
3. Docker vs Virtual machine
4. Main Docker commands
5. Developer with containers
6. Run multiple containers - Docker compose
7. Build own Docker image - Dockerfile
8. Push to private Docker repo
9. Deploy containerized application - NodeJs example
10. persist data in docker - Volumes
11. Deploy and setup nexus as Docker container
12. Create private docker repository on nexus
13. push/fetch from repo

## Resources

- Frontendmasters - complete introduction to Containerization feat Docker
- Docker in action [book]

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

## Demo

### Docker Network

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
```

## Docker compose [Running multiple services]

a structured way to contain very normal docker commands

💯Docker compose takes care of creating a common network  
by creating a default network group

:small_red_triangle: you can acutally configure docker-compose file to a logical processing order of spinning off containers!

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

## Docker Volumes
- When do we need Docker volumes?


Virutal File Systems

Host File system 
Folder in physical host file system is *mounted* into virual file system of Docker

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
and Dockre automaticallyfor each container create/generate a folder that gets mounted e.g `/var/lib/docker/volumes/random-hash/_data`
3. `docker run -v name:/var/lib/mysql/data`

* named volumes is commonly used on production

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
You can referene one volume for more than one containers
