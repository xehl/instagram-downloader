console.log("download video script injected to new tab");

downloadVideo();

// gets video and downloads
async function downloadVideo() {
  let videoSrc = document.getElementsByTagName("source")[0].src;
  console.log(videoSrc);
  document.querySelector("video").pause();
  const video = await fetch(videoSrc, {
    mode: "no-cors",
  });
  const videoBlob = await video.blob();
  const videoURL = URL.createObjectURL(videoBlob);

  const link = document.createElement("a");
  link.href = videoURL;
  link.download = "vid";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.close();
}

// make container to sit on whole page
let spinnerContainer = document.createElement("div");
spinnerContainer.setAttribute("id", "spinner-container");

let spinner = document.createElement("div");
spinner.setAttribute("class", "lds-dual-ring");

let downloadText = document.createElement("div");
downloadText.setAttribute("id", "download-text");
downloadText.innerText =
  "Encoding video for download. This tab will close automatically when download is complete.";

spinnerContainer.appendChild(spinner);
spinnerContainer.appendChild(downloadText);
document.body.appendChild(spinnerContainer);

let stylesheet = document.createElement("style");
stylesheet.innerHTML = `
#spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  z-index: 5;
}
#download-text {
  margin-top: 25px;
  font-family: Helvetica;
  color: white;
  font-size: 18px;
  width: 300px;
  text-align: center;
  z-index: 5;
}
.lds-dual-ring {
  display: inline-block;
  width: 80px;
  height: 80px;
}
.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 64px;
  height: 64px;
  margin: 8px;
  border-radius: 50%;
  border: 6px solid #fff;
  border-color: #fff transparent #fff transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}`;
document.head.appendChild(stylesheet);
