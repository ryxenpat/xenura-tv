# Xenura TV
Xenura TV is a multi-functional website intended for use by the artist to broadcast audio and video livestreams (independently), along with serving as a portfolio. It is a creative project that is built using Node.js for the backend, and HTML 5, CSS and Javascript for the frontend.

Initially this was supposed to be a "Xenura Radio" that utilized Icecast 2, however at the time I found it very confusing and hard to wrap my head around.
So I did what any normal human being would do and not take the time to learn it, and instead *build my own solution entirely from scratch*.
Since its conception, more and more ideas have been coming about and I would like to have this site serve as a content-rich space but maintain a minimal appearance for the sake of enticing exploration and overall making this a fun experience.
With that said, it is still first-and-foremost a "radio" since the endgoal is to have the home page have a 24/7 video and audio stream running. The name 'Xenura TV' came about because in my end, I imagine being able to head to this site on a smart TV and have the entire screen be a visualizer with my entire music library playing on shuffle.

 # How It Works
The site uses Node.js for a backend. Why did I use Node.js? Because my good friend Conk who actually knows infinitely more than I do about computer science and programming suggested it to me.
 - The backend is set up to receive incoming audio streams via ffmpeg and video-streams via RTMP. Currently there's no authentication or checks that are performed, so really any device could send in an audio stream and it'd come through to the frontend. Same goes for RTMP-in (if you knew the stream key to use).
 - Audio and video streams have intentionally kept separated as the video-element is planned to 
