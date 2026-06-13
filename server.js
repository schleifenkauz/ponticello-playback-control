const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const os = require("os")

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let ponticello;
let controllers = new Set();

const commands = ["forward", "backward", "toggle", "volume"]
const updates = ["beat", "started", "playing", "stopped"]

let playing = false;

wss.on("connection", (ws) => {
    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "i-am-ponticello") {
            ponticello = ws;
            console.log("Connected Ponticello, notifying ", controllers.size, " controllers");
            controllers.forEach((ctrl) => { 
                ctrl.send(JSON.stringify({type:"ponticello-connected"}))
            })
            ws.on("close", () => { 
                ponticello = null;
                console.log("Closed Ponticello connection, notifying ", controllers.size, " controllers")
                controllers.forEach((ctrl) => ctrl.send(JSON.stringify({type:"ponticello-disconnected"})))
            }) 
        }

        if (data.type === "i-am-controller") {
            controllers.add(ws);
            if (playing) {
                ws.send(JSON.stringify({type:"started"}));
                ws.send(JSON.stringify({type:"playing"}))
            }
            if (ponticello) {
                ws.send(JSON.stringify({type: "ponticello-connected"}))
            }
            ws.on("close", () => { controllers.delete(ws) });
            console.log("Connected Controller");
        }

        if (commands.includes(data.type)) {
            if (data.type === "toggle") {
                if (playing) { data.type = "stop" }
                else { data.type = "start" }
            }
            if (ponticello) { 
                console.log(data);
                ponticello.send(JSON.stringify(data)); 
            }
        }

        if (updates.includes(data.type)) {
            if (data.type === "started") {
                playing = true;
            }
            if (data.type === "stopped") {
                playing = false;
            }
            console.log(data); 
            controllers.forEach((ctrl) => {
                ctrl.send(JSON.stringify(data));
            })
        }
    });
});

function getLocalIP() {
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {

      if (
        net.family === "IPv4" &&
        !net.internal &&
        !name.includes("Virtual") &&
        !name.includes("Docker")
      ) {
        return net.address;
      }
    }
  }
}

const port = process.env.PORT || 8080;
server.listen(port, "0.0.0.0", () => {
    const ip = getLocalIP();
    const url = `http://${ip}:${port}`;
    console.log("Client Adresse: ", url);
});