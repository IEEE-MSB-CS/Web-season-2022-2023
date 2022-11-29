# Introduction
Beyond Docker: Containerization unplugged
## Table of contents
1. History of containerization 
2. Leveraging Linux kernel features by building container 
3. Using Docker images without Docker
4. Where to go ?

## chroots
chroot allows you to 

follow along with me

```sh
$ docker run -it --name docker-host --rm --privileged ubuntu:bionic
$ mkdir my-new-root
$ cp bin/bash my-new-root/bin
$ ldd bin/bash
$ mkdir my-new-root/lin{,64}
$ cp <those_libs> my-new-root/lib and lib64
$ chroot my-new-root bash
```
To see which libs does bash depends on
```sh
$ ldd bin/bash

linux-vdso.so.1 (0x00007ffd55bfe000)
	libtinfo.so.5 => /lib/x86_64-linux-gnu/libtinfo.so.5 (0x00007fdb3e708000)
	libdl.so.2 => /lib/x86_64-linux-gnu/libdl.so.2 (0x00007fdb3e504000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007fdb3e113000)
	/lib64/ld-linux-x86-64.so.2 (0x00007fdb3ec4c000)
```
so we need to move those libs to their dedicated folders
```
root@6639a75f6ca3:/# cp /lib/x86_64-linux-gnu/libtinfo.so.5 /lib/x86_64-linux-gnu/libdl.so.2 lib/x86_64-linux-gnu/libc.so.6 my-new-root/lib
root@6639a75f6ca3:/# cp /lib64/ld-linux-x86-64.so.2 my-new-root/lib64/

```

after moving we can now change the root to our new root directory and start a bash session
```sh
$ chroot my-new-root bash
```
if you try to use any command you'll notice there's no commands to be executed, that's because all we've got inside this new root is the bash only

you will notice two important things:
- now our root directory is my-new-root which is '\' and we can't reach outside this enviroment now
- if we want to add new command for example, we've to explicity do this by moving the command from whatever it resides and move it's libs

So what's the problem with chroot ?
## Namespaces
the ideas of namespaces is simply let each process take it's own process IDs, network layer, resources, etc to avoid conlict with other processes
to demonstrate this idea in practice, lets get our hands dirty
start a long-running process inside your main container

```sh
$ echo "top secret" >> /my-new-root/secret.txt
$ tail -f my-new-root/secret.txt
```
after that connect to the same main container from another shell

```sh
$ docker exect -it docker-host bash
```

```sh
# Docker-host 2
root@6639a75f6ca3:/# ps aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.0  18520  3348 pts/0    Ss   21:21   0:00 bash
root          46  0.0  0.0   4580   832 pts/0    S+   21:38   0:00 tail -f secret.txt
root          47  0.1  0.0  18520  3376 pts/1    Ss   21:41   0:00 bash
root          58  0.0  0.0  34416  2904 pts/1    R+   21:42   0:00 ps aux
```
let's kill that process
```sh
Docker-host 2
$ kill 46
```
you'll notice that the process got terminated
```sh
Docker-host 1
root@6639a75f6ca3:/# tail -f secret.txt
secret
Terminated

```
so with namespaces we can solve this problem by isolating each process from seeing what other process are doing!
we'll use command called `unshare`

A practical example
1. we'll create a child process (jailed process)
2. then we'll unshare [processes, file systems, network layer] from that child process
3. from docker host 2 we'll see how each the host can control child process but the child cannot
```sh
$ apt-get update
$ apt-get install debootstrap -y
# creating a new bare minimal set of a file system we need to run a debian based ubuntu
$ debootstrap --variant=minbase bionic /better-root
```
`debootstrap` is used to bootstrap a new enviroment and you can chroot directory into it.

```sh
$ unshare --mount --uts --ipc --net --pid --fork --user --map-root-user chroot /better-root bash
root@6639a75f6ca3:/# ps aux
Error, do this: mount -t proc proc /proc
# we need to mount a process first
$ mount -t proc none /proc mount -t sysfs none /sys mount -t tmpfs none /tmp
$
$
$

```

from the host we can see inside child, from child we can't see outside of itself

