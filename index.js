/*
* Primary file for the API
*
*/

// Dependencies
const http = require('http');
const https =  require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const _data = require('./lib/data');



// TESTING
// @TODO delete this
_data.create('test', 'newfile', {'foo' : 'bar'}, err => {
  console.log('This was the error', err);
  
})

// Instantiating the HTTP server
const httpServer = http.createServer( (req, res) => {
  unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
  console.log(`The server is listening on port ${config.httpPort}`); 
});

// Instantiating the HTTPS server
const httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')
};

const httpsServer = https.createServer(httpsServerOptions, function(req, res) {
  unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log(`The server is listening on port ${config.httpsPort}`); 
});



// All the server logic for both the http and https server
const unifiedServer = (req, res) => {
  // Get the URL and parse it
  const parsedUrl =  url.parse(req.url, true);

  // Get the path from that URL
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  const queryStringObj = parsedUrl.query;

  // Get the HTTP Method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found, use the noFound handler
    let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    let data = {
      'trimmedPath' : trimmedPath,
      'queryStringObj' : queryStringObj,
      'method' : method,
      'headers' : headers,
      'payload' : buffer
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, ( statusCode, payload ) => {
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // Use the payload called back by the handler, or default to empty object
      payload = typeof(payload) == 'object' ? payload : {};

      // Convert the payload to a string
      let payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the respond statuscode and payload that is converted to string
      console.log(`Request received with these headers: `, statusCode, payloadString );
    });
  });
};

// Define the handlers
const handlers = {};

// Sample handler
handlers.sample = ( data, callback ) => {
  // Callback a http status code, and a payload object
  callback(406, {'name' : 'sample handler'});
};

// Ping handler
handlers.ping = ( data, callback ) => {
  // Callback a http status code, and a payload object
  callback(200);
};


// Hello handler
handlers.hello = ( data, callback ) => {
  // Callback a http status code, and a payload object
  callback(200, {'message' : 'Hello there my friend'});
};

// Not found handler
handlers.notFound = ( data, callback ) => {
  callback(404);
};

// Define a request router
const router = {
  'ping' : handlers.ping,
  'hello' : handlers.hello
};