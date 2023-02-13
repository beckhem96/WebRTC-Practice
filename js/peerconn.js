"use strict";

const startButton = document.getElementById("start-btn");
const hangupButton = document.getElementById("hangup-btn");

const localVideo = document.getElementById("local");
const remoteVideo1 = document.getElementById("remote1");
const remoteVideo2 = document.getElementById("remote2");
let pc;
let pc1Local;
let pc1Remote;
let pc2Local;
let pc2Remote;
let pc3Local;
let pc3Remote;
let localStream;
const offerOptions = {
  offerTOReceiveAudio: 1,
  offerTOReceiveVideo: 1,
};

const signaling = new BroadcastChannel("webrtc");
signaling.onmessage = (e) => {
  if (!localStream) {
    // 로컬 비디오 연결 안됐으면
    console.log("not ready");
    return;
  }
  switch (e.data.type) {
    case "offer":
      console.log("offer");
      handleOffer(e.data);
      break;
    case "answer":
      console.log("answer");
      handleAnswer(e.data);
      break;
    case "candidate":
      console.log("candidate");
      handleCandidate(e.data);
      break;
    case "ready":
      console.log("ready");
      //두 번째 탭이 들어오면 이 탭은 콜을 시작한다.
      if (pc) {
        console.log("이미 콜이 진행중");
        return;
      }
      makeCall();
      break;
    default:
      console.log("unhandled", e);
      break;
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

  signaling.postMessage({ type: "ready" });
};

function createPeerConnection() {
  pc = new RTCPeerConnection(); // 로컬과 원격 피어간 연결을 담당
  pc.onicecandidate = (e) => {
    // icecadidate는 특정 ICE candidate가 원격 피어에 전달되도록 피어 연결에 요청을 보냅니다.
    // onicecandidate 이벤트 핸들러 속성을 통해 사용이 가능합니다.
    const message = {
      type: "candidate",
      candidate: null,
    };
    console.log(e.candidate, "e.candidate");
    if (e.candidate) {
      // 이벤트에 candidate가 존재하면 원격 유저에게 candidate를 전달
      message.candidate = e.candidate.candidate;
      message.sdpMid = e.candidate.sdpMid;
      message.sdpMLineIndex = e.candidate.sdpMLineIndex;
    }
    signaling.postMessage(message);
  };
  // ontrack은 RTCPeerConnection에 트랙이 등롭됨을 알려주는 것
  pc.ontrack = (e) => {
    remoteVideo1.srcObject = e.streams[0];
    console.log(e);
  };
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
}

async function makeCall() {
  await createPeerConnection();

  const offer = await pc.createOffer();
  signaling.postMessage({ type: "offer", sdp: offer.sdp });
  await pc.setLocalDescription(offer);
}

async function handleOffer(offer) {
  if (pc) {
    console.error("existing peer connection");
    return;
  }
  await createPeerConnection();
  await pc.setRemoteDescription(offer); // 이거 뭔지 알아봐라

  const answer = await pc.createAnswer();
  signaling.postMessage({ type: "answer", sdp: answer.sdp });
  await pc.setLocalDescription(answer);
}

async function handleAnswer(answer) {
  if (!pc) {
    console.error("no peerconnection");
    return;
  }
  await pc.setRemoteDescription(answer);
}

async function handleCandidate(candidate) {
  if (!pc) {
    console.error("no peerconnection");
    return;
  }
  if (!candidate.candidate) {
    await pc.addIceCandidate(null);
  } else {
    await pc.addIceCandidate(candidate);
  }
}
