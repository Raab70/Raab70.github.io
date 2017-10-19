---
title: "Deploying Python Machine Learning Models to an API with Flask"
excerpt: "Deploy a simple python scikit-learn (sklearn) machine learning model in minutes using a Flask API to allow interfacing with other services and programming languages."
categories:
  - Python
tags:
  - Flask
  - scikit-learn
  - Data Engineering
---

I often find myself needing to deploy machine learning models for use with other services or languages. Flask is a great minimal web framework for deploying a simple API and since it's written in Python you can easily create an API to apply any of your current python machine learning models. In this example we'll take a simple text classification problem from [sklearn](http://scikit-learn.org/stable/datasets/twenty_newsgroups.html) and create a minimal API to apply our model to any input text.

First, ensure you have updated versions of python, scikit-learn and Flask. Now we can fit a simple multinomial naive bayes model to our data.

{% highlight python %}
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.datasets import fetch_20newsgroups
from sklearn.externals import joblib
CAT = ['rec.autos','rec.motorcycles','rec.sport.baseball','rec.sport.hockey','sci.crypt','sci.electronics','sci.med','sci.space']
# Just grab the training set:
newsgroups_train = fetch_20newsgroups(subset='train', categories=cat)

# Create our processing pipeline and train it
text_clf = Pipeline([('tfidf', TfidfVectorizer()),
                    ('clf', MultinomialNB(alpha=0.01))])
text_clf.fit(newsgroups_train.data, newsgroups_train.target)

# Now we save it to a pickle
joblib.dump(text_clf, 'pipeline.pkl')
{% endhighlight %}

We now have a single pickle file with everything we need to apply our model to novel text. Let's get on to creating our API. We'll start by creating a flask application and importing our model
{% highlight python %}
from flask import Flask, abort, request, jsonify
from sklearn.externals import joblib

app = Flask(__name__)
text_clf = joblib.load('pipeline.pkl')
{% endhighlight %}

Now we can create a function and attach a route to it using a decorator.

{% highlight python %}
CAT = ['rec.autos','rec.motorcycles','rec.sport.baseball','rec.sport.hockey','sci.crypt','sci.electronics','sci.med','sci.space']


@app.route('/', methods=['POST'])
def evaluate_text():
    app.logger.info("{} request received from: {}".format(
        request.method, request.remote_addr))
    if not request.json or 'data' not in request.json:
        app.logger.error("Request has no data or request is not json, aborting")
        abort(400)
    pred = text_clf.predict([request.json['data']])[0]
    return jsonify({'result': CAT[pred]})
{% endhighlight %}

This function decorator tells flask to allow POST requests to the base URL and upon receiving a request, run the function `evaluate_text`. Note that we have access to the `request` object which was imported above. We check that it is valid JSON with the expected field `data`. If so, we can evaluate that data against our loaded model and return the result as JSON. This simplicity is the heart of the what makes Flask so useful for these small projects. All that's left is to start it up.

{% highlight python %}
if __name__ == '__main__':
    app.debug = True
    app.run(host='127.0.0.1', port=5000)
{% endhighlight %}

This code will start our application at `localhost:5000`. We turn on the debug option for some explicit logging. You can test it with `curl -H 'Content-Type:application/json' -d '{"data": "Ferrari is the best sports car"}' localhost:5000` You'll see a response with the predicted category! You'll note the model is not terrible accurate but more time could be spent in optimizing our model but this example is illustrative of how to deploy a model.

All code is available in this github [repository](https://github.com/Raab70/Raab70.github.io/tree/master/_posts/code/2017-10-17-deploying-machine-learning-models). There you'll find a script named `create_model.py` to generate the pickle of the trained example and `api.py` which implements the above API in Flask. To use these, run `python create_model.py` first, when that completes run `python api.py`. In a new terminal, try the curl command above. Your output should look like so:
{% highlight bash %}
$ curl -H 'Content-Type:application/json' -d '{"data": "Ferrari is the best sports car"}' localhost:5000
{
  "result": "rec.autos"
}
{% endhighlight %}
