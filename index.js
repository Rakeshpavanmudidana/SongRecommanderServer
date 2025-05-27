const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3000;

let accessToken = '';
let tokenExpiresAt = 0;

async function getAccessToken() {
    if (Date.now() < tokenExpiresAt) return accessToken;

    const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')}`
            }
        }
    );

    accessToken = response.data.access_token;
    tokenExpiresAt = Date.now() + response.data.expires_in * 1000;
    return accessToken;
}

app.post('/song', async (req, res) => {
    const { mood, language, year } = req.body;

    const moodMap = {
        happy: "party",
        calm: "chill",
        rock: "rock",
        acoustic: "acoustic",
        chill: "rainy",
        pop: "pop"
    };

    const queryMood = moodMap[mood] || 'pop';

    let query = `genre:${queryMood}`;
    if (year) query += ` year:${year}`;
    if (language) query += ` ${language}`;

    try {
        const token = await getAccessToken();

        const response = await axios.get(
            `https://api.spotify.com/v1/search`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    q: query,
                    type: 'track',
                    limit: 50
                }
            }
        );

        const songs = response.data.tracks.items.map(track => ({
            name: track.name,
            artist: track.artists.map(a => a.name).join(", "),
            image: track.album.images[0]?.url || '',
            preview_url: track.preview_url,
            spotify_url: track.external_urls.spotify
        }));

        res.json(songs);
    } catch (err) {
        console.error("Spotify error:", err.message);
        res.status(500).json({ error: "Failed to fetch songs from Spotify" });
    }
});
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
