console.log("download script injected to new image tab");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.method === "check-download-script") {
    sendResponse("already loaded, proceed");
  }
  if (request.method === "download-current-image") {
    downloadImage();
    sendResponse("downloaded, proceed");
  }
});

downloadImage();

// gets image and downloads, then sends message back to background that process is complete
async function downloadImage() {
  let imageSrc = document.getElementsByTagName("img")[0].src;
  console.log(imageSrc);
  const image = await fetch(imageSrc, {
    mode: "no-cors",
  });
  const imageBlog = await image.blob();
  const imageURL = URL.createObjectURL(imageBlog);

  const link = document.createElement("a");
  link.href = imageURL;
  link.download = "image";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  let response = await chrome.runtime.sendMessage({
    method: "download-complete",
  });

  // console.log(response);
  window.close();

  console.log("close sucessful");
}
