
const mime = require("mime");
const express = require("express");
const { ExpressPeerServer } = require('peer');


import * as fs from "fs";

import { IncomingMessage, ServerResponse } from "http";
import { UrlWithParsedQuery } from "url";
import hai from "./hai";
import genID from "./genID";

export default class mixer extends hai {
    name = "mixer";
    peerServer: any;
    expressApp = null;
    constructor(server: any = null, path: string = "/api/peer"){
        super();
        if(server != null){
            this.expressApp = express();
            this.peerServer = ExpressPeerServer(server,
                {
                    //port: 8880,
                    //path: '/peer',
                    debug: true,
                    generateClientId: genID,
                    //proxied: true,
                });
            this.expressApp.use(path, this.peerServer);
        }
    }

    match(request : IncomingMessage, extra : any){
        return extra.subdomain == "mixer";
    };

    run(request : IncomingMessage, response : ServerResponse, extra : any){
        
        //let fname = request.url.replace("..","").replace("\\","");
        let fname = (extra.url as UrlWithParsedQuery).pathname;
        if(fname == "/" || fname == ""){
            fname = "/mixer.index.html";
        }
        var path = __dirname + "/../static" + fname;
        fs.stat(path, function(err, stat){
            if((err==null) && !(fs.lstatSync(path).isDirectory())){
                response.writeHead(200, {"Content-Type": mime.getType(path)});
                var fstream = fs.createReadStream(path);
                fstream.pipe(response);
                return;
            } else {
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.write("404 - Not Found");
                response.end();
            }
        });
        return;
    };
};

