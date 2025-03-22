//// HTML Related
const ezStyle_CentreText = "font-size:16pt;text-align:center;opacity:0;transition:opacity 1s linear;"
const frame = document.getElementById("frame");
const frame404Img = document.getElementById("img-404");
let count = 0;

//// Game Related
//	Input
let mouseX;
let mouseY;
let upPressed = false;
let downPressed = false;
let leftPressed = false;
let rightPressed = false;

// 	Time
let gameRunning = false;
let gameActive = false;
let keyframe = 0;
let frameTime = 1000;

//	Canvas
const gameCanvas = document.createElement("canvas");
gameCanvas.style.cssText = "height:100%;width:100%;background-color:rgb(32,32,32);opacity:0;transition:opacity 1s linear;"
const ctx = gameCanvas.getContext("2d");
let canvasElemWidth;
let canvasElemHeight;
let canvasCentreX = gameCanvas.width / 2;
let canvasCentreY = gameCanvas.height / 2;

//// Game: Global
// gameObjects
let gameObjects = [];

//// Entity: Enemy
// Global
let enemy;


// Array
let projectiles = []; // Array to store projectiles
////////////////////////////////////////////////////////
// Player Class
let player = {

	// Stats				
	level:			1,					// Player level will affect attack behaviour and other things
	health:			100,				
	moveSpeed: 		1 * frameTime,		// for transform in update()
	
	// Transform
	size:			64,					// Ideally this should be x, y but for now it's 1:1 aspect ratio
	pos:	{							// Initialize in center of canvas
		x:			canvasCentreX,
		y:			canvasCentreY,
	},
	mouse:		{
		pos:		{ x: 0 , y: 0 },
		angle: 		0,					// Angle: Ship -> Mouse, populated by update() angleToMouse
		distance:	0,
	},
	front: 			getShipFront(),
	
	// Canvas Related
	sprite: {
		ship: {
			img:	Object.assign(new Image(), {
				src: 'images/game/x-ship.png'
			}),
			mod:	{
				size:	player.ship.size,
			},
		},
		crosshair:	{
			img:	Object.assign(new Image(), { 
				src: 'images/game/x-ship-crosshair.png' 
			}),
			mod: 	{ 
				size: { min: 24, max: 64 },
				distance: { min: ship.size, max: 700 },
			},
		},
		bullet:	{
			/*
			I get it'd make sense to have bullet size
			be called from here, however since there's so
			much being done with bullets, size of bullets
			is 	nested 	within 		bullet		property
			*/
			img:	Object.assign(new Image(), { 
				src: 'images/game/x-ship-bullet-standard.png' 
			}),
		},
	},
	
	attack: {
		shot: {
			type:		'oneShot',
			speed:		1 * frameTime,		// This will be default for most, but can be altered
			size:		24,
			color:		'#00ffcc',
			count:		1 * player.level,	// Multiplier. For upgrades (configure later)
		},
		spray: {
			type:		'oneShot',
			speed:		1 * frameTime,		// for transform in update()
			size:		24,
			color:		'#00ffcc',
			count:		3,
		},
		stream: {
			type:		'stream',
			speed:		1 * frameTime,	
			size:		16,
			color:		'#00ffcc',
			count:		1,
		},
		burst: {
			type:		'stream',
			speed:		1 * frameTime,
			size:		24,
			color:		'#00ffcc',
			count:		1,
		},
	},
	
	bullet: {								// Left-click function
	
		get action() {
			return player.attack.shot;
		},
		get type() {
			return this.action.type;
		},
		get speed() {
			return this.action.speed;
		},
		get size() {
			return this.action.size;
		},
		get color() {
			return this.action.color;
		},
		get count() {
			return this.action.count;
		},
		
	},
	
	bulletAlt: {							// Right-click function
		
		get action() {
			return player.attack.spray;
		},
		get type() {
			return this.action.type;
		},
		get speed() {
			return this.action.speed;
		},
		get size() {
			return this.action.size;
		},
		get color() {
			return this.action.color;
		},
		get count() {
			return this.action.count;
		},
	},
}

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
frame.addEventListener("click", () => {
	if(count === 0){
		console.log("You clicked the 404 image.");
		count++;
	} else if (count === 1) {
		console.log("You clicked it again...");
		count++;
	} else if (count === 2) {
		console.log("You uh... clicked it for a third time?");
		count++;
	} else if (count === 3) {
		console.log("Why do you keep clicking the image?");
		count++;
	} else if (count === 4) {
		count++;
		frame.style.opacity = "1";
		frame.style.cursor = "none";
  		frame404Img.style.transition = "opacity 2s linear";
  		frame404Img.style.opacity = "0";
  		frame404Img.addEventListener("transitionend", () => {
  			frame404Img.style.display = "none";  			
  			startTime();
		});
	}
});

