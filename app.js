import fs from "fs/promises";
//import http from "http";
import { createServer } from "http";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";


const port = process.env.PORT || 4000;
const Data_Files = path.join("data", "links.json");

//Here we make a server and read the html file/page and display that. And at the end if the file isnot found print the message.

const saveLinks = async (links) => {
  await writeFile(Data_Files, JSON.stringify(links));
};

const serverFile = async (res, filePath, contentType) => {
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": contentType });
    res.end("404 Page not found.");
  }
};

const loadLink = async () => {
  try {
    let data = await readFile(Data_Files, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(Data_Files, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};

const server = createServer(async (req, res) => {
  //console.log(req.url);
  if (req.method === "GET") {
    if (req.url === "/") {
      return serverFile(res, path.join("public", "index.html"), "text/html");
    } 
    
    else if (req.url === "/style.css") {
      return serverFile(res, path.join("public", "style.css"), "text/css");
    } 
    
    else if (req.url === "/link") {
      const links = await loadLink();
      res.writeHead(200, { "Content-Type": "application/JSON" });
      return res.end(JSON.stringify(links));
    }
    else{
      const links = await loadLink();
      const shortCode = req.url.slice(1);
      console.log(req.url);
      if(links[shortCode]){
        res.writeHead(302, { location : links[shortCode]} );
        return res.end();
      }
      res.writeHead(404, {"Content-Type": "text/plain"});
      return res.end("Shortened URL isnot found.")

    }
  }

  if (req.method === "POST" && req.url === "/shorten") {
    const links = await loadLink();
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", async () => {
      console.log(data);
      let { url, shortCode } = JSON.parse(data);

      if (!url) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("URL is required.");
      }
      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

      if (links[finalShortCode]) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Short Code already Exit. Try another code.");
      }

      links[finalShortCode] = url;
      await saveLinks(links);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ shortCode: finalShortCode, url }));
    });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
