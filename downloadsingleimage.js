console.log("download image script injected to new tab");

downloadImage();

// gets image and downloads
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

  console.log("download complete");

  window.close();
}