////////////////////////////////////////////////////////
// USE var. NOT const OR let.
// var is function-scoped, so if you declare a variable with var, it will persist across loop iterations.
// NOTE: While frameTime is 60fps, manual keyframes should NOT be used.
////////////////////////////////////////////////////////

async function startTime() {

    gameRunning = true;
    
    while (gameRunning) {
        
        keyframe++;        
        
        // Intro Sequence
		/*if(keyframe === 1){
			var introText = document.createElement("p");
			frame.appendChild(introText);
			introText.style.cssText = ezStyle_CentreText;
			introText.textContent = "XENURA PRESENTS";
		} else if (keyframe === 2){
			introText.style.opacity = "1";
		} else if (keyframe === 5) {
			introText.style.opacity = "0";
		} else if (keyframe === 7) {
			introText.textContent = "[GAME TITLE]";
			introText.style.opacity = "1";
		} else if (keyframe === 11) {
			introText.style.opacity = "0";
		} else if (keyframe == 13) {
			introText.style.display = "none";			
			frame.appendChild(gameCanvas); // Add Canvas to HTML
		} else if (keyframe == 14) {
			gameCanvas.style.opacity = "1";
			frameTime = 16.66; // Switch from 1 FPS to 60 FPS (16.66ms)			
			gameActive = true;
		}*/
		
		// No Intro Ver.
		if (keyframe == 1) {
			frame.style.width = "100%";
			frame.appendChild(gameCanvas); // Add Canvas to HTML
			gameCanvas.style.opacity = "1";
			frameTime = 16.66; // Switch from 1 FPS to 60 FPS (16.66ms)
			gameActive = true;
			//document.oncontextmenu = document.body.oncontextmenu = function() {return false;} // Disable typical right-click context menu
		}
		//
		
		if (gameActive === true) {
		
			canvasElemWidth = gameCanvas.clientWidth; // HTML Element Width readout
			canvasElemHeight = gameCanvas.clientHeight; // HTML Element Height readout
			
			// Ensure the canvas width and height are scaled accordingly and then draw graphics.
			// NOTE: Still figuring this out...
			if(gameCanvas.width !== canvasElemWidth || gameCanvas.height !== canvasElemHeight){
				/*
				console.log("Canvas Resolution and Element Dimensions do not match!");
				console.log("gameCanvas Width: ",gameCanvas.width,"canvasElemWidth: ", canvasElemWidth);
				console.log("gameCanvas Height: ",gameCanvas.height,"canvasElemHeight: ", canvasElemHeight);
				*/
				gameCanvas.width = canvasElemWidth;
				gameCanvas.height = canvasElemHeight;
				
			}
			
			canvasCentreX = gameCanvas.width / 2;
			canvasCentreY = gameCanvas.height / 2;	
			
			////////////////////////////
			////    SHIP CONTROLS   ////
			////////////////////////////
			
			// Track shipX and shipY
			/*function getMouseDistance(mouseX, mouseY, shipX, shipY) {
    			return Math.sqrt((mouseX - shipX) ** 2 + (mouseY - shipY) ** 2);
			}*/
			
			// Get the rotation angle
			player.mouse.angle = Math.atan2(mouseY - shipY, mouseX - shipX);
			player.sprite.crosshair.mod.size = getCrosshairSize(player.mouse.distance);
			
			// Get keyboard controls
			let diagonalFactor = (rightPressed || leftPressed) && (upPressed || downPressed) ? Math.sqrt(2) : 1;
			
			if (rightPressed) {
    			shipX = Math.min(shipX + shipMoveSpeed / diagonalFactor, gameCanvas.width - shipSize);
			}
			if (leftPressed) {
    			shipX = Math.max(shipX - shipMoveSpeed / diagonalFactor, 0 + shipSize);
			}
			if (upPressed) {
    			shipY = Math.max(shipY - shipMoveSpeed / diagonalFactor, 0 + shipSize);
			}
			if (downPressed) {
    			shipY = Math.min(shipY + shipMoveSpeed / diagonalFactor, gameCanvas.height - shipSize);
			}
			/////////////////////////////
			//// ANIMATE PROJECTILES ////
			/////////////////////////////

    		//////////////////////////
    		enemy = {
    			posX:	200,
    			posY:	477
    		}
			//////////////////////////
			
			//////////////////////////
			//// Render to Canvas ////
			//////////////////////////
			draw();
			update();
			//////////////////////////
		}
        
        await new Promise(resolve => setTimeout(resolve, frameTime));
    }    
}

