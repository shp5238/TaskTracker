import { useToast } from "@/hooks/use-toast";

// Spotify Web API integration
export const connectSpotify = async () => {
  try {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID || "your_spotify_client_id";
    const redirectUri = window.location.origin;
    const scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state'
    ].join(' ');

    const authUrl = `https://accounts.spotify.com/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `show_dialog=true`;

    // Open Spotify authorization in a popup
    const popup = window.open(authUrl, 'spotify-auth', 'width=500,height=600');
    
    // Listen for the authorization callback
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        // Handle authorization completion
        console.log('Spotify authorization completed');
      }
    }, 1000);

  } catch (error) {
    console.error('Spotify connection failed:', error);
  }
};

// YouTube Music integration
export const connectYoutube = async () => {
  try {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || "your_youtube_api_key";
    
    // Load YouTube IFrame API
    if (!(window as any).YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
      
      (window as any).onYouTubeIframeAPIReady = () => {
        console.log('YouTube API ready');
        // Initialize YouTube player for background music
        initializeYouTubePlayer();
      };
    } else {
      initializeYouTubePlayer();
    }
  } catch (error) {
    console.error('YouTube connection failed:', error);
  }
};

const initializeYouTubePlayer = () => {
  // Create hidden YouTube player for background music
  const player = new (window as any).YT.Player('youtube-player', {
    height: '0',
    width: '0',
    videoId: 'jfKfPfyJRdk', // Default focus music playlist
    playerVars: {
      autoplay: 0,
      controls: 0,
      loop: 1,
      playlist: 'jfKfPfyJRdk'
    },
    events: {
      onReady: (event: any) => {
        console.log('YouTube player ready');
        // Player is ready to use
      }
    }
  });
  
  // Store player reference globally for control
  (window as any).youtubePlayer = player;
};

// Apple Music integration
export const connectAppleMusic = async () => {
  try {
    // Check if MusicKit is available
    if (!(window as any).MusicKit) {
      // Load MusicKit JS
      const script = document.createElement('script');
      script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';
      document.head.appendChild(script);
      
      script.onload = () => {
        initializeAppleMusic();
      };
    } else {
      initializeAppleMusic();
    }
  } catch (error) {
    console.error('Apple Music connection failed:', error);
  }
};

const initializeAppleMusic = async () => {
  try {
    const developerToken = import.meta.env.VITE_APPLE_MUSIC_TOKEN || process.env.APPLE_MUSIC_TOKEN || "your_apple_music_token";
    
    await (window as any).MusicKit.configure({
      developerToken: developerToken,
      app: {
        name: 'TaskFlow',
        build: '1.0.0'
      }
    });

    const music = (window as any).MusicKit.getInstance();
    
    // Authorize user
    await music.authorize();
    console.log('Apple Music authorized');
    
    // Store music instance globally
    (window as any).appleMusicInstance = music;
  } catch (error) {
    console.error('Apple Music initialization failed:', error);
  }
};

// Utility functions for controlling music during pomodoro sessions
export const startFocusMusic = (service: 'spotify' | 'youtube' | 'apple') => {
  switch (service) {
    case 'spotify':
      // Control Spotify playback via Web API
      controlSpotifyPlayback('play');
      break;
    case 'youtube':
      if ((window as any).youtubePlayer) {
        (window as any).youtubePlayer.playVideo();
      }
      break;
    case 'apple':
      if ((window as any).appleMusicInstance) {
        (window as any).appleMusicInstance.play();
      }
      break;
  }
};

export const pauseFocusMusic = (service: 'spotify' | 'youtube' | 'apple') => {
  switch (service) {
    case 'spotify':
      controlSpotifyPlayback('pause');
      break;
    case 'youtube':
      if ((window as any).youtubePlayer) {
        (window as any).youtubePlayer.pauseVideo();
      }
      break;
    case 'apple':
      if ((window as any).appleMusicInstance) {
        (window as any).appleMusicInstance.pause();
      }
      break;
  }
};

const controlSpotifyPlayback = async (action: 'play' | 'pause') => {
  try {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) return;

    await fetch(`https://api.spotify.com/v1/me/player/${action}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Spotify playback control failed:', error);
  }
};
