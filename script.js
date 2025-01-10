const clientId = '2ee584ca1e9b4cddbe6af449527bd950';
const redirectUri = 'https://zandenkoh.github.io/Harmonify/';
const authUrl = 'https://accounts.spotify.com/authorize?response_type=token&client_id=' + clientId + '&scope=playlist-read-private%20user-read-playback-state%20user-modify-playback-state&redirect_uri=' + encodeURIComponent(redirectUri);
const apiBaseUrl = 'https://api.spotify.com/v1/';

let accessToken = null;

// Check if there's an access token in the URL fragment
function getAccessTokenFromUrl() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    accessToken = hashParams.get('access_token');
    if (accessToken) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function login() {
    window.location.href = authUrl;
}

function fetchPlaylists() {
    fetch(apiBaseUrl + 'me/playlists', {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => response.json())
    .then(data => {
        const playlistsDiv = document.getElementById('playlists');
        playlistsDiv.innerHTML = '';
        data.items.forEach(playlist => {
            const playlistElement = document.createElement('div');
            playlistElement.classList.add('playlistItem');
            playlistElement.textContent = playlist.name;
            playlistElement.onclick = () => loadPlaylist(playlist.id);
            playlistsDiv.appendChild(playlistElement);
        });
    });
}

function loadPlaylist(playlistId) {
    fetch(apiBaseUrl + 'playlists/' + playlistId + '/tracks', {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => response.json())
    .then(data => {
        const playlistTracks = data.items.map(item => item.track);
        alert('Loaded playlist with ' + playlistTracks.length + ' tracks');
    });
}

function fetchCurrentTrack() {
    fetch(apiBaseUrl + 'me/player/currently-playing', {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.item) {
            const songName = document.getElementById('songName');
            const songArtist = document.getElementById('songArtist');
            songName.textContent = data.item.name;
            songArtist.textContent = data.item.artists.map(artist => artist.name).join(', ');
        }
    });
}

function skipTrack() {
    fetch(apiBaseUrl + 'me/player/next', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => {
        if (response.ok) {
            fetchCurrentTrack();
        }
    });
}

// Event Listeners
document.getElementById('loginButton').addEventListener('click', login);
document.getElementById('skipTrackButton').addEventListener('click', skipTrack);

// Initialize the app
getAccessTokenFromUrl();
if (accessToken) {
    fetchPlaylists();
    fetchCurrentTrack();
}