function stopTime() {
    gameRunning = false;
}

function keyDownHandler(e) {
	if (e.key === "w" || e.key === "Up" || e.key === "ArrowUp") {
	upPressed = true;
	} else if (e.key === "s" || e.key === "Down" || e.key === "ArrowDown") {
	downPressed = true;
	} else if (e.key === "a" || e.key === "Left" || e.key === "ArrowLeft") {
	leftPressed = true;
	} else if (e.key === "d" || e.key === "Right" || e.key === "ArrowRight") {
	rightPressed = true;
	}
}

function keyUpHandler(e) {
	if (e.key === "w" || e.key === "Up" || e.key === "ArrowUp") {
	upPressed = false;
	} else if (e.key === "s" || e.key === "Down" || e.key === "ArrowDown") {
	downPressed = false;
	} else if (e.key === "a" || e.key === "Left" || e.key === "ArrowLeft") {
	leftPressed = false;
	} else if (e.key === "d" || e.key === "Right" || e.key === "ArrowRight") {
	rightPressed = false;
	}
}

/////////////////////////////////
//// DRAW ONSCREEN FUNCTIONS ////
/////////////////////////////////
// Draw on Canvas
function draw() {
	
	ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Re-draw each frame
	
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	
	// Specify what will be drawn in each frame
	if (Math.abs(mouseDistanceToShip) > Math.abs(shipSize)){
		drawCursor();
	}
	
	drawShip();
	drawProjectiles();
	
	
	/*if (!Array.isArray(o)) {
        console.error("drawPoints() was called, but it was not passed an array.");
        return;
    }*/
    
    
    //gameObjects.forEach(obj => { // Loop through each gameObject
        
    //    obj.forEach(p => { // Loop through each set of points
    //        ctx.beginPath();
    //        ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
    //        ctx.fillStyle = "#00ffcc";
     //       ctx.fill();
     //   });
        
        
        
        // for (const [key, value] of Object.entries(gameObject)) {
  		//	 console.log(`${key}: ${value}`);
		// }     
    //});
    
    for (let obj of gameObjects) {
    
    	let color = obj.pointColor;
    	let r = obj.pointSize;
    	
    	for (let p of obj.pointSet) {
        	ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
    	}
	}
	
}
/////////////////////////////////
function drawCursor() {

	ctx.drawImage(shipCrosshair, (mouseX + -shipCrosshairSize / 2), (mouseY + -shipCrosshairSize / 2), shipCrosshairSize, shipCrosshairSize);	
}

function drawShip() {

    ctx.save(); // Save the current canvas state
    ctx.translate(shipX, shipY); // Move the origin to the ship's position
    ctx.rotate(mouseAngle); // Rotate the canvas to face the mouse
    ctx.drawImage(shipImage, -shipSize / 2, -shipSize / 2, shipSize, shipSize);
    ctx.restore(); // Restore the original canvas state
}

