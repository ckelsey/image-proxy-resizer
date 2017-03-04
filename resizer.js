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

//  https://cklsylabs.com/imgs/resize?width=200&height=200&url=http%3A%2F%2Fwww.planwallpaper.com%2Fstatic%2Fimages%2Fwallpapers-7020-7277-hd-wallpapers.jpg

//  https://img.mediafly.com?src=https%3a%2f%2fcontent.mediafly.com%2ff0f2af6fb5d34d6aa21e04218913eeba.png%3fo%3dULE%252fpjHddUwvY173Oe%252fGtGdYDqYbOuP4FU9UyoYajWbTOFZQ3Wy4kUHgQcNIvnqt7I0pEQ9xEmmuU3E0reWzh1AelgGumiq2QLL3yOzHbIjDdA8a4VQpBOuBjw1fA22hzNhEnC4LMAepp2R33PaRQyG4kh9Yk5KJ21XBBlfAeRRBY3mLRMMYHIGjp7p3WN1L16lLdXwFa%252fY34ThEgFluzzOm%252bftRL2zmBLpRweXR66sBAnRAI4jKzX4eRJemCGzKMcuDxSIDdDaVg7vR1De8pnFpDzdnsCdXPV2I1WUK5n0%253d&height=480&version=1
//  https://content.mediafly.com/proxy/output.pdf?o=2rPAvpnYAn7mAEu6mnSwEhKP3Z%2bc4IwyYEk3WH8ycnlxLrpPmHGDnvtzsLaWD7KZGogHA2aPaDrO90tTDPP4oXnh59Xzb%2bAH6dw%2byhjYbMxi%2fTbJ1oXat%2ba9joT93vXl1lq5soAfEUAnFY6fNyM5K1b%2b2Cm%2fOLY8IfI4cdBXX42RI%2f7Ah5SvNScT%2fJgx88h%2ftMcrFBOHP50NZim5kUkU%2fejy9wRVuwfQ4oZy%2bKlXBZS2ek%2bzbh4ac09zMz4U7W3kfGpjWluiS3KKei2KIYpJTJohlpa%2bmHp9Ax5GnJbmN%2bHEmrD1QXDAHKV%2bcxnJ6F%2blsTpXnUtvNmjd%2bTLPIY1Oenmws%2bpWssWUDHXZf%2blv8qmUHSRPb%2bxGGy6V5pSdvMllplvzxr%2fD5P4LQ4mU8%2bBnyjRl%2fZ%2bSyY5LRQomn4sA7BZkohEFzILGKcBxAkVO7ChS



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

server.get("/imgs/proxy/", function(req, res, next) {
    var url = req.query.url;

    if (url) {

        request.get(url)
            .on('response', function(response) {
                console.log('response', response.statusCode) // 200
                console.log('headers', response.headers['content-type']) // 'image/png'
            })
            .on('error', function(err) {
                console.log(err)
                res.json({
                    status: err
                });
                next();
            })
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
        var pdfToSvgConverter = new Inkscape(['--import-pdf -l out.svg']);

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