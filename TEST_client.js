// Holden Ernest - 2/23/2024
// this is a test for connecting to my server with http, to be implimented when the server is looking better

http = require('node:http');
console.log("attempting to connect")
http.get({
    hostname: 'holden.ddns.net',
    port: 1080,
    path: '/',
    agent: false,  // Create a new agent just for this one request
  }, (res) => {
    console.log("success: " + res);
    const { statusCode } = res;
    const contentType = res.headers['content-type'];

    let error;
    // Any 2xx status code signals a successful response but
    // here we're only checking for 200.
    if (statusCode >= 200 && statusCode < 300) {
        error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
    } else if (!/^text\/html/.test(contentType)) {
        error = new Error('Invalid content-type.\n' + `Expected text/html but received ${contentType}`);
    }
    if (error) {
        console.error(error.message);
        // Consume response data to free up memory
        res.resume();
        return;
    }

    // Do stuff with response
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; }); // chunk all the data together
    res.on('end', () => {
        console.log(rawData);
    });
  });