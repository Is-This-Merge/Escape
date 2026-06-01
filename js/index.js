console.log("JS 연결 성공");


window.onload = function () {

    const title = document.getElementById("title");
    const startButton = document.getElementById("start-button");
    const guideButton = document.getElementById("guide-button");

    title.style.opacity = 0;
    startButton.style.opacity = 0;
    guideButton.style.opacity = 0;

    title.style.transition = "opacity 1s ease-in-out";
    startButton.style.transition = "opacity 1s ease-in-out";
    guideButton.style.transition = "opacity 1s ease-in-out";

    setTimeout(() => {
        title.style.opacity = 1;
    }, 300);

    setTimeout(() => {
        startButton.style.opacity = 1;
    }, 1300);

    setTimeout(() => {
        guideButton.style.opacity = 1;
    }, 1800);

    setInterval(() => {
        title.style.opacity = 0.8;

        setTimeout(() => {
            title.style.opacity = 1;
        }, 500);

    }, 3000);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            const startButton = document.getElementById("start-button");

            if(startButton) {
                window.location.href = "playing.html";
            }
        }
    });



};