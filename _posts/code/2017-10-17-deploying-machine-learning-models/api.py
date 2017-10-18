from flask import Flask, abort, request, jsonify
from sklearn.externals import joblib

app = Flask(__name__)
text_clf = joblib.load('pipeline.pkl')
CAT = [
    'rec.autos',
    'rec.motorcycles',
    'rec.sport.baseball',
    'rec.sport.hockey',
    'sci.crypt',
    'sci.electronics',
    'sci.med',
    'sci.space']


@app.route('/', methods=['POST'])
def evaluate_text():
    app.logger.info("{} request received from: {}".format(
        request.method, request.remote_addr))
    if not request.json or 'data' not in request.json:
        app.logger.error("Request has no data or request is not json, aborting")
        abort(400)
    pred = text_clf.predict([request.json['data']])[0]

    return jsonify({'result': CAT[pred]})


if __name__ == '__main__':
    app.debug = True
    app.run(host='127.0.0.1', port=5000)
