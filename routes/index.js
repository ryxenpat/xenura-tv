const express = require('express');
const http = require('http');
const router = express.Router();
const x = express();
const fs = require('fs');
const path = require('path');
const { spawn } = require("child_process");
const { PassThrough } = require('stream');
const WebSocket = require('ws');
x.use(express.json());
//x.use(express.json({ limit: '50mb' })); // Adjust size as necessary
//x.use(nocache());
//const nocache = require('nocache');
///////////////////////////
// WEBSOCKETS & SERVERS ///
///////////////////////////
const suws = new WebSocket.Server({ port: 3001 }); // Stream Updates WebSocket
///////////////////////////
////   OUTPUT CONFIG   ////
///////////////////////////
const p_hls = path.join('public','hls');
const p_hls_m3u8 = 'public/hls/xstream.m3u8';
const hls_time = 1;
const hls_list_size = 3;
x.use(express.static(p_hls));
const p_coverart = 'public/images/coverart';
const p_coverart_img = 'public/images/coverart/coverart.jpg';
///////////////////////////
//// GLOBAL VARIABLES  ////
///////////////////////////
const updateInterval = 2000;
let clients = []; // Connected users
let audioMetadata = "";
let audioStreamActive = false;

let audioBuffer = Buffer.alloc(0);
const MIN_BUFFER = 40 * 1024;
const MAX_BUFFER = 1260 * 1024;
const BITRATE = 320 * 1024; // 320 kbps

let videoStreamActive = checkVideoStream();
let coverArtExists = checkCoverArt();
let connectedStreamClients = suws.clients.size;
///////////////////////////
//// NODE MEDIA SERVER ////
///////////////////////////
const NodeMediaServer = require('node-media-server');
const nmsRTMPConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 4096,
    gop: 30,
    ping: 30,
    ping_timeout: 60,
  },
};
const nms = new NodeMediaServer(nmsRTMPConfig);
////// EVENT HANDLING /////
hlsCleanup();

nms.on('postPublish', (id, StreamPath, args) => {
	console.log('[NodeEvent on postPlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
	hlsCleanup();
	rtmp2HLS();
});

nms.run();
///////////////////////////
////      ROUTES       ////
///////////////////////////

// GET home page. 
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Xenura Radio' });
	res.setHeader('Cache-Control', 'no-cache');
});

// On connection to Stream Update WebSocket
suws.on('connection', (ws) => {
	console.log('Client connected to Stream Notifier WebSocket');
	
	const status = checkVideoStream();
	const present = checkCoverArt();
	connectedStreamClients = suws.clients.size;
	ws.send(JSON.stringify({
		connectedStreamClients,
		videoStreamActive: status,
		audioStreamActive,
		coverArtExists: present,
		audioMetadata,
	}));
	
	ws.on('close', () => {
		console.log('Client disconnected from Stream Notifier WebSocket (PORT 3002)')
	});
});

///////////////////////////
////   POST REQUESTS   ////
///////////////////////////

// Handle incoming audio data
router.post("/audio-in", (req, res) => {

  	/*if (!req.body || req.body.length === 0) {
    	return res.status(400).send('No audio data received');
  	}*/

	console.log("POST: Audio stream received");
	audioStreamActive = true;

	suws.clients.forEach(client => { // Tell all clients that the audio stream is active
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify({
				audioStreamActive
			}));
		}
	});
	
	// Send incoming audio to clients
	req.on("data", (chunk) => {
		addAudioChunk(chunk);		
	});
	
	req.on("end", () => {
		console.log("Incoming audio stream has ended.");
		setTimeout(() => {
    		res.end();
    		clearAudioStream();
		}, 8000); // Clear after 8 sec
    });
    
	req.on("error", (err) => {
    	console.error("/audio-in error:", err);
  		setTimeout(() => {
    		res.end();
    		clearAudioStream();
		}, 8000); // Clear after 8 sec
    });
    
});

