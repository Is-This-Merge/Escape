let seconds = 0;
const timerElement = document.getElementById("timer");

function updateTimer() {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    timerElement.textContent = String(minutes).padStart(2, "0") + ":" + String(remainingSeconds).padStart(2, "0");
    
    seconds++;
}

updateTimer();
setInterval(updateTimer, 1000);