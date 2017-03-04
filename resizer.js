// https://viewer.mediafly.dev/metlife0208/download/eb08407e3ede4e6f9b671ae8a5d11773product47/pdf?page=1
// https%3A%2F%2Fviewer.mediafly.dev%2Fmetlife0208%2Fdownload%2Feb08407e3ede4e6f9b671ae8a5d11773product47%2Fimage%3Fpage%3D1
// http://localhost:5432/pdf2svg?url=http%3A%2F%2Fsnapsvg.io%2Fassets%2Fimages%2Flogo.svg

const restify = require('restify');
const fs = require('fs');
const im = require('imagemagick-stream');
const request = require('request');
const Inkscape = require('inkscape');



//Config Server
var server = restify.createServer({
    name: 'resizer'
});


/* CORS */

restify.CORS.ALLOW_HEADERS.push('Accept-Encoding');
restify.CORS.ALLOW_HEADERS.push('Accept-Language');
restify.CORS.ALLOW_HEADERS.push('Authorization');
restify.CORS.ALLOW_HEADERS.push('DNT');
restify.CORS.ALLOW_HEADERS.push('X-CustomHeader');
restify.CORS.ALLOW_HEADERS.push('Keep-Alive');
restify.CORS.ALLOW_HEADERS.push('User-Agent');
restify.CORS.ALLOW_HEADERS.push('X-Requested-With');
restify.CORS.ALLOW_HEADERS.push('If-Modified-Since');
restify.CORS.ALLOW_HEADERS.push('Cache-Control');
restify.CORS.ALLOW_HEADERS.push('Content-Type');


// server.use(restify.CORS());

//

server.use(
    function crossOrigin(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Authorization,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Accept-Encoding,Accept-Language");
        return next();
    }
);

// Manually implement the method not allowed handler to fix failing preflights
//
server.on("MethodNotAllowed", function(request, response) {

    if (request.method.toUpperCase() === "OPTIONS") {

        // Send the CORS headers
        response.header("Access-Control-Allow-Credentials", true);
        response.header("Access-Control-Allow-Headers", restify.CORS.ALLOW_HEADERS.join(", "));
        response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.header("Access-Control-Allow-Origin", request.headers.origin);
        response.header("Access-Control-Max-Age", 0);
        response.header("Content-type", "text/plain charset=UTF-8");
        response.header("Content-length", 0);

        response.send(204);
    } else {
        response.send(new restify.MethodNotAllowedError());
    }
});

server.use(restify.CORS());

/* END CORS */


server.use(restify.fullResponse());
server.use(restify.queryParser());
server.use(restify.bodyParser());




//Set Routes
server.get("/imgs/resize/", function(req, res, next) {
    var url = req.query.url;
    var width = req.query.width;
    var height = req.query.height;
    var resizeString = '';

    if (width) {
        resizeString = width + 'x';
    } else {
        resizeString = '0x';
    }

    if (height) {
        resizeString = resizeString + height;
    } else {
        resizeString = '0';
    }

    if (url) {
        const resize = im().resize(resizeString);

        request.get(url)
            .on('response', function(response) {
                console.log('response', response.statusCode) // 200
                console.log('headers', response.headers['content-type']) // 'image/png'
            })
            .on('error', function(err) {
                res.json({
                    status: err
                });
                next();
            })
            .pipe(resize)
            .pipe(res);
    } else {
        res.json({
            status: "fail"
        });
        next();
    }
});

server.get("/imgs/pdf2svg/", function(req, res, next) {
    var url = req.query.url;

    if (url) {
        var pdfToSvgConverter = new Inkscape(['--import-pdf']);

        request.get(url)
            .on('response', function(response) {
                console.log('response', response.statusCode) // 200
                console.log('headers', response.headers['content-type']) // 'image/png'
            })
            .on('error', function(err) {
                res.json({
                    status: err
                });
                next();
            })
            .pipe(pdfToSvgConverter)
            .pipe(res);
    } else {
        res.json({
            status: "fail"
        });
        next();
    }
});

var port = 5432;
server.listen(port, function(err) {
    if (err) {
        console.error(err);
    } else {
        console.log(server.name + ' is ready at : ' + port);
    }
});