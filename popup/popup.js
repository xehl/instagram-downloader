let scriptButton = document.getElementById("loadscript");
scriptButton.addEventListener("click", handleGetImagesClick);

// get freebies count from local storage and display it
async function updateFreebies() {
  let freebies = await chrome.storage.local.get(["freebies"]);
  document.getElementById("downloads").innerHTML = freebies.freebies
    ? freebies.freebies
    : 0;
  // if freebies is 0, change color to red
  if (freebies.freebies === 0) {
    document.getElementById("downloads").style.backgroundColor = "red";
  }
}
updateFreebies();

// hides payment content if user has a subscription
async function checkSubscription() {
  let subscription = await chrome.storage.local.get(["subscribed"]);
  if (subscription.subscribed === true) {
    let paymentContent = document.getElementById("payment-content");
    paymentContent.remove();
  }
}
checkSubscription();

async function handleGetImagesClick() {
  // TODO: if user doesn't have a premium account, don't allow this button to fire

  // get subscription status from local storage
  let subscription = await chrome.storage.local.get(["subscribed"]);
  if (subscription.subscribed === true) {
    console.log("get images button clicked");
    let currentTab = await getCurrentTab();
    chrome.tabs.sendMessage(currentTab.id, { method: "get-images" });
  } else {
    // append red text to button saying "you need a subscription to use this feature"
    let button = document.getElementById("loadscript");
    let text = document.createElement("p");
    text.innerHTML = "You need a subscription to use this feature";
    text.style.color = "red";
    text.style.fontWeight = "bold";
    button.replaceWith(text);
  }
}

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

// async function getCurrentTab() {
//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     console.log(tabs);
//     return tabs[0];
//   });

chrome.runtime.onMessage.addListener(async function (message) {
  if (message.method === "window") {
    console.log(message.data);
  }
});

function validateSubscription(licensekey) {
  let url = `https://api.gumroad.com/v2/licenses/verify?product_id=nxXL8wPWuaL9MO-LLavQSw==&license_key=${licensekey}`;
  fetch(url, {
    method: "POST",
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data.success === true) {
        chrome.storage.local.set({ subscribed: true });
        paymentSuccessful();
      }
    });
}

let licenseContainer = document.getElementById("licensecontainer");

licenseContainer.addEventListener("submit", (e) => {
  e.preventDefault();
  let licensekey = document.getElementById("licensekey").value;
  console.log(licensekey);
  try {
    validateSubscription(licensekey);
  } catch {
    console.log("error validating subscription");
  }
});

function paymentSuccessful() {
  let paymentContent = document.getElementById("payment-content");
  alert("License activated! Enjoy unlimited access to Instaloader.");
  paymentContent.remove();
}
