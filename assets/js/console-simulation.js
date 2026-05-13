const conversationData = [
  {
    prompt: "ping bridge",
    response:
      "Bridge active. Participants registered: gpt52, gem3f, cld46. Normalization layer synchronized to a unified reasoning workspace."
  },
  {
    prompt: "normalize and broadcast: Riemann hypothesis (adversarial mode)",
    response:
      "Canonical prompt issued. Round-robin synchronization complete; critique tokens exchanged with full provenance retained."
  },
  {
    prompt: "summarize convergence and deltas",
    response:
      "Converged at 99.4% fidelity. Residual deltas isolated to definitional framing and proof-step justification depth."
  },
  {
    prompt: "export raw cross-model exchange",
    response:
      "Export complete. Full conversational transcript, critique lineage, and attribution metadata serialized for audit and replay."
  }
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeText(element, text, speed = 40) {
  for (let i = 0; i < text.length; i += 1) {
    element.textContent += text.charAt(i);
    await wait(speed);
  }
}

export async function startConsoleSimulation() {
  const consoleWrapper = document.querySelector(".console-wrapper");
  const consoleContainer = document.getElementById("console-simulation");

  if (!consoleWrapper || !consoleContainer) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  if (sessionStorage.getItem("animationPlayed")) {
    consoleWrapper.style.display = "none";
    return;
  }

  for (const entry of conversationData) {
    const line = document.createElement("div");
    line.className = "console-line";

    const prefix = document.createElement("span");
    prefix.className = "prompt-prefix";
    prefix.textContent = "bridge %";
    line.appendChild(prefix);

    const textSpan = document.createElement("span");
    line.appendChild(textSpan);

    const cursor = document.createElement("span");
    cursor.className = "cursor";
    line.appendChild(cursor);

    consoleContainer.appendChild(line);

    await typeText(textSpan, entry.prompt, 50);
    await wait(800);
    cursor.remove();

    const responseDiv = document.createElement("div");
    responseDiv.className = "llm-response";
    consoleContainer.appendChild(responseDiv);
    await typeText(responseDiv, entry.response, 25);

    await wait(3000);

    if (conversationData.indexOf(entry) < conversationData.length - 1) {
      consoleContainer.innerHTML = "";
    }
  }

  consoleWrapper.style.opacity = "0";
  setTimeout(() => {
    consoleWrapper.remove();
    sessionStorage.setItem("animationPlayed", "true");
  }, 1000);
}
