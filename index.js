const express = require('express');
const axios = require('axios');
const corse = require('corse');
require('dotenv').config();

const app = express();
app.use(corse());
const PORT = 3000;

let accessToken = '';
let tokenExpiresAt = 0;

async function getAccessToken() {
    if ( Date.now() < tokenExpiresAt) return accessToken;

    const response = await axios( 'https://accounts.spotify.com/api/token', 
        new URLSearchParams( { grant_type: 'client_credentials' }),
        {
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')}`
            }
        }
    );

    accessToken = response.data.access_token;
    tokenExpiresAt = Date.now() + response.data.expires_in * 1000;
    return accessToken;
}

app.get('/song/:mood', async(request, response ) => {
    const mood = request.params.mood;

    const token = getAccessToken();

    const search = await axios('https://api.spotify.com/v1/search',{
        headers: { Authorization: `Bearer ${token}` },
        params: {
            q: mood,
            type: 'track',
            limit: 5
        }
    }
    );

    const songs = search.data.tracks.items.map(track => ({
    name: track.name,
    artist: track.artist,
    preview_url: track.preview_url,
    image: track.album.image[0].url,
    spotify_url: track.external_urls.spotify
}));

    response.json(songs);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));




