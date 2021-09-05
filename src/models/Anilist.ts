import mongoose from 'mongoose';

export interface IAnilist extends mongoose.Document {
    hostname: String,
    host_id: String,
    anilist_ids: {
        name: String,
        name_english: String,
        image: String,
        episodes: Number,
        id: Number,
        rating: Number,
        accepted: Boolean,
        _id?: mongoose.Types.ObjectId,
        extras: {
            from_episode: Number,
            episode_offset: Number,
        }
    }[]
}

export const AnilistSchema = new mongoose.Schema({
    hostname: String,
    host_id: String,
    anilist_ids: [{
        name: String,
        name_english: String,
        image: String,
        episodes: Number,
        id: Number,
        rating: Number,
        accepted: Boolean,
        extras: {
            from_episode: Number,
            episode_offset: Number
        }
    }]
});

export const AnilistModel = mongoose.model<IAnilist>('Id', AnilistSchema);