console.log("Content script injected");

observeMainContainer();

async function observeMainContainer() {
  var mainContainer;
  while (!mainContainer) {
    mainContainer = document.querySelector("#content");
    await new Promise((r) => setTimeout(r, 1000));
  }
  containerCallback();
  console.log("watching main container");
  let mainContainerObserver = new MutationObserver(containerCallback);
  mainContainerObserver.observe(mainContainer, { childList: true });
}

async function containerCallback() {
  console.log("main container changed");
  addButtonsToInitialPosts();

  let chats = document.querySelector(".b-chats");
  // console.log(chats);

  // add a listener to chats
  if (chats !== null) {
    let chatsObserver = new MutationObserver(chatsCallback);
    chatsObserver.observe(chats, { childList: true, subtree: true });
    console.log("observing chat");
  }
}

function chatsCallback(mutations) {
  // don't use callback when we're mutating the DOM (by adding download buttons)
  // that creates an infinite loop and crashes the browser
  if (
    mutations[0].addedNodes[0] !== undefined &&
    mutations[0].addedNodes[0].nodeType !== Node.COMMENT_NODE &&
    mutations[0].addedNodes[0].nodeType !== Node.TEXT_NODE
  ) {
    if (mutations[0].addedNodes[0].classList.contains("downloaddmbtn")) return;
  }

  let dmMedia = document.querySelectorAll(".b-post__media__item-inner");

  // append dm media button
  for (let media of dmMedia) {
    let dmContainer = media.closest(".b-chat__message__content");
    let numMedia = dmContainer.querySelectorAll(
      ".b-post__media__item-inner"
    ).length;
    // don't add buttons if already added to DM
    if (dmContainer.querySelectorAll(".downloaddmbtn").length === numMedia) {
      // console.log("buttons added already");
      continue;
    }
    let button = generateDmButton(media);
    dmContainer.appendChild(button);
  }
}

function generateDmButton(media) {
  var button = document.createElement("button");
  button.textContent = "Download";
  button.style.fontSize = "12px";
  button.style.borderRadius = "20px";
  button.style.backgroundColor = "rgb(1,174,240)";
  button.style.color = "white";
  button.style.paddingBottom = "4px";
  button.style.paddingTop = "4px";
  button.style.paddingLeft = "10px";
  button.style.paddingRight = "10px";
  button.style.marginRight = "6px";
  button.style.fontFamily = "Roboto";
  button.onclick = () => handleDmDownloadClick(media);
  button.classList.add("downloaddmbtn");
  return button;
}

async function handleDmDownloadClick(media) {
  // console.log("clicked")

  // // check service worker to see if subscription is active
  // let subscriptionActive = await chrome.runtime.sendMessage({
  //   method: "check-subscription",
  // });

  // if (subscriptionActive !== true) {
  //   // check service worker to see if free downloads are available
  //   let outOfFreebies = await chrome.runtime.sendMessage({
  //     method: "check-free-downloads",
  //   });
  //   if (outOfFreebies) {
  //     alert(
  //       "You have used all of your free downloads with OF Download Button. Please purchase a license key to continue downloading."
  //     );
  //     return;
  //   }
  // }
  // console.log("1");

  let downloadAllowed = await chrome.runtime.sendMessage({
    method: "download-allowed",
  });

  console.log(downloadAllowed);

  if (!downloadAllowed) {
    alert(
      "You have used all of your free downloads with OF Download Button. Please purchase a license key to continue downloading."
    );
    return;
  }

  // if media has an opened video
  if (media.querySelector("video")) {
    // console.log(media.querySelector("video"));
    downloadOpenVideo(media.querySelector("video"));
    return;
  }

  // if media has an unopened video
  if (media.querySelector(".video-js")) {
    console.log("download button video");
    let videoContainer = media.querySelector(".video-js");
    downloadVideo(videoContainer);
    return;
  }

  // if media is an image
  if (media.querySelector("img")) downloadImage(media.querySelector("img").src);

  console.log("download button end of script");
}

