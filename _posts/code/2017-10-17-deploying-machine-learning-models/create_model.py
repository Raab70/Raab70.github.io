from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.datasets import fetch_20newsgroups
from sklearn.externals import joblib
from sklearn import metrics
CAT = [
    'rec.autos',
    'rec.motorcycles',
    'rec.sport.baseball',
    'rec.sport.hockey',
    'sci.crypt',
    'sci.electronics',
    'sci.med',
    'sci.space']

if __name__ == '__main__':
    # Just grab the training set:
    newsgroups_train = fetch_20newsgroups(subset='train', categories=CAT)

    # Create our processing pipeline and train it
    text_clf = Pipeline([('tfidf', TfidfVectorizer()),
                        ('clf', MultinomialNB(alpha=0.01))])
    text_clf.fit(newsgroups_train.data, newsgroups_train.target)

    # Now we save it to a pickle
    joblib.dump(text_clf, 'pipeline.pkl')

    # To test:
    newsgroups_test = fetch_20newsgroups(subset='test', categories=CAT)
    pred = text_clf.predict(newsgroups_test.data)
    print pred
    f1 = metrics.f1_score(newsgroups_test.target, pred, average='macro')
    print "F1 score: {:.03f}".format(f1)
