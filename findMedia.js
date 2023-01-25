

images = document.querySelectorAll("img") // a list of all img tags
photos = []
images.forEach((img) => {if(img.alt.startsWith("Photo by")){photos.push(img)}})
photos //  a list of all timeline photos, we can render a download button for each one that looks like:
// <a href=photo.src download>Download</a>
// a.click() // this will download the photo


videos = document.querySelectorAll("video") // a list of all video tags
videos // all videos should have a download button
// <a href=video.src download>Download</a>
// a.click() // this will download the video