// Display: Controls & Dialog
const mainMediaSection = document.getElementById("main-media-sect");
const streamBar = document.getElementById("stream-bar");
const muteButton = document.getElementById("mute-toggle");
const muteIcon = document.getElementById("mute-toggle-icon");
const helpButton = document.getElementById("help-button");
const helpBox = document.getElementById("help-box");
// Display: Stream Info
const infoCanvas = document.getElementById("stream-info-canvas");
const streamInfoContents = document.getElementById("stream-info-flex");
// Display: Stats
const statClientCounter = document.getElementById("stat-client-counter");
const statVideoStreamDot = document.getElementById("stat-videostream-dot");
const statVideoStreamState = document.getElementById("stat-videostream-state");
const statAudioStreamDot = document.getElementById("stat-audiostream-dot");
const statAudioStreamState = document.getElementById("stat-audiostream-state");
const colorInactive = '#FF7070';
const colorActive = '#4CFF00';
// Display: Chat
const chatToggle = document.getElementById("chat-toggle");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-message-input");
const chatMessagesFrame = document.getElementById("chat-box-messages-frame");
const chatScroll = document.getElementById("button-scroll-chat");

//const metaDiv = document.getElementById("metadata-div");
//const artDiv = document.getElementById("coverart-div");
const m_coverart = document.getElementById("cover-art");
const m_title = document.getElementById("m_title");
const m_artist = document.getElementById("m_artist");
const m_album = document.getElementById("m_album");
const m_track = document.getElementById("m_track");
const m_year = document.getElementById("m_year");
// Graphics
const fullscreenEnter = document.getElementById("fullscreen-enter");
//const fullscreenExit = document.getElementById("fullscreen-exit");

// VideoJS & Audio Player Init
const audioPlayer = document.getElementById("audioPlayer");
audioUnmute();
const videoPlayer = videojs('videoPlayer', {
    controls: false,
    autoplay: false,
    preload: 'auto',
    liveSync: 1,         // Stay close to the live edge
    overrideNative: true // Force Video.js HLS handling
});
////////////////////////////////////
////  AUTOPLAY BLOCK HANDLING   ////
////////////////////////////////////
const startStream = document.getElementById("start-stream-button-div");
startStream.style.display = "none";
autoplayIsBlocked = false;

audioPlayer.play().catch(() => { // Can either either video or audio elements being tested...
	console.log("Autoplay blocked by browser.");
	streamPrompt(true);
});

function streamPrompt(conf) {
	autoplayIsBlocked = conf;
	console.log("Prompt for user to start streams has appeared. Please press Start Stream.");
	videoPlayer.el().style.display = "none";
	startStream.style.display = "flex";
	audioForceMute();
}

function enableStream() {
	// Reveal videoJS and hide the Start Stream prompt.
	videoPlayer.el().style.display = "block";
	startStream.style.display = "none";
	autoplayIsBlocked = false;
	audioUnmute();
}

startStream.addEventListener("click", enableStream);
////////////////////////////////////
////  -----------------------   ////
////////////////////////////////////
//   Streams Handler   //
const suws = new WebSocket("ws://192.168.50.99:3001");
/////////////////////////
let clientCount = 1;
let videoStreamActive = false;
let audioStreamActive = false;
let coverArtExists = false;
let audioMetadata = "";
/////////////////////////
let currentAudioSrc = "";
let currentImgSrc = "";
let currentVideoSrc = "";
/////////////////////////

