console.log(
  "This prints to the console of the service worker (background script)"
);

// Importing and using functionality from external files is also possible.
// importScripts("service-worker-utils.js");

let outOfFreebies = false;

async function getFreebies() {
  // check if freebies already initialized in localstorage
  let freebies = await chrome.storage.local.get(["freebies"]);
  // if not, initialize it to 3
  if (freebies.freebies === undefined) {
    freebies = 3;
    await chrome.storage.local.set({ freebies: freebies });
  }
  if (freebies.freebies <= 0) outOfFreebies = true;
  return freebies;
}
getFreebies();

// send "true" if freebies is 0, "false" if freebies is > 0
async function sendFreebies(sendResponse) {
  let freebies = await getFreebies();
  console.log("freebies sent: " + freebies.freebies);
  sendResponse(freebies.freebies === 0);
  return true;
}

async function decrementFreebies() {
  let freebies = await getFreebies();
  freebies = freebies.freebies - 1;
  await chrome.storage.local.set({ freebies: freebies });
  return freebies;
}

let instagramtab;

async function checkDownloadAllowed(sendResponse) {
  // sendResponse("received message on background");
  let subscriptionStatus = await chrome.storage.local.get(["subscribed"]);
  console.log(subscriptionStatus.subscribed);
  if (subscriptionStatus.subscribed !== true) {
    let freebies = await getFreebies();
    console.log(freebies.freebies);
    if (freebies.freebies <= 0) {
      console.log("sending false response");
      sendResponse(false);
    }
  }
  sendResponse(true);
  return true;
}

// verify if download is allowed
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.method === "download-allowed") {
    console.log("received download-allowed message");
    checkDownloadAllowed(sendResponse);
  }
  return true;
});

chrome.runtime.onMessage.addListener(async function (
  message,
  sender,
  sendResponse
) {
  if (message.method === "open-new-image") {
    console.log("receive open-new message");
    downloadImage(message.data);
    // console.log(sender);
    instagramtab = sender.tab.id;
    console.log(instagramtab);
    sendResponse("received open-new on background");
  }
  if (message.method === "get-ig-tab-id") {
    console.log("received get tabId message");
    sendResponse(sender.tab.id);
  }
  if (message.method === "download-complete") {
    console.log("received download complete message");
    // send message back to content script to open next image (if still images remaining), and pass url
    chrome.tabs.sendMessage(instagramtab, {
      method: "open-next-image",
    });

    sendResponse("background responded to download complete");
  }
  // if (message.method === "check-free-downloads") {
  //   sendFreebies(sendResponse);
  // }
  // if (message.method === "check-subscription") {
  //   checkSubscriptionStatus(sendResponse);
  // }
  // if (message.method === "simulate-click") {
  //   console.log("received simulate click message");
  //   console.log(message.data);
  //   simulateTrustedClick(message.data.x, message.data.y, sender.tab.id);
  // }
  if (message.method === "download-video") {
    console.log("received download video message");
    downloadVideo(message.data, message.downloadName);
  }
  if (message.method === "download-image") {
    downloadSingleImage(message.data, message.downloadName);
  }
});

// // click on dom when user downloads unloaded video
// async function simulateTrustedClick(x, y, tabId) {
//   console.log(x, y);
//   // attach debugger
//   // get x, y coordinates
//   // simulate click
//   chrome.debugger.attach({ tabId: tabId }, "1.3", () => {
//     chrome.debugger.sendCommand(
//       { tabId: tabId },
//       "Input.dispatchMouseEvent",
//       {
//         type: "mousePressed",
//         x: x,
//         y: y,
//         button: "left",
//         clickCount: 1,
//       }
//       // (e) => {
//       //   console.log("chrome debugger click: ", e);
//       //   chrome.debugger.detach({ tabId: tabId });
//       // }
//     );
//     console.log("debugger click");
//   });
// }

// // send subscription status to content script
// function checkSubscriptionStatus(sendResponse) {
//   chrome.storage.local.get(["subscribed"], (result) => {
//     console.log(result.subscribed);
//     sendResponse(result.subscribed);
//   });
//   return true;
// }

// download video
async function downloadVideo(sourceUrl) {
  // check for subscription status
  let subscriptionStatus = await getSubscriptionStatus();
  console.log(subscriptionStatus);
  if (subscriptionStatus === false || subscriptionStatus === undefined) {
    if (outOfFreebies) {
      console.log("no free downloads remaining");
      return;
    }
    console.log("downloading 1 video, decrementing freebies");
    decrementFreebies();
  }

  let videoTab = await getTab(sourceUrl);
  chrome.scripting.executeScript({
    target: { tabId: videoTab.id },
    files: ["downloadvideo.js"],
  });
}

// get subscription status from local storage and return it
async function getSubscriptionStatus() {
  let subscriptionStatus = await chrome.storage.local.get(["subscribed"]);
  return subscriptionStatus.subscribed;
}

// downloads single image
async function downloadSingleImage(sourceUrl) {
  // check for subscription status
  let subscriptionStatus = await getSubscriptionStatus();
  if (subscriptionStatus === false || subscriptionStatus === undefined) {
    if (outOfFreebies) {
      console.log("no free downloads remaining");
      return;
    }
    console.log("downloading 1 image, decrementing freebies");
    decrementFreebies();
  }

  let imageTab = await getTab(sourceUrl);
  chrome.scripting.executeScript({
    target: { tabId: imageTab.id },
    files: ["downloadsingleimage.js"],
  });
}

// gets tab that will open images
async function getTab(sourceUrl) {
  const tabs = await chrome.tabs.query({ url: sourceUrl, currentWindow: true });
  return tabs[0];
}

async function downloadImage(sourceUrl) {
  // TODO: only allow this to fire if user has subscription

  const tabs = await chrome.tabs.query({ url: sourceUrl, currentWindow: true });
  let imageTab = tabs[0];
  try {
    chrome.scripting.executeScript({
      target: { tabId: imageTab.id },
      files: ["downloadimage.js"],
    });
  } catch {
    console.log("FAILED TO EXECUTE SCRIPT");
  }
}
