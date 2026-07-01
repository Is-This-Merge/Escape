const problems = [
    {
        id: 1,
        title: "문제1",
        description: "문제1에 대한 설명",
        hint: "문제1에 대한 힌트"
    },
    {
        id: 2,
        title: "문제2",
        description: "문제2에 대한 설명",
        hint: "문제2에 대한 힌트"
    }
]

const problemElement = document.getElementById("problem");

function loadProblem(id) {
    const problem = problems.find(p => p.id === id);
    if (problem) {
        problemElement.innerHTML = `
            <div class="card">
                <h2 style="text-align: center;">${problem.title}</h2>

                <p style="text-align: center;">${problem.description}</p>

                <div class="card-footer" style="text-align: center;">
                    <div class="hint-btn" onclick="showHint(${problem.id})">
                        HINT (+5:00)
                    </div>
                </div>
            </div>
        `;
    } else {
        problemElement.innerHTML = "<p>문제를 찾을 수 없습니다.</p>";
    }
}

function showHint(id) {
    const problem = problems.find(p => p.id === id);
    if (problem) {
        alert(problem.hint);
    } else {
        alert("힌트를 찾을 수 없습니다.");
    }
    seconds += 300;
}

loadProblem(1);