suws.onmessage = (event) => {
	
	let data = JSON.parse(event.data);
	
	// These checks will allow for the server to send singular variable updates.
	if ('connectedStreamClients' in data) { clientCount = data.connectedStreamClients; }
	if ('videoStreamActive' in data) { videoStreamActive = data.videoStreamActive; }
	if ('audioStreamActive' in data) { audioStreamActive = data.audioStreamActive; }
	if ('coverArtExists' in data) { coverArtExists = data.coverArtExists; }
	//if ('audioMetadata' in data) { audioMetadata = JSON.parse(data.audioMetadata); }
	if ('audioMetadata' in data && data.audioMetadata.trim() !== '') {
    	audioMetadata = JSON.parse(data.audioMetadata);
	}
	
	/*console.log(
	"LOCAL: Video Stream is active: ", videoStreamActive,
	"LOCAL: Audio stream is active: ", audioStreamActive,
	"LOCAL: Connected clients: ", clientCount,
	"LOCAL: Cover art found: ", coverArtExists,
	"LOCAL: Audio metadata: ", audioMetadata,
	
	"SERVER: Video Stream is active: ", data.videoStreamActive,
	"SERVER: Audio stream is active: ", data.audioStreamActive,
	"SERVER: Connected clients: ", data.connectedStreamClients,
	"SERVER: Cover art found: ", data.coverArtExists,
	//"SERVER: Audio metadata: ", audioMetadata,
	);*/
	
	
	if (coverArtExists) {
		if (m_coverart.src !== "/images/coverart/coverart.jpg") {
    		m_coverart.src = "/images/coverart/coverart.jpg";
    		currentImgSrc = "/images/coverart/coverart.jpg";
    	}
	} else {
		if (m_coverart.src !== "/images/coverart/placeholder-cover-art-black.png") {
			//console.log("COVER ART: Not detected. Reverting to fallback.");
			m_coverart.src = "/images/coverart/placeholder-cover-art-black.png"; // This is of course going to be dependent on the theme down the track...
			currentImgSrc = "/images/coverart/placeholder-cover-art-black.png";
		}
	}
    
    if (audioStreamActive) { // Audio source handler
    	revealAudioStreamInfo();
    	if (currentAudioSrc !== "/audio-stream" && !autoplayIsBlocked) {
    		audioPlayer.src = `/audio-stream?nocache=${Date.now()}`; // DO NOT Remove the added ?nocache=${Date.now()}. This has SOLVED the audio cache problem.
    		currentAudioSrc = "/audio-stream";
    		audioPlayer.loop = false;
    	}
    	
    } else {
    	hideAudioStreamInfo();	
    	if (currentAudioSrc !== "/audio/fallback-noise.wav" && !autoplayIsBlocked) {
    		//console.log("No active audio stream. Reverting to fallback.");
    		audioPlayer.src = "/audio/fallback-noise.wav";
    		audioPlayer.loop = true;
    		currentAudioSrc = "/audio/fallback-noise.wav";
    	}
    }
    
    if (videoStreamActive == true) { // Video source handler
        if (currentVideoSrc !== "/hls/xstream.m3u8" && !autoplayIsBlocked) {
            videoPlayer.src({ src: "/hls/xstream.m3u8", type: "application/x-mpegURL" });
            videoPlayer.play();
            currentVideoSrc = "/hls/xstream.m3u8";  // Update the current source
        } 
    } else {
        if (currentVideoSrc !== "/videos/xstream-fallback.mp4" && !autoplayIsBlocked) {
            //console.log("No active video stream. Reverting to fallback.");
            videoPlayer.src({ src: "/videos/xstream-fallback.mp4", type: "video/mp4" });
            videoPlayer.play();
            videoPlayer.loop(true);
            currentVideoSrc = "/videos/xstream-fallback.mp4";  // Update the current source
        }
    }
    
    // Update on-screen stats
    statClientCounter.innerText = clientCount;
    let vStatTextSwap = "";
    let aStatTextSwap = "";
    if(videoStreamActive == false){statVideoStreamDot.style.color = colorInactive;vStatTextSwap="Inactive";}else{statVideoStreamDot.style.color = colorActive;vStatTextSwap="Active";}
    if(audioStreamActive == false){statAudioStreamDot.style.color = colorInactive;aStatTextSwap="Inactive";}else{statAudioStreamDot.style.color = colorActive;aStatTextSwap="Active"}
    
    statVideoStreamState.innerText = vStatTextSwap;
    statAudioStreamState.innerText = aStatTextSwap;
    
    m_title.innerText = audioMetadata.TITLE || "Not Available";
	m_artist.innerText = audioMetadata.ARTIST || "Not Available";
	m_album.innerText = audioMetadata.ALBUM || "Not Available";
	m_track.innerText = audioMetadata.TRACK || "Not Available";
	m_year.innerText = audioMetadata.DATE || "Not Available";
	
};
////////////////////////////////////
//// AUDIO PLAYER FUNCTIONALITY ////
////////////////////////////////////
muteButton.addEventListener("click",toggleMute);

function toggleMute() {
	audioPlayer.muted = !audioPlayer.muted;
	console.log("Audio player is muted: ", audioPlayer.muted);
	updateMuteIco();
}

function audioForceMute() {
	audioPlayer.muted = true;
	updateMuteIco();
	audioPlayer.style.pointerEvents = "none";
}

function audioUnmute() {
	audioPlayer.muted = false;
	updateMuteIco()
	audioPlayer.style.pointerEvents = "auto";
}

function updateMuteIco() { // GUI - Dynamically update mute toggle icon based on current state
	muteIcon.src = audioPlayer.muted ? '/svg/sound-off-white-solid.svg' : '/svg/sound-on-white-solid.svg'; 
}
////////////////////////////////////
////       GUI Functions        ////
////////////////////////////////////
////	  Help & Info Box
let helpBoxVisible = false;
helpButton.addEventListener("click", revealHelpbox);
function revealHelpbox() {
	if (!helpBoxVisible) {
		helpBox.style.left = "0";
  		helpBox.style.opacity = "1";
  		helpBox.style.transition = "left .25s ease, opacity .5s ease";
  		helpBoxVisible = true;
	} else {
		helpBox.style.left = "-100%";
  		helpBox.style.opacity = "0";
  		helpBox.style.transition = "left .5s linear, opacity .25s linear";
  		helpBoxVisible = false;
	}
}

