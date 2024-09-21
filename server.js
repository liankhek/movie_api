const http = require("http"),
      fs = require("fs"),
      url = require("url");
const { dirname } = require("path");

const server = http.createServer((request, response) => { //request handler function
    const addr = request.url,
          q = new URL(addr, "http://" + request.headers.host);
    let filePath = "";

    // Log request URL and timestamp to log.txt
    const logEntry = `URL: ${addr}\nTimestamp: ${new Date()}\n\n`;
    fs.appendFile("log.txt", logEntry, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Added to log.");
        }
    });

    // Determine which file to serve based on the URL
    if (q.pathname.includes("documentation")) {
        filePath = `${__dirname}/documentation.html`;
    } else {
        filePath = "index.html";
    }

    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            throw err;
        }

        response.writeHead(200, { "Content-Type": "text/html"});//tells the server to add a header to the response that will be returned (along with the HTTP status code “200” for OK)
        response.write(data);
        response.end();
    });

}).listen(8080); //the server is set to listen for requests(response) on port 8080

console.log("Node Server is running on Port 3000");

