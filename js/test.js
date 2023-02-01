"use strict";
// const startButton = document.getElementById("v1-btn");

// const video1 = document.querySelector("video#v1");

// startButton.onclick = getMedia;
const constraints = (window.constraints = {
  audio: true,
  video: true,
});
function gotStream(stream) {
  const video = document.querySelector("video");
  const videoTracks = stream.getVideoTracks();
  console.log("Got stream with constraints:", constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  console.log("Received local stream");
  video.srcObject = stream;
}

async function getMedia(e) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    gotStream(stream);
    console.log("스트림 연결");
    /* 스트림 사용 */
  } catch (e) {
    console.log(e, "안됨");
    /* 오류 처리 */
  }
}
document.querySelector("#v1-btn").addEventListener("click", (e) => getMedia(e));
