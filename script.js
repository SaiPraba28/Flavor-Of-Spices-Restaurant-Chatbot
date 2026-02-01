const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";

let cart = [];
let stage = "start"; // controls flow

/* PRICE LIST */
const prices = {
  "idli": 40,
  "dosa": 60,
  "pongal": 70,
  "sambar sadham": 90,
  "rasam sadham": 80,

  "chicken biriyani": 150,
  "mutton biriyani": 250,
  "prawn biriyani": 200,
  "chicken friedrice": 200,
  "chicken noodles": 200,
  "chicken 65": 150,
  "chicken chettinad": 180,

  "tandoori quarter": 150,
  "tandoori half": 250,
  "tandoori full": 450
};

const unavailableItems = ["mutton biriyani"];
const discount = 0.1;

/* UI */
function sendMessage() {
  const input = document.getElementById("userInput");
  const msg = input.value.trim();
  if (!msg) return;

  addMessage(msg, "user");
  input.value = "";
  handleMessage(msg.toLowerCase());
}

function addMessage(text, sender) {
  const chat = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = sender === "user" ? "user-message" : "bot-message";
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

/* VOICE */
function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-IN";
  recognition.start();
  recognition.onresult = e => {
    document.getElementById("userInput").value = e.results[0][0].transcript;
    sendMessage();
  };
}

/* MAIN FLOW */
async function handleMessage(msg) {

  /* STEP 1: START ORDER */
  if (msg.includes("order")) {
    stage = "menu";
    addMessage(
`🍽️ MENU – Flavors of Spices

🥣 Breakfast
• Idli – ₹40
• Dosa – ₹60
• Pongal – ₹70

🍛 Rice
• Sambar Sadham – ₹90
• Rasam Sadham – ₹80

🍗 Non-Veg
• Chicken Biriyani – ₹150
• Mutton Biriyani – ₹250
• Prawn Biriyani – ₹200
• Chicken Fried Rice – ₹200
• Chicken Noodles – ₹200
• Chicken 65 – ₹150
• Chicken Chettinad – ₹180

🔥 Tandoori
• Quarter – ₹150
• Half – ₹250
• Full – ₹450

👉 Type: add chicken biriyani`, "bot");
    return;
  }

  /* STEP 2: ADD FOOD */
  if (msg.startsWith("add")) {
    const item = msg.replace("add", "").trim();

    if (unavailableItems.includes(item)) {
      addMessage(`🙏 Sorry, ${item} is currently not available.`, "bot");
      return;
    }

    if (prices[item]) {
      cart.push(item);
      addMessage(`✅ ${item} added.\nType: view cart`, "bot");
    } else {
      addMessage("❌ Item not found. Please choose from menu.", "bot");
    }
    return;
  }

  /* STEP 3: VIEW CART */
  if (msg.includes("view cart")) {
    if (!cart.length) {
      addMessage("🛒 Your cart is empty.", "bot");
      return;
    }

    addMessage(`🛒 Your Cart:\n${cart.join(", ")}\n\nType: checkout`, "bot");
    return;
  }

  /* STEP 4: CHECKOUT + BILL */
  if (msg.includes("checkout")) {
    addMessage(generateBill(), "bot");
    addMessage(
`💳 PAYMENT OPTIONS:
✔ GPay
✔ Cash on Delivery
✔ UPI ID: flavorsofspices@upi

Type: payment confirmed`, "bot");
    return;
  }

  /* STEP 5: CONFIRM PAYMENT */
  if (msg.includes("payment")) {
    addMessage(
`✅ ORDER CONFIRMED 🎉
🍽️ Your food is being prepared.
⏳ Please wait for delivery.
Thank you for ordering with Flavors of Spices!`, "bot");
    cart = [];
    stage = "start";
    return;
  }

  /* FALLBACK AI */
  const aiReply = await chatGPT(msg);
  addMessage(aiReply, "bot");
}

/* BILL */
function generateBill() {
  let total = 0;
  let bill = "🧾 BILL RECEIPT\n\n";

  cart.forEach(item => {
    bill += `${item.toUpperCase()} – ₹${prices[item]}\n`;
    total += prices[item];
  });

  const discountAmount = total * discount;
  const finalAmount = total - discountAmount;

  bill += `\nSubtotal: ₹${total}`;
  bill += `\nDiscount (10%): -₹${discountAmount}`;
  bill += `\n-------------------`;
  bill += `\nTotal: ₹${finalAmount}`;

  return bill;
}

/* CHATGPT */
async function chatGPT(message) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a polite restaurant assistant for Flavors of Spices." },
        { role: "user", content: message }
      ]
    })
  });
  const data = await res.json();
  return data.choices[0].message.content;
}
