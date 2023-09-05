
const mime = require("mime");
import * as fs from "fs";

import { IncomingMessage, ServerResponse } from "http";
import { UrlWithParsedQuery } from "url";

export default class {
    name = "mixer";

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