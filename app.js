function addMessage(text, sender) {
  const chatBox = document.getElementById("chat-box");

  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value;

  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    botResponse(text);
  }, 800);
}

function botResponse(text) {

  if (text.toLowerCase().includes("despid")) {
    addMessage("¿Tu contrato era indefinido o a plazo fijo?", "bot");
  } else if (text.toLowerCase().includes("arriendo")) {
    addMessage("¿Tienes contrato firmado con el arrendador?", "bot");
  } else {
    addMessage("Cuéntame un poco más sobre tu situación para orientarte mejor.", "bot");
  }

}

window.addEventListener("DOMContentLoaded", () => {

  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    gradient.addColorStop(0, "rgba(186,136,46,0.06)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.02)");
    gradient.addColorStop(1, "rgba(186,136,46,0.06)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 6; i++) {
      const y = (Math.sin(t * 0.002 + i) * 90) + i * 180;

      ctx.fillStyle = "rgba(186,136,46,0.07)";
      ctx.fillRect(0, y, canvas.width, 140);
    }

    t++;
    requestAnimationFrame(draw);
  }

  draw();

});


