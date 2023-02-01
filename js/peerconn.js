"use strict";

const startButton = document.getElementById("start-btn");
const hangupButton = document.getElementById("hangup-btn");

const localVideo = document.getElementById("local");
const remoteVideo = document.getElementById("remote");

let pc;
let localStream;

const signaling = new BroadcastChannel("test-server");
console.log(signaling);
signaling.onmessage = (e) => {
  if (!localStream) {
    // 로컬 비디오 연결 안됐으면
    console.log("not ready");
    return;
  }
  switch (e.data.type) {
    case "offer":
      handleOffer(e.data);
  }
};

startButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  localVideo.srcObject = localStream;

  startButton.disabled = true;
  hangupButton.disabled = false;
};

function createPeerConnection() {
  pc = new RTCPeerConnection(); // 로컬과 원격 피어간 연결을 담당
  pc.onicecandidate = (e) => {
    // icecadidate는 특정 ICE candidate가 원격 피어에 전달되도록 피어 연결에 요청을 보냅니다.
    // onicecandidate 이벤트 핸들러 속성을 통해 사용이 가능합니다.
    const message = {
      type: "candiate",
      candidate: null,
    };
    if (e.candidate) {
      // 이벤트에 candidate가 존재하면 원격 유저에게 candidate를 전달
      message.candidate = e.candidate.candidate;
      message.sdpMid = e.candidate.sdpMid;
      message.sdpMLineIndex = e.candidate.sdpMLineIndex;
    }
    signaling.postMessage(message);
  };
  // ontrack은 RTCPeerConnection에 트랙이 등롭됨을 알려주는 것
  pc.ontrack = (e) => (remoteVideo.srcObject = e.streams[0]);
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
}

async function handleOffer(offer) {
  if (pc) {
    console.error("existing peer connection");
    return;
  }
  await createPeerConnection();
  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  signaling.postMessage({ type: "answer", sdp: answer.sdp });
  await pc.setLocalDescription(answer);
}
