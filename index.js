const http = require("http");
const Handlebars = require("handlebars");
const file = require("fs");
const AbortController = require('abort-controller');
const { execSync } = require("child_process");
const ytdlpPath = "yt-dlp.exe";

const invidiousjson = "https://api.invidious.io/instances.json?pretty=1&sort_by=type,users";
let apis = ["https://invidious.private.coffee/","https://invidious.protokolla.fi/",
    "https://invidious.perennialte.ch/","https://yt.cdaut.de/","https://invidious.materialio.us/",
    "https://yewtu.be/","https://invidious.fdn.fr/","https://inv.tux.pizza/",
    "https://invidious.privacyredirect.com/","https://invidious.drgns.space/","https://vid.puffyan.us",
    "https://invidious.jing.rocks/","https://youtube.076.ne.jp/","https://vid.puffyan.us/",
    "https://inv.riverside.rocks/","https://invidio.xamh.de/","https://y.com.sb/",
    "https://invidious.sethforprivacy.com/","https://invidious.tiekoetter.com/","https://inv.bp.projectsegfau.lt/",
    "https://inv.vern.cc/","https://invidious.nerdvpn.de/","https://inv.privacy.com.de/",
    "https://invidious.rhyshl.live/","https://invidious.slipfox.xyz/","https://invidious.weblibre.org/",
    "https://invidious.namazso.eu/","https://invidious.jing.rocks/"];
    fetch(invidiousjson)
    .then(r => r.json())
    .then((d) => {
        d.forEach((ar, count) => {
            if (d[count][0].indexOf(".onion") == -1){
                apis.push("https://"+d[count][0]+"/");
            }
        });
    })
    .catch((e) => {console.error(e)});
    let proxy = "socks4://88.210.37.186:40064";
    let proxygeturl = "https://raw.githubusercontent.com/JF6DEU/test1111/refs/heads/main/proxy.json";
    fetch(proxygeturl)
    .then(r => r.json())
    .then((d) => {
        proxy = d.proxy;
    })
    .catch((e) => {console.error(e)});

const server = http.createServer(async (request, response) => {
    let message;
    let urls = new URL(`http://${process.env.HOST ?? 'localhost'}${request.url}`);
    function returnTemplate(frompath, templatecontext){
        try{
            let templatedata = file.readFileSync(frompath, {encording: "UTF-8", flag: "r"}).toString();
            let template = Handlebars.compile(templatedata, {noEscape: true});
            return template(templatecontext);
        } catch(e){
            if (e.code == "ENOENT"){
                console.error("No such template!!");
            }
        }
    }
    if (request.url == undefined){
        message = returnTemplate("./templates/error/404.html", {requesturl:"undefined"}, 404);
    } else {
        switch(urls.pathname){
            case "/":
                response.writeHead(200, {
                    "Content-Type": "text/html"
                });
                message = returnTemplate("./templates/search.html", {});
                break;
            case "/css/reset.css":
                response.writeHead(200, {
                    "Content-Type": "text/css"
                });
                message = returnTemplate("./templates/css/reset.css", {});
                break;
            case "/suggest":
                if (urls.searchParams.get("q") == null){
                    response.writeHead(207, {
                        "Content-Type": "application/json"
                    });
                    message = returnTemplate("./templates/renderjson", {json: JSON.stringify({error: "Too short parameters."})});
                } else {
                    response.writeHead(200, {
                        "Content-Type": "application/json"
                    });
                    let suggest = [];
                    let params = urls.searchParams.get("q");
                    if (params.length >= 120){
                        params = "";
                    }
                    params = params.replace(".", "").replace("/", "").replace("&", "").replace("?", "");
                    suggestjson = await fetch("https://ac.duckduckgo.com/ac/?q="+params).then(r => r.json()).then(r => {return r});
                    suggestjson.forEach((rdata) => {
                        suggest.push(rdata.phrase);
                    });
                    message = returnTemplate("./templates/renderjson", {json: JSON.stringify(suggest)}, 200, "application/json");
                }
                break;
            case "/search":
                if (urls.searchParams.get("q") == null || urls.searchParams.get("page") == null){
                    response.writeHead(207, {
                        "Content-Type": "text/html"
                    });
                    message = returnTemplate("./templates/renderjson", {json: "<meta charset=UTF-8>誰やパラメータを渡してないやつ(っ °Д °;)っ"});
                } else {
                    response.writeHead(200, {
                        "Content-Type": "text/html"
                    });
                    let params = urls.searchParams.get("q");
                    let page = urls.searchParams.get("page");
                    if (isNaN(Number(page))){
                        page = 1;
                    }
                    page = Number(page);
                    if (page >= 200){
                        page = 1;
                    }
                    if (params.length >= 120){
                        params = "";
                    }
                    params = params.replace(".", "");
                    params = encodeURIComponent(params);
                    let searchresult = await fetchapi(`api/v1/search?q=${params}&page=${page}&hl=jp`);
                    message = returnTemplate("./templates/searchresult.html", {returned: JSON.stringify(searchresult)});
                }
                break;
            case "/watch":
                let outform = {};
                fetch(proxygeturl)
                .then(r => r.json())
                .then((d) => {
                    proxy = d.proxy;
                })
                .catch((e) => {console.error(e)});
                if (urls.searchParams.get("v") == null || urls.searchParams.get("v").length >= 50){
                    response.writeHead(207, {
                        "Content-Type": "text/html"
                    });
                    message = returnTemplate("./templates/renderjson", {json: "<meta charset=UTF-8>誰やパラメータを渡してないやつ(っ °Д °;)っ"});
                } else {
                    response.writeHead(200, {
                        "Content-Type": "text/html"
                    });
                    let v = urls.searchParams.get("v").replace(".", "").replace("/", "").replace("&", "").replace("?", "").replace("|", "").replace("(", "").replace(")", "");
                    let getresult;
                    try{
                        getresult = execSync(ytdlpPath+" --proxy \""+proxy+'\" --dump-json https://youtu.be/'+v).toString();
                        outform = JSON.stringify(JSON.parse(getresult).formats);
                    } catch(e) {
                        getresult = {};
                    }
                    message = returnTemplate("./templates/watch.html", {formats: outform});
                }
                break;
            default:
                response.writeHead(404, {
                    "Content-Type": "text/html"
                });
                message = returnTemplate("./templates/error/404.html", {requesturl:request.url});
                break;
        }
    }
    response.end(message);
});
async function fetchapi(urls, type="json"){
    try{
        async function fetchCore(url) {
            let option = {};
            const controller = new AbortController();
            const timeout = setTimeout(() => { controller.abort() }, option.timeout || 15000); //15s
            try {
                const response = await fetch(url, {
                    signal: controller.signal // for timeout
                });
                if (!response.ok) {
                    const description = `status code:${response.status} , text:${response.statusText}`;
                    throw new Error(description);
                }
                return response;
            } catch(e) {
                if (e.code == "ECONNREFUSED" || e.code == "ENOTFOUND" || e.toString() == "TypeError: fetch failed"){
                    apis.shift();
                    throw new Error("API timed out");
                } else {
                    throw new Error("Other error"+e);
                }
            } finally {
                clearTimeout(timeout);
            }
        }
        const response = await fetchCore(apis[0]+urls);
        const respdata = await response.json();
        return new Promise(async (r) => r(respdata));
    } catch(e) {
        if (e.toString().split(":")[0] == "SyntaxError"){
            return new Promise((r) => r(undefined));
        }
        return new Promise(async (r) => r(await fetchapi(urls)));
    }
}

server.listen(4338);