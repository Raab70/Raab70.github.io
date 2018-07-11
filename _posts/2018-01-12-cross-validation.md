---
title: "Cross Validation: Bringing you into the fold"
excerpt: "It is important to understand cross validation, not just what tools are available and what they do but why."
categories:
  - data-science
tags:
  - scikit-learn
  - cross-validation
crosspost_to_medium: true
---

Cross-validation is a topic which is oft overlooked by young data scientists as being trivial and not requiring any deep mathematical understanding. I see practitioners who know that they need to do cross-validation and maybe they do one layer of it but they don't understand why they're doing it and therefore don't understand when to use it. Spoiler alert: It's probably more than you're doing it and you're probably using the wrong tool.

1. TOC
{:toc}

# Introduction
## Getting Started
Before we get started make sure you're set up for doing data science, if you're new you can follow my getting started guide and [how I configure my environment here]({% post_url 2017-11-08-getting-started-with-data-science %}). We're going to start with an introduction to why we need cross-validation and the common methods which are used, as well as examples of how to use them. Finally I want to take a look at a common error I see with cross validation and how we all need to be careful of our claims.
## What does my data look like?
If you've read some of my other posts you may recall me repeating that looking at your data is important, this time however I'm actually talking on a broader scale, how is your data sampled? Is it representative? These are questions you need to consider (and usually answer) before even beginning. I like to think of this in terms of a line.
Let's step into a healthcare problem for a moment and consider that they're looking at a disease amongst the population. The line would represent all of the people in the world. Some subset of that line is all of the people who have their disease of interest. Yet another subset of the entire population is their sample of data. It is important to conceptualize and pose questions in this way, is my part of the line fundamentally different than the rest of it? Cross-validation deals with the problem of generalization of insights derived from one data set to the another. If the data sets are fundamentally different, or biased in some way, then this becomes nearly impossible and you should go read a different article about handling bias.
If your data is representative (or complete) then we must continue on this same path of thinking when we consider cross-validation, at every stage. If we split our data, are the two subsets fundamentally different in any way?

## Why do we do cross-validation?
Cross-validation is a technique to test the generalizability of a model to external, unseen data. This problem is inherent in data science, I only have a subset of the data at my disposal for training my model. Perhaps I want to predict a user's preference based on how they interact with my website. When a new user comes in, that is unseen data and if I have overfit my model to the 5 people who have used my website, it is unlikely to work appropriately for this new user. I have tuned the parameters (or hyperparameters) of my model too much. This is because when we optimize parameters, for example with `sklearn.model_selection.GridSearchCV`, we are optimizing some objective function, some measure of error. Of course my error will be lower after I find the best parameters with a grid search, I've mathematically defined it to be so. This doesn't mean however that my model is any better, or any more generalizable. We must evaluate how well the model does generalizing to newly seen data. This is the key point that whenever we make a decision about our model based on the outcome of our objective function, that data is now tainted. That part of the line is now a part of what made us select our model as it is and it cannot be used for a generalized estimation of accuracy.

# Common Cross-Validation Techniques
## Holdout
The simplest of the cross-validation techniques is really not cross validation at all. The holdout method is done using `sklearn.model_selection.train_test_split`. You split your data into a training and testing set, typically with the testing set being smaller than the training set. The exact sizes are not of great relevance. The model is then trained on the training set and evaluated on the testing set. Beware as I mentioned this is not technically cross-validation but a single generalizability test, a validation without the cross so to speak. This is because there is only a single experiment in contrast to the aggregation of the below techniques.

## K-Fold
K-fold cross-validation refers to splitting the data into K sections or folds. The experiment is then repeated K times with one segment being held out and the other segments acting as the training data. Popular choices for K are 3, 5 and 10 as they're manageable computationally. This is quite simple in python with `sklearn.model_selection.KFold` which can be used as:
{% highlight python %}
from sklearn.model_selection import KFold
X = np.arange(50)
y = np.arange(50)
kf = KFold(n_splits=10)