// call in case user starts session on a profile page (and maincontainer mutation never occurs)
addButtonsToInitialPosts();

async function addButtonsToInitialPosts() {
  // wait for post list container to load
  var postList;
  while (!postList) {
    postList = document.querySelector(".vue-recycle-scroller__item-wrapper");
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log("posts loaded, observing post list");

  // add observer to put buttons on newly loaded posts
  let postListObserver = new MutationObserver(postListCallback);
  postListObserver.observe(postList, { childList: true });

  // put buttons on initial loaded elements
  const initialPosts = postList.querySelectorAll(
    ".vue-recycle-scroller__item-view"
  );
  const pinnedPosts = document.querySelectorAll(".b-post__wrapper");

  const combinedLoadedInitial = Array.prototype.concat(
    ...initialPosts,
    ...pinnedPosts
  );

  // console.log(combinedLoadedInitial);

  // for each initial post, get media and insert button
  for (let post of combinedLoadedInitial) {
    let toolbar = post.querySelector(".b-post__tools");
    if (toolbar === null) continue;
    // if paywalled continue to next post
    // if (post.querySelector(".b-subscribe-block") !== null) continue;
    // if buttons added already don't add new ones
    if (toolbar.querySelectorAll(".downloadbtn").length !== 0) {
      continue;
    }
    // append buttons to all media posts
    appendButtons(post);
  }
}

// function getDownloadName(post) {
//   let userDiv = post.querySelector(".g-user-username");
//   let username = userDiv.innerText;
//   let timeDiv = post.querySelector(".b-post__date");
//   let timestamp = timeDiv.childNodes[0].innerText;
//   username = username.slice(1);
//   let date = new Date(timestamp);
//   let formattedDate = date.toLocaleDateString("en-US", {
//     month: "2-digit",
//     day: "2-digit",
//     year: "numeric",
//   });
//   let downloadName = username + "_" + formattedDate;

//   return downloadName;
// }

function downloadImage(src) {
  window.open(src, "_blank");
  chrome.runtime.sendMessage({
    method: "download-image",
    data: src,
  });
}

async function downloadVideo(element) {
  console.log(element);
  // attach observer to video and clicks it to download
  let observer = new MutationObserver(() => {
    let allVideos = document.getElementsByTagName("video");
    let videoElement = allVideos[allVideos.length - 1];
    // console.log(videoElement);
    // console.log(videoElement.querySelector('[label="original"]').src);
    let highQualitySrc = videoElement.querySelector('[label="original"]').src;
    window.open(highQualitySrc, "_blank");
    chrome.runtime.sendMessage({
      method: "download-video",
      data: highQualitySrc,
    });
  });
  observer.observe(element, { childList: true });

  element.click();

  // // get element x, y
  // let rect = element.querySelector("button").getBoundingClientRect();

  // let response = await chrome.runtime.sendMessage({
  //   method: "simulate-click",
  //   data: { x: rect.x, y: rect.y + 100 },
  // });
  // console.log(response);
}

function generateButton(mediaElement, post) {
  var button = document.createElement("button");
  button.textContent = "Download";
  button.style.borderRadius = "20px";
  button.style.backgroundColor = "rgb(1,174,240)";
  button.style.color = "white";
  button.style.marginLeft = "5px";
  button.style.marginRight = "5px";
  button.style.paddingLeft = "10px";
  button.style.paddingRight = "10px";
  button.style.fontFamily = "Roboto";
  button.onclick = () => handleDownloadButtonClick(mediaElement, post);
  button.classList.add("downloadbtn");
  return button;
}

async function handleDownloadButtonClick(mediaElement, post) {
  // // check service worker to see if subscription is active
  // let subscriptionActive = await chrome.runtime.sendMessage({
  //   method: "check-subscription",
  // });

  // console.log(subscriptionActive);

  // if (subscriptionActive !== true) {
  //   // check service worker to see if free downloads are available
  //   let outOfFreebies = await chrome.runtime.sendMessage({
  //     method: "check-free-downloads",
  //   });

  //   console.log(outOfFreebies);

  //   if (outOfFreebies) {
  //     alert(
  //       "You have used all of your free downloads with OF Download Button. Please purchase a license key to continue downloading."
  //     );
  //     return;
  //   }
  // }

  let downloadAllowed = await chrome.runtime.sendMessage({
    method: "download-allowed",
  });

  console.log(downloadAllowed);

  if (!downloadAllowed) {
    alert(
      "You have used all of your free downloads with OF Download Button. Please purchase a license key to continue downloading."
    );
    return;
  }

  if (mediaElement.classList.contains("m-object-contain")) {
    downloadImage(mediaElement.src);
    return;
  }

  // handle multiple video posts; sometimes the user has already clicked and generated video elements
  let openedVideos = post.querySelectorAll("video");
  let targetVideo = null;
  let thumbnail = mediaElement.querySelector("img").src;

  // if multiple videos open on the post, match against the poster thumbnail
  for (let video of openedVideos) {
    if (video.poster === thumbnail) targetVideo = video;
  }

  // if video open already
  if (targetVideo !== null) {
    downloadOpenVideo(targetVideo);
    return;
  }
  if (mediaElement.classList.contains("video-js")) {
    // process if video is unopened
    downloadVideo(mediaElement);
  }
  return true;
}

// take in a video element and download it
async function downloadOpenVideo(targetVideo) {
  // console.log(targetVideo);
  let highQualitySrc = targetVideo.querySelector('[label="original"]').src;
  window.open(highQualitySrc, "_blank");
  chrome.runtime.sendMessage({
    method: "download-video",
    data: highQualitySrc,
  });
}

// gets tab ID from background script and returns it
async function getCurrentTabId() {
  let tabId = await chrome.runtime.sendMessage({ method: "get-ig-tab-id" });
  return tabId;
}

function appendButtons(post) {
  let media = post.getElementsByClassName("post_media")[0];
  // don't add button to non-media posts
  if (!media) return;

  let mediaElements = media.querySelectorAll(".video-js,.m-object-contain");
  let reversedMedia = Array.from(mediaElements);
  reversedMedia.reverse();

  let toolbar = post.querySelector(".b-post__tools");

  // add a button for each media and insert it to the toolbar
  for (let media of reversedMedia) {
    let button = generateButton(media, post);
    toolbar.insertBefore(button, toolbar.childNodes[3]);
  }
}

function postListCallback(mutations) {
  // select all posts
  const allPosts = document.querySelectorAll(
    ".vue-recycle-scroller__item-view"
  );
  addMediaButtons(allPosts);
}

function addMediaButtons(container) {
  for (let post of container) {
    let toolbar = post.querySelector(".b-post__tools");
    if (!toolbar) continue;

    // if buttons added already don't add new ones
    if (toolbar.querySelectorAll(".downloadbtn").length !== 0) {
      continue;
    }

    appendButtons(post);
  }
}

let index = 0;

async function openNextImage() {
  let images = document.querySelectorAll(".m-object-contain");

  // break loop if all images have been saved
  if (index >= images.length) return;

  // opens image, and sends message to service worker to inject download script and save image
  window.open(images[index].src, "bingbong" + index);

  chrome.runtime.sendMessage(
    { method: "open-new-image", data: images[index].src },
    (res) => {
      console.log(res);
    }
  );
}

// listen for scrape button click from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.method === "get-images") {
    console.log("received get-images");
    openNextImage();
    sendResponse("received get-images");
  }
  if (request.method === "open-next-image") {
    index++;
    openNextImage();
  }
  if (request.method === "check-script") {
    sendResponse("already loaded, proceed");
    images = document.querySelectorAll(".m-object-contain");
    index = 0;
  }
});
