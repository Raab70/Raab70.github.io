---
title: "Getting Started with Python for Data Science"
excerpt: "How to set up an environment to do data science like a pro"
categories:
  - Python
tags:
  - scikit-learn
  - Pandas
  - seaborn
  - matplotlib
  - jupyter
  - iPython
  - numpy
---

This is a reference post for steps to set up an environment.

* TOC
{:toc}

# Setting up Python
Here I'll cover the basics of setting up a data science development environment on ubuntu/debian. First you'll want to install python and pip
{% highlight bash %}
sudo apt-get update
sudo apt-get install python-pip python-dev htop
pip install --upgrade pip
pip install virtualenv
{% endhighlight %}

# Setting up virtualenv
Now you have a basic python setup but we want to make sure we keep python packages separate from system packages so we'll make sure we use a virtual environment. Virtual environments have lots of benefits and allow you to manage the requirements of code for deployment.
{% highlight bash %}
mkdir my-project-dir && cd my-project-dir
virtualenv --no-site-packages venv
source venv/bin/activate
{% endhighlight %}
You'll now see `(venv)` next to your terminal meaning you're working within your virtual environment. Let's get some packages installed.

# Packages to Install
{% highlight bash %}
pip install skcikit-learn pandas numpy scipy seaborn matplotlib ipython jupyter
{% endhighlight %}

# Standard imports
There are some standard rules for how we import packages and it helps to see these ahead of time.
{% highlight python %}
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
{% endhighlight %}
Note that most packages here have a defined standard abbreviation which we will follow and that for scikit-learn functions we will typically import each function individually.

# Setting up jupyter notebook with virtualenv
Now we have an environment but jupyter notebooks are a great tool for exploring data. How can we now connect our jupyter notebook to our virtualenv packages?
{% highlight bash %}
source venv/bin/activate
pip install ipykernel

python -m ipykernel install —user —name=my_project_venv
{% endhighlight %}
Once this has been done we can start our jupyter notebook server with `jupyter notebook` and connect. From there you should see `my_project_venv` as an available kernel.

# Jupyter Notebooks in the cloud
Often times my work will be done on more powerful servers which are not my local machine. There are a few tips and tricks I use for working with these.

## Enabling password protection
More than likely you'll want to enable password protection, especially if you follow the below step of keeping your notebook running. To do this you just need to generate a password hash and insert it into your jupyter config. First we will generate the password hash in ipython:
{% highlight bash %}
$ ipython
>> from IPython.lib import passwd
>> passwd()
>> exit
{% endhighlight %}
When you run the `passwd` function you'll be prompted to create a password and it will create a hash, copy this hash. Now we need to add this hash to the jupyter config. Generate a config file with `jupyter notebook --generate-config`. Now add the following to the bottom of the config at `~/.jupyter/jupyter_notebook_config.py`
{% highlight python %}
c = get_config()  # Get the config object.
c.IPKernelApp.pylab = 'inline'  # in-line figure when using Matplotlib
c.NotebookApp.ip = '*'  # Serve notebooks locally.
c.NotebookApp.open_browser = False  # Do not open a browser window by default when using notebooks.
c.NotebookApp.password = 'sha1:fc216:3a3ed980b9...'
{% endhighlight %}
This is modified from [jupyter configuration on AWS](http://docs.aws.amazon.com/mxnet/latest/dg/setup-jupyter-configure-server.html)

## Connecting to a remote jupyter notebook
My preferred method of using ssh is with the `~/.ssh/config` which allows for me to configure a server and have all of my settings there whenever I want to connect. I'll simply add the following to my `~/.ssh/config` file for the server I want to connect to:
{% highlight bash %}
Host dataBox
HostName 12.34.56.78
IdentityFile ~/.ssh/my_id
LocalForward 8888 127.0.0.1:8888
{% endhighlight %}
Now from my machine I can just execute `ssh dataBox` and I will be connected to my data machine and once I start my jupyter notebook on the remote machine I can just visit `127.0.0.1:8888` in a web browser and work on my notebook running on the remote machine.

## Keeping Notebooks running
First you'll want to install `tmux`, this is a terminal emulator tool which is very powerful and I highly recommend looking into it further but for our purposes we'll be using it to keep our jupyter notebook session running.
{% highlight bash %}
sudo apt-get install tmux
tmux
jupyter notebook
{% endhighlight %}
Once tmux is installed you can start your tmux notebook from within tmux and if your ssh session gets disconnected your notebook will still be running. All you have to do is reopen your ssh connection and your notebook will be connected again. I also recommend using [this](https://github.com/gpakosz/.tmux) config.

## Rendering on a windowless server
If you run into problems plotting on a remote server, you'll see an error about `$DISPLAY` not being defined, you need to configure matplotlib's backend. Add the following to the top of your notebook, in this order:
{% highlight python %}
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
{% endhighlight %}