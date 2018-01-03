FROM python:2-slim

WORKDIR /usr/src/app
COPY requirements.txt ./
COPY api.py ./
COPY pipeline.pkl ./

RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 5000
CMD [ "python", "./api.py" ]