// Expecting a .json object from sender (ffprobe)
// Note that this is only set up to receive incoming metadata and store to global variable. No stream handling or checks are done here.
router.post("/meta-in", (req, res) => {
	
	console.log("POST: Metadata received");
	let body = "";
	req.on('data', (chunk) => {
        body += chunk;
    });

	req.on('end', () => {
		let info = JSON.parse(body);
	
		const getTag = (tags, key) => tags[key] || tags[key.toLowerCase()] || tags[key.toUpperCase()] || null;
		
		let preparedMetadata = JSON.stringify({
  		ALBUM: getTag(info.format.tags, 'album'),
  		ARTIST: getTag(info.format.tags, 'artist'),
  		TITLE: getTag(info.format.tags, 'title'),
  		DATE: getTag(info.format.tags, 'date'),
  		TRACK: getTag(info.format.tags, 'track'),
		});
		
		audioMetadata = preparedMetadata; // Set data for global variable
		console.log("Audio metadata has been processed.");
	});
	
});

// Expecting a img from sender (ffmpeg)
// Note that this is only set up to receive an incoming image and write to disk. No stream handling or checks are done here.
router.post("/cover-in", (req, res) => {
	
	console.log("POST: Cover art received");
	let imageData = Buffer.alloc(0); // Initialize an empty buffer
  	
	req.on('data', (chunk) => {
    	imageData = Buffer.concat([imageData, chunk]); // Append incoming data to the buffer
	});
	
	req.on('end', () => {
		fs.mkdirSync(path.dirname(p_coverart), { recursive: true }); // Make directory if it doesn't exist already
  		fs.rmSync(p_coverart_img, { recursive: true, force: true }); // Remove existing cover art if present
  		fs.writeFileSync(p_coverart_img, imageData);
     	console.log('Image saved!');
     	res.status(200).send('Image received and saved');
	});
  	
  	req.on('error', (err) => {
		console.error('Error saving image:', err);
		res.status(500).send('Failed to save image');
	});
	
});

///////////////////////////
////   GET REQUESTS    ////
///////////////////////////
router.get("/audio-stream", (req, res) => { // Serve the audio as a stream    	
    
    if(audioStreamActive == true){    	
    	
    	//res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  		//res.setHeader('Pragma', 'no-cache');
  		//res.setHeader('Expires', '0');
  		//res.setHeader('Cache-Control', 'no-cache');
  		//res.setHeader('Connection', 'keep-alive');
  		
    	res.writeHead(200, {
    		"Content-Type": "audio/mpeg",
    		"Transfer-Encoding": "chunked",
    		"Connection": "keep-alive"
    	});
    	
    	/*let cursor = audioBuffer.length; // Start at the live edge
    	// Send new chunks as they arrive
  		const interval = setInterval(() => {
    		if (cursor < audioBuffer.length) {
      		res.write(audioBuffer.slice(cursor));
      		cursor = audioBuffer.length; // Stay at the live edge
    		}
  		}, 40);*/
  		
  		// Keep streaming new audio as it arrives
  		const interval = setInterval(() => {
    		if (audioBuffer.length > 0) {
      		res.write(audioBuffer);
      		audioBuffer = Buffer.alloc(0); // Clear after sending
    		}
  		}, 100);
   	
    	req.on("end", () => {
    		console.log("Request for audio stream ended.");
    		clearInterval(interval);
    		res.end();
    	});
    	
    	req.on("close", () => {
    		//clients = clients.filter(client => client !== res);
    		console.log("Request for audio stream closed.");
    		clearInterval(interval);
    		res.end();
    	});
    	
    }else{
    	res.status(500).json({ error: "The audio stream was requested, however it is not active.", audioStreamActive });
    }
    
});

router.get("/hls", (req, res) => { // Output HLS .m3u8

	if(!checkVideoStream()) {
		console.log("STREAM REQUEST (MANUAL) FAILED")
		res.status(404).json({ error: "No active stream"});
		return;
	} else {
		res.sendFile('public/hls/xstream.m3u8');	
	}
		
});

///////////////////////////
//// FRONTEND UPDATES  ////
///////////////////////////

