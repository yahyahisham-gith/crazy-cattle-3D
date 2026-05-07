// Function to create the warning overlay
function showAdblockWarning() {
    // Check if it already exists to avoid duplicates
    if (document.getElementById('ab-warning')) return;

    const warning = document.createElement('div');
    warning.id = 'ab-warning';
    warning.innerHTML = `
        <div class="ab-content">
            <h2>Adblock Detected</h2>
            <p>Our site depends on scripts to function correctly. Please consider disabling your adblocker.</p>
            <div id="ab-timer">Button appearing in 30s...</div>
            <button id="ab-reload" onclick="location.reload()">I've disabled it, reload</button>
            <button id="ab-continue" style="display:none;" onclick="document.getElementById('ab-warning').remove()">Continue with Adblock</button>
        </div>
    `;
    document.body.appendChild(warning);

    // Start the 30-second countdown
    let timeLeft = 30;
    const timerElement = document.getElementById('ab-timer');
    const continueBtn = document.getElementById('ab-continue');

    const countdown = setInterval(() => {
        timeLeft--;
        timerElement.innerText = `Button appearing in ${timeLeft}s...`;
        
        if (timeLeft <= 0) {
            clearInterval(countdown);
            timerElement.style.display = 'none';
            continueBtn.style.display = 'inline-block';
        }
    }, 1000);
}