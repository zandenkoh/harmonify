const clientId = '2ee584ca1e9b4cddbe6af449527bd950';
const redirectUri = 'https://zandenkoh.github.io/harmonify/';
const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=playlist-read-private%20user-read-playback-state%20user-modify-playback-state&redirect_uri=${encodeURIComponent(redirectUri)}`;
const apiBaseUrl = 'https://api.spotify.com/v1/';

let accessToken = null;
let refreshToken = null;
let expiresAt = null;

// DOM Elements
const playlistsDiv = document.getElementById('playlists');
const songName = document.getElementById('songName');
const songArtist = document.getElementById('songArtist');
const loginButton = document.getElementById('loginButton');
const skipTrackButton = document.getElementById('skipTrackButton');
const loadingIndicator = document.getElementById('loading');

// Check for an access token in the URL and retrieve it
function getAccessTokenFromUrl() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    accessToken = hashParams.get('access_token');
    refreshToken = hashParams.get('refresh_token');
    expiresAt = hashParams.get('expires_at');

    if (accessToken) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Refresh the access token using the refresh token (if expired)
async function refreshAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
        }),
    });

    if (response.ok) {
        const data = await response.json();
        accessToken = data.access_token;
        expiresAt = Date.now() + data.expires_in * 1000; // Save new expiry time
        fetchPlaylists(); // Refresh the playlist data
    } else {
        console.error('Failed to refresh access token');
    }
}

// Ensure the token is still valid, else refresh it
function checkAccessToken() {
    if (!accessToken || Date.now() >= expiresAt) {
        if (refreshToken) {
            refreshAccessToken(); // Try refreshing token
        } else {
            login(); // Prompt for re-login if no refresh token is available
        }
    }
}

// Log in and redirect to Spotify's authentication page
function login() {
    window.location.href = authUrl;
}

// Show a loading spinner
function showLoading() {
    loadingIndicator.style.display = 'block';
}

// Hide the loading spinner
function hideLoading() {
    loadingIndicator.style.display = 'none';
}

// Fetch playlists and update UI
async function fetchPlaylists() {
    checkAccessToken();

    showLoading();
    try {
        const response = await fetch(`${apiBaseUrl}me/playlists`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) throw new Error('Failed to fetch playlists');

        const data = await response.json();
        playlistsDiv.innerHTML = '';
        data.items.forEach((playlist) => {
            const playlistElement = document.createElement('div');
            playlistElement.classList.add('playlistItem');
            playlistElement.textContent = playlist.name;
            playlistElement.onclick = () => loadPlaylist(playlist.id);
            playlistsDiv.appendChild(playlistElement);
        });
    } catch (error) {
        alert('Error fetching playlists: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Load a playlist's tracks
async function loadPlaylist(playlistId) {
    checkAccessToken();

    showLoading();
    try {
        const response = await fetch(`${apiBaseUrl}playlists/${playlistId}/tracks`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) throw new Error('Failed to load playlist');

        const data = await response.json();
        const playlistTracks = data.items.map(item => item.track);
        alert(`Loaded playlist with ${playlistTracks.length} tracks`);
    } catch (error) {
        alert('Error loading playlist: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Fetch and update the current track playing
async function fetchCurrentTrack() {
    checkAccessToken();

    try {
        const response = await fetch(`${apiBaseUrl}me/player/currently-playing`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) throw new Error('Failed to fetch current track');

        const data = await response.json();
        if (data.item) {
            songName.textContent = data.item.name;
            songArtist.textContent = data.item.artists.map(artist => artist.name).join(', ');
        }
    } catch (error) {
        console.error('Error fetching current track: ', error.message);
    }
}

// Skip to the next track
async function skipTrack() {
    checkAccessToken();

    try {
        const response = await fetch(`${apiBaseUrl}me/player/next`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (response.ok) {
            fetchCurrentTrack(); // Refresh the current track display
        } else {
            console.error('Failed to skip track');
        }
    } catch (error) {
        console.error('Error skipping track: ', error.message);
    }
}

// Event Listeners
loginButton.addEventListener('click', login);
skipTrackButton.addEventListener('click', skipTrack);

// Initialize the app
getAccessTokenFromUrl();
if (accessToken) {
    fetchPlaylists();
    fetchCurrentTrack();
} else {
    login(); // Prompt for login if no token found
}