for train_index, test_index in kf.split(X):
    print("TRAIN:", train_index, "TEST:", test_index)
    X_train, X_test = X[train_index], X[test_index]
    y_train, y_test = y[train_index], y[test_index]
{% endhighlight %}
### Stratified K-Fold
Stratified K-Fold is a variant on K-Fold cross-validation which ensures that each fold has approximately the same number of each sample class. In the simple case of dichotomous classification each fold will contain approximately half of the samples from each class. This avoids the issue of "bad folds" where some folds could be under or over representing a single class. This could lead to false positives in overfitting, one might see the unstable results of K-Fold and think that the model is not generalizable when in fact some of the folds are not evenly distributed. This method is [generally regarded as superior to K-Fold](http://web.cs.iastate.edu/~jtian/cs573/Papers/Kohavi-IJCAI-95.pdf). This can be found in `sklearn.model_selection.StratifiedKFold`.
## Leave-P-Out (LPOCV)
Leave-P-Out cross validation is a technique whereby you specify the number of items to be left out for testing aand use all unique combinations. So P records are used for testing while the remaing N-P records are used for training. The difference here is that LPOCV will operate on all distinct subsets of size P within the data, while K-Fold creates K non-overlapping subsets. Meaning that LPOCV(P) != KFold(n_splits/P). So above our 10 folds on 50 samples means that for any fold, 5 samples will be left out and we will perform 10 experiments. However if we do LPOCV with P=5 that will take every possible unique combination of 5 samples and use each one as an experiment, or 50-choose-5, yielding 2,118,760 experiments. This can be found in `sklearn.model_selection.LeavePOut`. Note that the non-overlapping subsets means that the computational complexity grows combinatorically with the number of samples, this technique is not advised for large data sets. Just try running the below snippet and compare the number of experiments to above.
{% highlight python %}
from sklearn.model_selection import LeavePOut
X = np.arange(50)
y = np.arange(50)
lpo = LeavePOut(5)
# This will take a minute just to print...
for idx, (train_index, test_index) in enumerate(lpo.split(X)):
    print(idx)
    X_train, X_test = X[train_index], X[test_index]
    y_train, y_test = y[train_index], y[test_index]
{% endhighlight %}
### Leave-One-Out (LOOCV)
The special case of leave one out cross-validation (LPOCV where P=1) is often seen as it's own technique getting it's own abbreviation. It is popular for its simplicity and reduction of computational complexity from LPOCV. This can be found in `sklearn.model_selection.LeaveOneOut` which is really just the same as `sklearn.model_selection.LeavePOut(1)`.
# Interpreting Results
So now we know how and why to do cross validation, now how can we interpret the results? The easy answer is to look for stability. A stable model is a generalizable model. This makes sense given our discussion above on why we do cross validation. If a model performs similarly on folds of unseen data it is likely that the model is generalizable to that new data. If the model performs worse, it is possible that overfitting has occurred.
# Common Pitfalls
There are a few common pitfalls, most of which are well discussed other places and have to do with your data being generally bad. The trap I want to stress here is when you are at fault for reporting results which are not meaningful, not your data. Remember, if you ever make a decision based off an evaluation of your objective function it is then tainted. The error here being that not enough layers of cross-validation are used. A scientist will go in and do their 10-fold cross validation to select a model and optimize parameters. The cardinal sin would be to report the error which was the result of that cross validation as your model performance metric. Hopefully most of us know not to do this. The bigger issue comes when you have the correct notion to split your line two times, a train and test as well as a validation. You use your train and test for your cross-validation and then look at your validation set. Accuracy is decent, but not great. So let's tweak some things maybe try a different estimator which performed nearly as well in cross-validation but was not selected. Go back through the cross-validation and parameter optimization and then your validation accuracy is now better! So you report that accuracy. Look at your line of data, when you made a decision based off your validation set to inform your model you tainted that part of your data. It is no longer an independent party to your model to evaluate generalizability, it has informed your model. Now does this mean your model is invalid? Probably not. It means that you cannot claim with as much confidence that your model is generalizable until you have tested it on new, unseen data. Hopefully there is some more data you can use to evaluate this but then you must start back over at the beginning, is the new data the same as the old?