from
```
# Docker-host 1
$ echo "sample" >> sample.txt
$ tail -f sample.txt

# Docker-host 2
root@6639a75f6ca3:/# ps aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.0  18520  3356 pts/0    Ss   21:21   0:00 bash
root          47  0.0  0.0  18520  3396 pts/1    Ss   21:41   0:00 bash
root        7406  0.0  0.0   4532   772 pts/0    S    21:53   0:00 unshare --mount --uts --ipc --net --pid --fork --user --map-root-user chroot /better-root bash
root        7407  0.0  0.0  18512  3424 pts/0    S    21:53   0:00 bash
root        7427  0.0  0.0   4572   768 pts/0    S+   22:05   0:00 tail -f sample.txt
root        7428  0.0  0.0  34416  2928 pts/1    R+   22:05   0:00 ps aux

$ kill 7427

# Docker-host 1
root@6639a75f6ca3:/# tail -f sample.txt
welcome
Terminated

```


:note: the host can control everything that's happening inside child process, but child process can't see outside itself

## Control groups (Cgroups)
Cgroups invented by Google


```sh
# Docker host 1
apt-get install cgroup-tools htop

/better-root# cgcreate -g cpu,memory,blkio,devices,freezer:/sandbox # creates a new cgroup for us
/better-root# unshare --mount --uts --ipc --net --pid --fork --user --map-root-user chroot /better-root bash
now we are inside better-root enviroment

# docker host 2
$ cgclassify -g cpu,memory,blkio,devices,freezer:sandbox 7605 (#pid of bash inside docker host 1, now bash process and every chid process inside it inside control group)
$ cat /sys/fs/cgroup/cpu/sandbox/tasks # to see what's inside control group
$ cat /sys/fs/cgroup/cpu/sandbox/cpu.shares #(priority)

## now let's limit what's happening
$ cgset -r cpu.cfs_period_us=100000 -r cpu.cfs_quota_us=$[ 5000 * $(getconf _NPROCESSORS_ONLN) ] sandbox
  # this limit process to only use 5% of the avaialble processing power
$ cgset -r memory.limit_in_bytes=80M sandbox
  # this limit process to use only 80M if it exceeds this amount, it will run out of memory
$ cgget -r memory.stat sandbox # to see statistics of memory you gave to sandbox

## To see this in practice
let's pin the cpu for use in docker host 1 (do a heavy work)
# Docker host 1
$ yes > /dev/null (print yes forever in /dev/null) [A long and heavy runnin process]

## From docker host 2
$ htop # notice something

### Let's mess another one but this time with memory
# Docker host 1
$ yes | tr \\n x | head -c 104857600| grep n (contiuly fill our memory until we run out of memory)
## Docker host 2
$ htop # notice something about the memory
```


Congratulations, you've now created a container by hand
this what docker hoes for you beneath, but with more responsbilites




## Introduction to Docker

```sh
$ docker pull mongo:3
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
## Making tiny containers

## Features in Docker


## Multi-container projects

## OCI 
# Introduction
If you want to get a solid understanding of Containerization at a very systematic level, you should actually build one from scratch.

## Prerequisites

- Linux command line familiarity
- Basic knowledge of networking and operating systems


## Containers
Containers are just "Jails" _Technically they're more than that_ but this is the simplest term we can describe them of right now!

## Process Jailing
Histriocally "Process Jail" is an old term used by


## Resources
You can dig deeper by reading about those features in details

#### Chroot
%[https://www.howtogeek.com/441534/how-to-use-the-chroot-command-on-linux/]
#### Cgroups
%[https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/6/html/resource_management_guide/ch01]
#### Namespace

%[https://www.nginx.com/blog/what-are-namespaces-cgroups-how-do-they-work/]

https://www.youtube.com/watch?v=-YnMr1lj4Z8
http://docker-saigon.github.io/post/Docker-Internals/
https://www.youtube.com/watch?v=sK5i-N34im8
https://www.youtube.com/watch?v=j_UUnlVC2Ss
https://www.youtube.com/watch?v=sHp0Q3rvamk
https://www.youtube.com/watch?v=J17rXQ5XkDE
https://www.youtube.com/watch?v=0kJPa-1FuoI
https://www.youtube.com/watch?v=x1npPrzyKfs
unshare
debootstrap
