
let ws;

const btn_connect = document.getElementById("btn-connect")

const controls = document.getElementById("controls")
const measureNumber = document.getElementById("measure-number")
const beatsPerBar = document.getElementById("beats-per-bar")
const currentBeat = document.getElementById("current-beat")
const toggle_icon = document.getElementById("toggle-icon")
const position_info = document.getElementById("status-bar")
const btn_toggle = document.getElementById("btn-toggle")
const btn_backward = document.getElementById("btn-backward")
const btn_forward = document.getElementById("btn-forward")
const waiting_message = document.getElementById("waiting-message")

async function connect() {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${location.host}`);

    ws.onopen = () => {
        console.log("Connected!");
        btn_connect.style.display = "none";
        waiting_message.classList.remove("hidden");
        toggle_icon.innerHTML = "play_arrow";
        send_command("i-am-controller");
    }

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data)

        console.log(data.type)

        if (data.type === "ponticello-connected") {
            waiting_message.classList.add("hidden")
            controls.classList.remove("hidden")
        }

        if (data.type === "ponticello-disconnected") {
            waiting_message.classList.remove("hidden")
            controls.classList.add("hidden")
            position_info.classList.add("hidden")
        }

        if (data.type === "started") {
            console.log("Started")
            position_info.classList.remove("hidden")
            btn_forward.classList.remove("hidden")
            btn_backward.classList.remove("hidden")
            toggle_icon.innerHTML = "stop"
        }

        if (data.type === "stopped") {
            console.log("Paused")
            toggle_icon.innerHTML = "play_arrow"
            measureNumber.innerHTML = "0"
            beatsPerBar.innerHTML = "?"
            currentBeat.innerHTML = "?"
            position_info.classList.add("hidden");
            btn_backward.classList.add("hidden");
            btn_forward.classList.add("hidden")
        }
        if (data.type === "beat") {
            measureNumber.innerHTML = data.measureNumber
            beatsPerBar.innerHTML = data.beatsPerBar
            currentBeat.innerHTML = data.currentBeat
            flashBeatBackground()
        }
    }
}

async function send_command(cmd) {
    const msg = JSON.stringify({ type: cmd });
    ws.send(msg);
}

async function forward() {
    send_command("forward")
}

async function backward() {
    send_command("backward")
}

async function toggle_play() {
    send_command("toggle")
}

function flashBeatBackground() {

    const app = document.getElementById("app");

    app.classList.remove("beat-flash");

    // restart animation
    void app.offsetWidth;

    app.classList.add("beat-flash");
}

const volumeSlider = document.getElementById("volume-slider");

const volumeValue = document.getElementById("volume-value");


volumeSlider.addEventListener("input", () => {
    const volume = volumeSlider.value;
    volumeValue.textContent = volume + "%";

    ws.send(
        JSON.stringify({
            type: "volume",
            value: Number(volume)
        })
    );
}
);