function drawProjectiles() {
	
    for (let i = 0; i < projectiles.length; i++) {
        let p = projectiles[i];
        
        //ctx.fillStyle = "#FFFFFF"; // Color of the projectile
        //ctx.fillRect(p.x, p.y, p.width, p.height); // Draw the projectile (as a rectangle)
        
        //ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        /*
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.width, 0, 2 * Math.PI);
		ctx.fillStyle = "#00ffcc";
  		ctx.fill();
  		ctx.closePath();
  		*/
  		
  		ctx.save(); // Save the current canvas state
  		ctx.translate(p.x, p.y);
  		ctx.rotate(p.angle);
  		ctx.drawImage(shipBulletStandard, -p.width/2, -p.height/2, p.width, p.height);
  		ctx.restore(); // Restore the original canvas state
    }
}
/////////////////////////////////
//// VARIABLE & ENTITY FUNC  ////
/////////////////////////////////
function getShipFront() {
    
    // Position of the front of the ship
    let shipFrontX = shipX + (shipSize / 2) * Math.cos(mouseAngle); 
    let shipFrontY = shipY + (shipSize / 2) * Math.sin(mouseAngle);

    return { x: shipFrontX, y: shipFrontY };
}

function createProjectile() {

    // Calculate the front of the ship
    let front = getShipFront();

    // Create a new projectile
    let projectile = {
        x: front.x,    // Starting X position (front of the ship)
        y: front.y,    // Starting Y position (front of the ship)
        speed: bulletSpeed,      // Speed of the projectile
        angle: mouseAngle,  // Direction of movement
        width: shipBulletWidth,     // Width of the projectile (optional)
        height: shipBulletHeight      // Height of the projectile (optional)
    };

    projectiles.push(projectile); // Add the projectile to the array
}


function getMouseDistance(mouseX, mouseY, shipX, shipY) {
    return Math.sqrt((mouseX - shipX) ** 2 + (mouseY - shipY) ** 2);
}

function getCrosshairSize(distance) {
    // Clamp distance within range to avoid excessive values
    let clampedDistance = Math.min(Math.max(mouseDistanceToShip, minDistance), maxDistance);
    
    //console.log(mouseDistanceToShip);

    // Linear interpolation formula
    return shipCrosshairMinSize + (clampedDistance / maxDistance) * (shipCrosshairMaxSize - shipCrosshairMinSize);
}
	
/////////////////////////////////
////     EVENT LISTENERS     ////
/////////////////////////////////

// Input Keyboard & Mouse
document.addEventListener("mousemove", (event) => {
	
	mouseX = event.clientX;
	mouseY = event.clientY;
	
	let rect = gameCanvas.getBoundingClientRect(); // Get canvas position
    //mouseX - rect.left;
    //mouseY - rect.top;
    
   	mouseX -= rect.left;
	mouseY -= rect.top;

    mouseDistanceToShip = getMouseDistance(mouseX, mouseY, shipX, shipY);
});

document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("keydown", keyDownHandler, false);

gameCanvas.addEventListener('click', function() {
    createProjectile(); // Create a projectile when the mouse is clicked
});
gameCanvas.addEventListener('contextmenu', function(event) {
    event.preventDefault(); // Prevents the default right-click menu
    createProjectile(); // Trigger projectile on right-click
});

/////////////////////////////////////////////////////////

////////////////////////////////////
////		POINT SYSTEM		////
////////////////////////////////////
/*
Eventually this should become a full fledged co-ordinate system can be used for just about anything that you intend to manipulate, especially in large numbers.
For now it is primarily a bullet system. Enemy functions have been focused on first.
*/
////////////////////////////////////

// So far, nothing for point rect has been defined

