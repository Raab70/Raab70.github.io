---
title: "Migrating Existing AWS Lambda Functions to Apex"
excerpt: "Migrate current AWS Lambda functions to be managed by apex serverless"
categories:
  - AWS
  - Lambda
tags:
  - Python
  - Apex
  - Lambda
  - AWS
crosspost_to_medium: true
---

## Introduction
This guide is meant to serve as a reference for the steps needed to migrate an existing AWS Lambda function to being fully managed by [Apex](http://apex.run). It is very likely that all sections of this guide will not apply to each Lambda. This guide is instead structured as a reference for what information is needed to transition any existing lambda to Apex. I would urge you to, before beginning transitioning functions, consider the powerful structure that Apex provides of having projects holding functions. The simplest configuration is to have each lambda function be it's own project but I suggest you organize your functions logically into projects which group them together. This will organize code in your repository as well as ensure consistent naming of your functions making them easier to find.

1. TOC
{:toc}

## Create a framework
The first thing we need to do is initialize the directory structure for Apex. I won't go through it in detail here as the documentation is great. I did write a shell script to initialize a project, Apex's init function `apex init` actually makes some changes to your account (such as creating IAM roles). For transferring existing lambdas we would not need these new roles.
{% highlight shell %}
#!/bin/bash
if [ $# -ne 1 ]
then
    echo "init_apex.sh"
    echo "Usage:"
    echo ""
    echo "init_apex.sh my_project_name"
    echo "Will create apex tree for my_project_name"
    echo "as well as a template function function_name"
fi

mkdir "$1"
mkdir "$1"/functions
mkdir "$1"/infrastructure
mkdir "$1"/functions/function_name

touch "$1"/project.json
touch "$1"/functions/function_name/function.json
{% endhighlight %}

## Initial configuration
Now that we have a framework we need to fill in some more details about our project. Recall that functions require very little configuration as they can inherit most options from their project defaults. Here is an example basic project and single function configuration:

>project.json
{:.notice}
{% highlight json %}
{% raw %}
{
  "name": "project",
  "nameTemplate": "{{.Function.Name}}",
  "role": "arn:aws:iam::123456789:role/lambda_iam",
  "memory": 128,
  "runtime": "python2.7",
  "timeout": 300,
  "retainedVersions": 10
}
{% endraw %}
{% endhighlight %}

Notice the `nameTemplate` parameter is set to just use the function name. This is good for simple projects or something like a utilities project in which each function has a unique name. For projects which contain multiple interrelated functions I recommend using the original name template (by omitting from this config) which will name functions as `project_function`.

 >functions/function_name/function.json
{:.notice}
{% highlight json %}
{
  "description": "My amazing lambda function that saves the world",
  "runtime": "python2.7",
  "handler": "main.lambda_handler",
  "hooks":{
    "build": "docker build -t pylambda . && docker run -v $(pwd):/src -v ~/.ssh:/root/.ssh pylambda",
    "deploy": "",
    "clean": ""
  }
}
{% endhighlight %}

Not much to note here. I explicitly state the function runtime in case a function has mixed runtimes and then define our docker build hook to ensure dependencies are built properly regardless of build OS, for more on that see [this article on building with Apex in Docker]({% post_url 2017-12-10-python-apex-docker-build %}). All that is necessary is to copy the `Dockerfile` from that post into your function directory and make sure your script starts with `import sys; sys.path.insert(0, './lib')`

### Environment Variables
If your function requires environment variables which is a great way to pass in any variables needed at runtime you can configure these in your `function.json` like so:
 >functions/function_w_env/function.json
{:.notice}
{% highlight json %}
{
  "description": "My amazing lambda function that saves the world",
  "runtime": "python2.7",
  "handler": "main.lambda_handler",
  "hooks":{
    "build": "docker build -t pylambda . && docker run -v $(pwd):/src -v ~/.ssh:/root/.ssh pylambda",
    "deploy": "",
    "clean": ""
  },
  "environment": {
    "ENDPOINT": "my.endpoint",
  }
}
{% endhighlight %}

### VPC Setup
If your function runs in a VPC you will need to configure that in the `project.json` as follows:
>project.json
{:.notice}
{% highlight json %}
{% raw %}
{
  "name": "project",
  "nameTemplate": "{{.Function.Name}}",
  "role": "arn:aws:iam::123456789:role/lambda_iam",
  "memory": 128,
  "runtime": "python2.7",
  "timeout": 300,
  "retainedVersions": 10,
  "vpc": {
    "securityGroups": [
      "sg-123"
    ],
    "subnets": [
      "subnet-abc",
      "subnet-def"
    ]
    }
}
{% endraw %}
{% endhighlight %}
Note that all of these can be copied directly from your console.

## Transitioning Code
Now comes the hard part. You need to transition the meat of your function. This will vary depending upon the exact function and I highly recommend you test as thoroughly as possible. One option is to name the Apex function differently from the current function and then test the new Apex function if testing locally is not possible. Testing locally within the Docker image is likely sufficient for most cases. The basic premise of this step is to:
1. Copy function code or download deployment package
2. Hopefully you have a requirements.txt you can reuse, if not, create one
3. Build your new function with `apex build my_function > build.zip`
4. Test!

## Infrastructure
If you have existing terraformed infrastructure (such as IAM roles or triggers) you can transition this to also be managed by apex. This is a nice integration but it is one-way, meaning that apex passes your function arn (and a few other things) into terraform for your use but you cannot use an IAM role created in terraform in your `project.json` without manually copying the arn. Going through terraform is out of scope for this document but I will provide this code snippet I use to begin my terraform within apex to bring in the variables which `apex infra` provides. The basic idea is that the `apex infra` command is an alias for terraform with the following variables provided as well:

>infrastructure/main.tf
{:.notice}
{% highlight terraform %}
# Currently the following variables are exposed to Terraform:

variable "aws_region" {}
variable "apex_environment" {}
variable "apex_function_role" {}

variable "apex_function_arns" {
  type = "map"
}

variable "apex_function_names" {
  type = "map"
}

# aws_region the AWS region name such as “us-west-2”
# apex_environment the environment name such as “prod” or “stage”
# apex_function_role the Lambda role ARN
# apex_function_arns A map of all lambda functions
# apex_function_names A map of all the names of the lambda functions
{% endhighlight %}

## Deployment
Now you are finally ready to run `apex deploy`, to check your function name you can first run `apex list`. One of the nice things about this transition is that it will not create a new function and therefore will not affect existing triggers. If you follow the steps above and simply copy everything from the console to Apex your function should not change one bit in the console. It will still have all of it's triggers and anything else you have setup, but now you have the advantage of apex deployment. The only thing is that Apex will create versions of your code for each time you deploy. Depending on your previous deployment strategy, this may create your first version for that function. Now to just move all those triggers to `apex infra`...

## TODO: Apex Environments
Apex also [supports multiple configurations per environment](http://apex.run/#multiple-environments). I have not tested converting existing functions with multiple aliases to the Apex environment scenario. This is beyond the scope of this document but I would recommend using this paradigm for any production critical lambdas.
