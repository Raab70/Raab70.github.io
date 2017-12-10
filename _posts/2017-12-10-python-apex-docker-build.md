---
title: "Building Apex Python Lambdas using Docker"
excerpt: "Build Apex serverless python lambdas with docker to support cryptography and other system-level dependencies"
categories:
  - Python
tags:
  - AWS
  - Apex
  - Lambda
  - Docker
---

[Apex](https://Apex.run) is a great tool for managing your serverless architecture. When I decided I wanted to move my lambdas over, which are almost exclusively python based, my first question was how to handle dependencies. Previously I had written a script which pretty much followed the [AWS documentation](http://docs.aws.amazon.com/lambda/latest/dg/lambda-python-how-to-create-deployment-package.html) for creating deployment packages in a virtual environment. This was a simple enough scenario but it still didn't allow me to build any lambdas which require system level dependencies (i.e., cryptography and pycryptodome) without building the code on EC2. This was cumbersome and I vowed to solve this issue with Apex.

Apex works by having three build hooks, one to build dependencies, `build`, one directly before upload, `deploy`, and a cleanup post-deployment, `clean`. The focus here is on the `build` hook. The Apex github repo contains an example of [how to build a python application with dependencies](https://github.com/apex/apex/tree/master/_examples/python/functions/dependency). Basically it amounts to just running `pip install -t $(pwd) -r requirements.txt`. This has two issues:
1. It installs packages in the same directory as your code, making it nearly impossible to keep clean
2. It cannot handle system-level dependencies, building pycryptodome on mac will fail when deployed

Both of these are unacceptable and so we will address both.

### Package Install Location
To keep things clean I think that installing packages in a subdirectory is a necessary addition to this. You can do this by simply using `pip install -t $(pwd)/lib -r requirements.txt` and your lambdas will all fail because they cannot import those packages. That directory needs to be added to your python path. You can do this by adding the following lines AT THE VERY TOP. These MUST be the first two lines, before any other imports:
{% highlight python %}
import sys
sys.path.insert(0, "./lib")
{% endhighlight %}

### Building System Dependencies
Most lambdas need access to other systems. For this we use encryption and therefore need to build lambdas on a system which mimics EC2 and the lambda environment. This is a perfect example of how we can use a Docker image which resembles our target environment to ensure consistent builds. Luckily, Amazon provides such a [Docker container](https://hub.docker.com/_/amazonlinux/)! So to this base image we'll add the packages that we need for a python build:
{% highlight dockerfile %}
FROM amazonlinux
# Packages necessary for pycryptodome install
RUN yum install -y git gcc gmp python27-devel
# Install python-pip
RUN curl -O https://bootstrap.pypa.io/get-pip.py &&\
    python get-pip.py
# Make sure we have a src dir
RUN mkdir -p /src/lib
VOLUME [ "/src" ]
# Map our ssh creds if we need to install from version control
RUN mkdir -p /root/.ssh
VOLUME [ "/root/.ssh" ]

CMD /bin/bash -c "pip install -r /src/requirements.txt -t /src/lib/"
{% endhighlight %}

Now you'll notice that in this Dockerfile we get our environment ready and we are going to mount the apex deployment directory in `/src` so that after our build all of our files will be right where we want them. I also create a volume to allow for passing of ssh credentials in case your requirements includes any custom packages from version control, they will build as though on the host machine with all working ssh config and credentials. With this `Dockerfile` in the apex function directory we can change our build hook to:
{% highlight json %}
{
  "runtime": "python2.7",
  "handler": "main.lambda_handler",
  "hooks":{
    "build": "docker build -t pylambda . && docker run -v $(pwd):/src -v ~/.ssh:/root/.ssh pylambda",
    "deploy": "",
    "clean": ""
  }
}
{% endhighlight %}
In our build hook we make sure we have a docker image built, you could omit this but it is quick if the image is already built anyways. Then we run the container with the volumes mapped appropriately and when the container exits we have all of our dependencies, compiled on an EC2 compliant image, in our directory ready to be packaged by Apex.