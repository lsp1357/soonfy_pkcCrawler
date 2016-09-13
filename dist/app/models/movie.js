"use strict";
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let movieSchema = new Schema({
    _id: String,
    filmId: String,
    name: String,
    site: String,
    play: Number,
    comment: Number,
    up: Number,
    down: Number,
    createdAt: Date
});
let movieModel = mongoose.model('movie', movieSchema);
exports.Movie = movieModel;
//# sourceMappingURL=movie.js.map