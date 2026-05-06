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

    // Fondo base oscuro suave
    const bg = ctx.createRadialGradient(
      canvas.width * 0.5,
      canvas.height * 0.4,
      100,
      canvas.width * 0.5,
      canvas.height * 0.5,
      canvas.width
    );

    bg.addColorStop(0, "rgba(24, 33, 58, 0.6)");
    bg.addColorStop(1, "rgba(15, 23, 42, 1)");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // “luces suaves flotantes”
    for (let i = 0; i < 8; i++) {

      const x = canvas.width * (0.2 + i * 0.1);
      const y = canvas.height * 0.5 + Math.sin(t * 0.001 + i) * 80;

      const glow = ctx.createRadialGradient(x, y, 0, x, y, 200);

      glow.addColorStop(0, "rgba(186,136,46,0.08)");
      glow.addColorStop(1, "rgba(186,136,46,0)");

      ctx.fillStyle = glow;

      ctx.beginPath();
      ctx.arc(x, y, 220, 0, Math.PI * 2);
      ctx.fill();
    }

    t++;
    requestAnimationFrame(draw);
  }

  draw();

});