let chatBoxVisible = false;
chatToggle.addEventListener("click", revealChatBox);
function revealChatBox() {
	if (!chatBoxVisible) {
		chatBox.style.left = "0";
  		chatBox.style.opacity = "1";
  		chatBox.style.transition = "left .25s ease, opacity .5s ease";
  		//chatInput.autofocus = true;
  		chatBoxVisible = true;
	} else {
		chatBox.style.left = "100%";
  		chatBox.style.opacity = "0";
  		chatBox.style.transition = "left .5s linear, opacity .25s linear";
  		//chatInput.autofocus = false;
  		chatBoxVisible = false;
	}
}
////  Stream Info Canvas & Contents
// Stream Info Canvas should not visible initially.
let audioStreamInfoVisible = false;

function revealAudioStreamInfo() {
	infoCanvas.style.animationName = 'appear_expand';
	infoCanvas.style.animationDuration = '1.5s';
	infoCanvas.style.animationDirection = 'normal';
	infoCanvas.style.animationFillMode = 'both';
	infoCanvas.style.animationDelay = '0.5s';
	// Reveal metadata afterwards
	// NOTE: Stream info contents have their elements set to none in HTML by default.
	streamInfoContents.style.display = 'flex';
	streamInfoContents.style.animationDelay = '1.5s'; // Delay before this anim is important on reveal
	streamInfoContents.style.animationName = 'fade_in';
    streamInfoContents.style.animationDuration = '.75s';
    streamInfoContents.style.animationDirection = 'normal';
    streamInfoContents.style.animationFillMode = 'both';
    audioStreamInfoVisible = true;
}

function hideAudioStreamInfo() {
	if(audioStreamInfoVisible == true){
		// Hide metadata first
		streamInfoContents.style.animationDelay = '0s'; 
		streamInfoContents.style.animationName = 'fade_out';
    	streamInfoContents.style.animationDuration = '.25s';
    	streamInfoContents.style.animationDirection = 'normal';
    	streamInfoContents.style.animationFillMode = 'both';
    	// Then hide the canvas
		infoCanvas.style.animationName = 'contract_disappear';
		infoCanvas.style.animationDuration = '1.5s';
		infoCanvas.style.animationDirection = 'normal';
		infoCanvas.style.animationFillMode = 'both';
    	audioStreamInfoVisible == false;
    }
}

streamInfoContents.addEventListener('animationend', () => {
	if (streamInfoContents.style.animationName === 'fade_out') {
		streamInfoContents.style.display = 'none'; // Hide the element
	}
});
////////////////////////////////////
////       EVENT HANDLING       ////
////////////////////////////////////
// CHAT
const socket = io();

socket.on("chat message", (msg) => {

    const li = document.createElement("li");
    li.textContent = msg;
    
    if(bottomOfChatState == true){
    	document.getElementById("messages").appendChild(li);
    	chatMessagesFrame.scrollTop = chatMessagesFrame.scrollHeight;
    } else {
    	document.getElementById("messages").appendChild(li);
    }
    
});

chatInput.addEventListener("keypress", event => {
	if (event.key === "Enter" && chatInput.value !== "") {
    	sendMessage();
    	chatMessagesFrame.scrollTop = chatMessagesFrame.scrollHeight;
  	}
});

function sendMessage() {
	if(chatInput.value !== ""){
    	socket.emit("chat message", chatInput.value);
    	chatInput.value = "";
    }
}

// State to track if the user is at the bottom
let bottomOfChatState = true;

function handleChatScroll() {
	
	const currentlyAtBottom = bottomOfChat();
	// Detect and react to state changes
	if (currentlyAtBottom !== bottomOfChatState) {
    	bottomOfChatState = currentlyAtBottom;
    	console.log('User is at bottom:', bottomOfChatState);
	}
}

function bottomOfChat(deadzone = 10) {
  return chatMessagesFrame.scrollHeight - chatMessagesFrame.scrollTop - chatMessagesFrame.clientHeight <= deadzone;
}


chatMessagesFrame.addEventListener('scroll', handleChatScroll);

// Resize Stream Bar
window.addEventListener('load', () => {
  syncWidth(streamBar, mainMediaSection);
});

// Fullscreen Tricks
fullscreenEnter.addEventListener("click", () => {
    videoPlayer.requestFullscreen();
});
////////////////////////////////////
////         FUNCTIONS          ////
////////////////////////////////////

// Match an element's width with another element
function syncWidth(matchThis, withThat) {
  
  const observer = new ResizeObserver(() => {
    matchThis.style.width = `${withThat.offsetWidth}px`;
  });
  
  observer.observe(withThat);
}

//window.addEventListener('DOMContentLoaded', syncWidth(streamBar,videoPlayer));
/*window.addEventListener('DOMContentLoaded', () => {
  syncWidth(streamBar, videoPlayer.el());
  updateMuteIco();
});*/

/////////////////////////////////////