function updateClients() { // Update to clients.

		let status = checkVideoStream();
		let present = checkCoverArt();
		connectedStreamClients = suws.clients.size;
		
		suws.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify({
					connectedStreamClients,
					videoStreamActive: status,
					audioStreamActive,
					coverArtExists: present,
					audioMetadata,
				}));
			}
		});
		
		// Debug purposes
		/*console.log(
		"connectedStreamClients: ", connectedStreamClients,
		"videoStreamActive: ", status,
		"audioStreamActive: ", audioStreamActive,
		"coverArtExists: ", present,
		"audioMetadata: ", audioMetadata
		);*/
}

// Regularly send global variables to all clients.
setInterval(() => {
    updateClients();
}, updateInterval);

///////////////////////////
////  AUDIO FUNCTION   ////
///////////////////////////


function calculateBufferSize() { // Calculate adaptive buffer size based on active clients
  const bytesPerSecond = BITRATE / 8; // Convert kbps to bytes/sec
  const bufferPerClient = bytesPerSecond * 10; // 10s of audio
  return Math.min(MAX_BUFFER, Math.max(MIN_BUFFER, bufferPerClient * clients.size));
}

// Add new audio chunks, trim buffer to max size (circular behavior)
function addAudioChunk(chunk) {
  const targetSize = calculateBufferSize();
  audioBuffer = Buffer.concat([audioBuffer, chunk]);

  // Trim old data if buffer exceeds size
  if (audioBuffer.length > targetSize) {
    audioBuffer = audioBuffer.slice(audioBuffer.length - targetSize);
  }
}

function clearAudioStream() {
	// Only to be called by /audio-in. Reset the global variables and return res.end().
	
	fs.rmSync(p_coverart_img, { recursive: true, force: true });
	audioMetadata = ""
	audioStreamActive = false;
	audioBuffer = Buffer.alloc(0);
	
	suws.clients.forEach(client => { // Tell all clients that the audio stream is active
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify({
				audioStreamActive
			}));
		}
	});
	
	return true;
}

function checkCoverArt() { // Return true if cover art is present.
	return fs.existsSync(p_coverart_img);
}

function checkVideoStream() { // Return true if .m3u8 is present
	
	return fs.existsSync(p_hls_m3u8);
	
	/*if(!fs.existsSync(p_hls_m3u8)) {
		//console.log(".m3u8 was NOT FOUND. Stream is NOT ACTIVE.")
		return false;
	}*/
	
	/*const m3u8Stats = fs.statSync(p_hls_m3u8);
	const lastModified = new Date(m3u8Stats.mtime).getTime();
	//console.log(".m3u8 was FOUND. Stream is ACTIVE.");
	return (Date.now() - lastModified) < 10000;*/
};


// Cleanup HLS .m3u8 and .ts files 100ms after hls_time var
function hlsCleanup() {
	console.log("Performing HLS cleanup...");
	setTimeout(()=>{
		fs.rmSync(p_hls, { recursive: true, force: true });
		fs.mkdirSync(p_hls);
	}, hls_time*1000+500);
}

function rtmp2HLS() {
	
	console.log("RTMP Stream Handler: Starting ffmpeg and transcoding to HLS");
	
	const ffmpeg = spawn('ffmpeg', [
	'-i', 'rtmp://localhost/livexstream',
	'-preset','ultrafast',
	'-tune','zerolatency',
	'-flags','+low_delay',
	'-f', 'hls',
	'-hls_time', `${hls_time}`,
	'-hls_list_size', `${hls_list_size}`,
	'-hls_flags', 'delete_segments',
	'public/hls/xstream.m3u8'
	]);
	
	// Handle FFmpeg output and errors
  	ffmpeg.stdout.on('data', (data) => {
    	console.log(`RTMP Stream Handler: ffmpeg stdout: ${data}`);
  	});
  	
	ffmpeg.stderr.on('data', (data) => {
    	console.error(`RTMP Stream Handler: ffmpeg stderr: ${data}`);
  	});
	
	ffmpeg.on('close', (code) => {
		console.log(`RTMP Stream Handler: ffmpeg process exited with ${code}`);
		hlsCleanup();
		//res.sendStatus(200);
	});
}

module.exports = router;
