"use strict";
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let countSchema = new Schema({
    _id: String,
    filmId: String,
    site: String,
    playSum: Number,
    commentSum: Number,
    upSum: Number,
    downSum: Number,
    createdAt: Date
});
let connection = mongoose.createConnection('mongodb://normal:Joke123@ant09.idatage.com:27021/tarantula');
let countModel = connection.model('vs_count', countSchema);
exports.Count = countModel;
//# sourceMappingURL=count.js.map