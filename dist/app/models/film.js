"use strict";
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let filmSchema = new Schema({
    _id: String,
    doubanId: String,
    name: String,
    category: String,
    keywords: Array,
    doubanTags: Array,
    moviePic: String,
    year: String,
    directorIds: Array,
    screenwriterIds: Array,
    actorIds: Array,
    doubanTypes: Array,
    releaseDate: Array,
    duration: Number,
    rank: Number,
    rankCount: Number,
    betterThan: Array,
    intro: String,
    stars: Array,
    pics: Array,
    awards: Array,
});
let filmModel = mongoose.model('film', filmSchema);
exports.Film = filmModel;
//# sourceMappingURL=film.js.map