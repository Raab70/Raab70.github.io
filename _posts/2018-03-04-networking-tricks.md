---
title: "Data Science in the Cloud: Networking Tips and Tricks"
excerpt: "Do your data science on remote machines? These tricks will help your productivity."
categories:
  - data-science
tags:
  - workflow
  - Google Cloud
  - AWS
  - Python
  - Jupyter
---

I have worked on teams which primarily utilize local servers, remote servers, GCP as well as AWS. Working on all these platforms I've learned a few tricks that can boost your productivity. Here I'll outline four of my most useful tricks for mastering the mythical networking and working in the cloud.


1. TOC
{:toc}


## Long-running scripts on remote machines
One of the most common problems when moving from a local machine to a remote server is keeping a long running job from exiting unexpectedly due to a connection error or something on your local machine terminating the ssh connection. There are a number of solutions to this but I must say that I think the best is the use of a tool called [`tmux`](https://github.com/tmux/tmux/wiki). Let's walk through the basics of installation, setup and workflow.

### Installation and setup
[`tmux`](https://github.com/tmux/tmux/wiki) is a terminal emulator and multiplexer. Installation is available through most major package providers so on Ubuntu you can use `sudo apt-get install tmux`. There are many good introductions to tmux such as [this one](https://hackernoon.com/a-gentle-introduction-to-tmux-8d784c404340) but I'll try to cover the basics here.

As for configuration, the `tmux` defaults are cumbersome but [you can customize almost any of it](https://wiki.archlinux.org/index.php/tmux#Configuration). I like to use [this config](https://github.com/gpakosz/.tmux) to get started. That repository has lots of goodies but the easiest way to get going is to just copy the `.tmux.conf` into your home directory and you're ready to go with some much more intuitive shortcuts.

### Workflow
After installation you can start a new tmux session from the command line with simply `tmux`. This will drop you into a new shell which is now emulated. If your SSH connection were to be terminated you could reconnect to this session and it would be exactly as you left it, even if you have programs running they will continue to run! Now for the basics, it is often useful to split a single terminal window into multiple terminals, this way you won't have to ssh from multiple local terminals.

While in tmux commands are often described as `prefix + cmd`, this indicates pressing the `prefix` key sequence and then some command key. The default prefix sequence is the cumbersome `ctrl + b`. If you've followed my advice above you'll also have the less difficult `ctrl + a` available as a prefix. So to split a terminal horizontally you can enter `prefix + -` and vertically is `prefix + |`. Note that these are not the default mappings, I don't even want to mention the defaults, they're not intuitive... Did I mention you should just use [that config?](https://github.com/gpakosz/.tmux)

When you're done in a tmux session you can detach from it and return to the hosts terminal with `prefix + d`. Then you can list all running sessions with `tmux ls`. This will show your running sessions (which you can also rename). To reattach to a session, if you haven't renamed it, you can use `tmux attach -t 0`. This is extremely helpful when running long scripts remotely. Note one caveat to tmux is that scrolling is not handled very well, if you want to be able to look back through logs I typically send them to a file as well as `stdout` using `tee` which can be done simply with `python my_long_script.py | tee file.log`.

## Running Jupyter notebooks remotely
This is an extremely common use case and a logical next step. From above, we know how to run a script on a remote machine without keeping the connection open but what about if I want an interactive Jupyter notebook running on my remote machine which I can connect to and run commands at will, and of course those commands need to continue to run and complete if I lose my connection. This is entirely possible but I will add this one caveat, Jupyter notebooks do not handle output to lost connections very well. So if your connection is dropped, or terminated, you will lose your output printed to the screen. For this reason I typically use the method above to run long-running scripts to process the data and then load the data into a Jupyter notebook for visualization and exploration.

### The Basics
Same as above we're going to make sure to run our notebook from within a tmux session so that it stays alive but how do we connect? Port forwarding! Port forwarding is a more advanced SSH technique that allows you to "tunnel" or "forward" ports between your local machine and your remote machine. There are two directions to this, `Local Forwarding` forwards ports _from_ your local machine _to_ the remote machine while `Remote Forwarding` forwards ports _from_ the remote machine _to_ your local machine. So for viewing a Jupyter notebook on a remote instance we want to use `Local Forwarding` to forward our local browser on port 8888 to the remote machine.

To set this up, you need to forward the port when you connect initially, this can be done with:

{% highlight bash %}
ssh -L 8888:localhost:8888 my-jupyter-box
{% endhighlight %}

Then you can just open a browser and visit `localhost:8888` and you'll see your Jupyter notebook. But let's also break down this command because this will be helpful for more advanced situations such as if you need to create this tunnel through a gateway.

### More Advanced Setups
The first 8888 is the local port on your local machine, the second part, `localhost:8888` is the target of the port forward on the remote machine. Finally, `my-jupyter-box` is the address you're ssh-ing to. So let's say you have a gateway you need to ssh to and then you want to create a tunnel through the `gateway` box to another box, `jupyter-box`. Also, let's say that you're running a local Jupyter notebook so you don't want to block access to that so we'll use a different port. For this scenario you could use:

{% highlight bash %}
ssh -L 8889:jupyter-box:8888 gateway
{% endhighlight %}

So with this command we're going to ssh to `gateway` and forward any local traffic to port `8889` through gateway and to `jupyter-box:8888`. Now you can open your browser and visit `localhost:8889` and you should see your notebook!

One last extra nugget I recommend is using an ssh config which is just a text file at `~/.ssh/config`. I won't go through all the possibilities but this config file is a very powerful way to setup shortcuts to these complicated ssh commands so you don't have to remember them. For example I always have one that looks something like:

{% highlight conf %}
Host dev-box
HostName 192.168.0.1
IdentityFile ~/.ssh/id_rsa
RemoteForward 52698 127.0.0.1:52698
LocalForward 8888 127.0.0.1:8888
{% endhighlight %}

With this saved in my ssh config file I can then just type `ssh dev-box` and I will be connected to my development box with local forwarding of 8888 for jupyter notebooks and remote forwarding of 52698 for [`rmate`](https://github.com/aurora/rmate) remote editing of text files, another favorite tool of mine.

### BONUS: Using a virtual environment with jupyter notebooks
This isn't really network related but it is a great trick. Virtual environments are a great asset to the Python data scientist and essential to my workflow. I even use them with my Jupyter notebooks and you can too.

{% highlight bash %}
$ source my_venv/bin/activate
(my_venv) $ pip install ipykernel
(my_venv) $ python -m ipykernel install —user —name=my_venv
{% endhighlight %}

Now in your Jupyter notebook you should have a kernel called `my_venv` connected to your virtual environment. Neat! Note that these kernels are stored in `~/Library/Jupyter/kernels` on OSX and `~/.local/jupyter/kernels` on Ubuntu.

## Accessing load balancers in a private network through a bastion
This one doesn't come up all that often but when it does it can be really handy. Let's say I'm working with a production environment and so we have great security and we have some internal load balancers, maybe some monitoring, which is running in a private VPC or behind a firewall. All I really want to do is pull up a web browser of a load balancer or host but it's hidden in this private VPC, what am I to do? Well we can use our port forwarding to forward our traffic through a bastion or gateway machine. The command looks like this:

{% highlight bash %}
ssh -N -D 8157 bastion
{% endhighlight %}

This command is very simple but powerful. First the `-N` switch just tells ssh not to run any commands remotely, so all this command does is forward ports. Second, the `-D` specifies that I want to forward all traffic on port `8157` to the remote host. Now all I have to do is proxy my traffic through port `8157` and it will be routed to the remote machine. Note that this proxy can be configured within your browser or with an extension like [foxyproxy](https://addons.mozilla.org/en-US/firefox/addon/foxyproxy-standard/) for Firefox. I always keep a foxyproxy config setup to route traffic through `8157` in case I need to use this trick.

## Review: Proxy vs Port Forwarding
Note that the end result of to `-D` flag is different from the port forwarding. If my internal host is called `my-host` and it is serving traffic on port 4000 I will enter `my-host:4000` in the address bar with my proxy configured. Note that I'm forwarding all traffic to this host on any port through 8157. As you can tell these capabilities are overlapping, in that I could use a proxy to access a Jupyter notebook or I could access `my-host:4000` internally as described above with `ssh -L 80:my-host:4000 bastion` and then entering `localhost` in the address bar of a browser with no proxy. I think port forwarding is best suited for single ports which you need access to, such as a Jupyter notebook while the proxy trick is great for seeing inside the lens of a private network. With that I can access any different endpoints I might need to see to diagnose a problem without closing and opening connections.