// Initialize Ring of Points
function initPointRadial(cx = canvasCentreX, cy = canvasCentreX, r = 100, n = 3) {
	
	let pointSet = [];
	
	let angleStep = (2 * Math.PI) / n;  // Angle step in radians
	for (let i = 0; i < n; i++) {
		let a = i * angleStep; // a = angle
		let x = cx + r * Math.cos(a);  // Calculate x-coordinate
		let y = cy + r * Math.sin(a);  // Calculate y-coordinate
		pointSet.push({ x, y, r, n, a, cx, cy });  // Store the point
	}
	
	return pointSet
}

function createGameObject(sourceX = 0, sourceY = 0, targetX = canvasCentreX, targetY = canvasCentreY, speed = 2, pointSet, pointSetType = 'unspecified', pointSize = 10, pointColor = "#fff", timeOut = 0, tX = 0, tY = 0, tR = 0, tN = 0, tA = 0) { // Right now this is ONLY set up for creating and pushing bullets but I will expand later
	
	// A pointSet is EXPECTED currently as this is intended to handle sets of points (or point)
	// This will serve as a backbone mostly for bullet formations from both enemies and player
	
	//let target = Math.atan(target.x,target.y);
	let source = {sourceX, sourceY};
	let targetAng = Math.atan2(sourceX - targetX, sourceY - targetY);
	console.log(targetAng);
	
	let isTimed = false;
	
	// If passed a number greater than 0 for timeOut, it will have a lifespan.
	if (timeOut >= 1) {
		isTimed = true;
		if(timeOut >= 1 && timeOut < frameTime) {
			timeOut = frameTime;			// Any value passed that is more than 1 AND less than frameTime will be replaced with 1 frame minimum.
		}
	}
	
	const obj = {
		id: Date.now(),						// Reference id (nothing being done w this yet)
		source:			source,				// Set of coordinates from source that called the function
		targetAng:		targetAng,			// Set of coordinates of target
		speed:			speed,
		pointSet: 		pointSet,			// Point coordinates
		pointSetType:	pointSetType,		// Used for update to know to transform a object
		pointSize: 		pointSize,			// For collision and rendering
		pointColor: 	pointColor,			// For rendering
		isTimed:		isTimed,			// Auto-detected whether this oject has a lifespan or not (for de-spawn)
		timeOut:		timeOut,
		
		// Offset Variables (for update())
		tX: tX,		// transform centre-X
		tY: tY,		// transform centre-Y
		tR: tR,		// transform Radius
		tN: tN,		// transform number (of points)
		tA: tA,		// transform AngleOffset (for spin)
	};
	
	gameObjects.push(obj);
}

