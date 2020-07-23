# Simple Node.js REST API

A simple REST API using:

- Node.js 10.x
- Docker
- Amazon Linux 2

The API has four endpoints that return a JSON response:

* GET /
* POST /
* PUT /
* DELETE /

## Build

```
docker build -t nodejs-rest-api .
```

## Run

Run in default port `3030`:
```
> docker run -p 3030:3030 -d nodejs-restful-api
```

Run in custom port, e.g., `8080`:
```
docker run -e PORT=8080 -p 8080:8080 -d nodejs-restful-api
```

## Test

#### GET /

```
curl -i http://localhost:3030/

{"response":"This is GET method."}
```


#### POST /

```
curl -i -x POST http://localhost:3030

{"response":"This is POST method."}
```

#### PUT /

```
curl -i -x PUT http://localhost:3030

{"response":"This is PUT method."}
```

#### DELETE /

```
curl -i -x DELETE http://localhost:3030

{"response":"This is DELETE method."}
```
