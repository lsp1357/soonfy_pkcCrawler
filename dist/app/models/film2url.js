"use strict";
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let urlSchema = new Schema({
    _id: String,
    filmId: String,
    site: String,
    category: String,
    url: String,
    createdAt: Date
});
let urlModel = mongoose.model('film2url', urlSchema);
exports.Url = urlModel;
//# sourceMappingURL=film2url.js.map