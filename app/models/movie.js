let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let movieSchema = new Schema({
  _id: String,  //site+date+filmId+name
  filmId: String,
  name: String,
  site: String,
  play: Number,
  comment: Number,
  up: Number,
  down: Number,
  createdAt: Date
})

let movieModel = mongoose.model('movie', movieSchema);

export {movieModel as Movie}