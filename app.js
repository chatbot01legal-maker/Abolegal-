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
