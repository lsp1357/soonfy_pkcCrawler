let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let urlSchema = new Schema({
  _id: String,  //site+filmId
  filmId: String,
  site: String,
  category: String,
  url: String,
  createdAt: Date
})

let urlModel = mongoose.model('film2url', urlSchema);

export {urlModel as Url} 