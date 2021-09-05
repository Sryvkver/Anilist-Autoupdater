require('dotenv').config();
import express from 'express';
import helment from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';

import { addNewAnime, getAllIdsForAnime, getBestAnilistId, likeAnime, updateAnime } from './repos/AnilistRepo';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helment());

app.get('/getAllIds', (req, res) => {
    getAllIdsForAnime(String(req.query.host), String(req.query.host_id), Number(req.query.episode))
        .then((obj) => {
            console.log(obj)
            res.send(obj);
        })
        .catch(err => {
            console.error(err);
            res.send(err);
        })
})

app.get('/getBestId', (req, res) => {
    getBestAnilistId(String(req.query.host), String(req.query.host_id), Number(req.query.episode))
        .then((obj) => {
            console.log(obj)
            res.send(obj);
        })
        .catch(err => {
            console.error(err);
            res.send(err);
        })
})


// TODO change to post
app.get('/create', (req, res) => {
    let extras = {
        from_episode: Number(req.query?.from || '0'),
        episode_offset: Number(req.query?.start || '0')
    };

    const anilistData = {
        anilist_id: Number(req.query.anilist_id),
        anilist_name: String(req.query.anilist_name),
        anilist_name_english: String(req.query.anilist_name_english),
        anilist_image: String(req.query.anilist_image)
    }

    
    addNewAnime(String(req.query.host), String(req.query.host_id), Number(req.query.episodes), anilistData, extras)
        .then(obj => {
            console.log('Okay');
            res.send(obj);
        })
        .catch(err => {
            console.error(err);
            res.send(err);
        })
})

// TODO change to post
app.get('/like', (req, res) => {
    likeAnime(String(req.query.id))
        .then((obj) => {
            console.log(obj)
            res.send(obj);
        })
        .catch(err => {
            console.error(err);
            res.send(err);
        })
})

app.post('/update', (req, res) => {
    updateAnime(String(req.query.id), req.body)
        .then((obj) => {
            console.log(obj)
            res.send(obj);
        })
        .catch(err => {
            console.error(err);
            res.send(err);
        })
})

const PORT = process.env.PORT || 9999;
mongoose.connect(process.env.MONGO_URI || '')
    .then(() => {
        console.log('Connected to mongoDB!');
        app.listen(PORT, () => {
            console.log('App listeing on Port:', PORT);
        })
    })
    .catch(err => {
        console.error(err);
        process.exit(-1);
    })