function update(){
	
	for (let i = gameObjects.length - 1; i >= 0; i--) {
    	
    	// Array variables
    	let obj 		= gameObjects[i];
    	let id			= obj.id;
    	let source		= obj.source;
    	let targetAng	= obj.targetAng * (Math.PI / 180);
    	//let type		= obj.pointSetType; // You could later replace this with a check of "is this a set of points?" and then pull point type
    	let moveSpeed	= obj.speed;
    	let offsetX 	= obj.tX;
    	let offsetY 	= obj.tY;
    	let offsetR 	= obj.tR;
    	let offsetA 	= obj.tA;
    	let isTimed 	= obj.isTimed;
    	let timeOut 	= obj.timeOut;
    	
    	//let targetAngle = Math.atan2(source.x - target.x, source.y - target.y);
    	
    	for (let p of obj.pointSet) {
    		
    		// Apply offset values, if specified
    		//if(speed >= 1) {
        		//p.cx += offsetX + Math.cos(targetAng); // Movement towards target won't happen if target isn't specified
        		//p.cy += offsetY + Math.sin(targetAng); // Movement towards target won't happen if target isn't specified
        	//} else {
        		//p.cx += offsetX // Movement towards target won't happen if target isn't specified
        		//p.cy += offsetY // Movement towards target won't happen if target isn't specified
        	//}
        	
        	p.cx += offsetX + Math.cos(targetAng) * moveSpeed; // Movement towards target won't happen if target isn't specified
        	p.cy += offsetY + Math.sin(targetAng) * moveSpeed; // Movement towards target won't happen if target isn't specified
        	p.r += offsetR;
        	p.a += offsetA;
        	
        	// This will spin the points (assuming they're radial)
        	//if(type === 'radial'){
        	p.x = p.cx + p.r * Math.cos(p.a);
    		p.y = p.cy + p.r * Math.sin(p.a);
    		//}
    		
    		/*let angleStep = (2 * Math.PI) / n;  // Angle step in radians
			for (let i = 0; i < n; i++) {
				let angle = i * angleStep; // ang = init angle offset is an option if you want
				let x = cx + r * Math.cos(angle);  // Calculate x-coordinate
				let y = cy + r * Math.sin(angle);  // Calculate y-coordinate
				pointSet.push({ x, y });  // Store the point
			}*/
	
        	// Optional: Remove projectiles when they go off-screen
        	if (p.x < 0 || p.x > gameCanvas.width || p.y < 0 || p.y > gameCanvas.height) {
            	projectiles.splice(i, 1);
            	i--;
        	}
        	
    	}
    	
    	if(isTimed){
			obj.timeOut -= frameTime; // You could either subtract frameTime
		}
		
		if (timeOut <= 0 && isTimed === true) {
			// remove the obj from the array
			gameObjects.splice(i, 1);
			console.log("gameObject: ", id, "destroyed due to specified timeOut");
		}
	}
	
	// Player Projectiles -- soon to be merged
	for (let i = 0; i < projectiles.length; i++) {
        let p = projectiles[i];

        // Move the projectile in the direction it's facing (along its angle)
        p.x += p.speed * Math.cos(p.angle);
        p.y += p.speed * Math.sin(p.angle);

        // Optional: Remove projectiles when they go off-screen
        if (p.x < 0 || p.x > gameCanvas.width || p.y < 0 || p.y > gameCanvas.height) {
            projectiles.splice(i, 1);
            i--;
        }
    }
	
}

// Transform the ring of points
/*function transformPointRadial(points, cx, cy, r, spin = 0) {
  points.forEach(point => {
    // Update the point's angle
    point.angle += spin; // 'spin' essentially will just add onto the angle, but it'll simulate orbit/spin if animated

    // Update the x and y position based on the new angle
    point.x = cx + r * Math.cos(point.angle);
    point.y = cy + r * Math.sin(point.angle);
  });
  return points;
}*/

////////////////////////////////////
////		ENEMY FUNCTION		////
////////////////////////////////////
// Basic

// Advanced Section
function enemyFormBulletRing(sourceX = enemy.posX, sourceY = enemy.posY, aoe = 100, n = 6, spin = 1, bulletSize = 10, bulletSpeed = 3, timeOut = 0) {
	
	// Incoming parameters 'x', 'y', 'aoe' and 'n', are passed to the pointSet creation
	const pointSet = initPointRadial(sourceX, sourceY, aoe, n);
	
	// Remaining parameters 'spin', 'bulletSize', 'timeOut', and initialized pointSet are passed into gameObject creation.
	
	createGameObject(sourceX, sourceY, shipX, shipY, bulletSpeed, pointSet, 'radial', bulletSize, '#00ffcc', 5000, 0, 0, 0, 0, 1);
	
	// source = 'unspecified', pointSet, pointSetType = 'unspecified', pointSize = 10, pointColor = "#fff", timeOut = 0, tX = 0, tY = 0, tR = 0, tN = 0, tA = 0
	
}

setInterval(enemyFormBulletRing, 2000);

function playerFormBulletRing(x = shipX, y = shipY, aoe = 100, n = 6, spin = 1, bulletSize = 10, timeOut = 3) {
	
	// Incoming parameters 'x', 'y', 'aoe' and 'n', are passed to the pointSet creation
	const pointSet = initPointRadial(x, y, aoe, n);
	
	createGameObject('player', pointSet, 'radial', bulletSize, '#00ffcc', 5000, 0, 0, 0, 0, 1);

	
}

////////////////////////////////////

////////////////////////////////////

// Example usage
 // Starts tracking keyframes

// Call stopGameTime() to stop tracking when needed
