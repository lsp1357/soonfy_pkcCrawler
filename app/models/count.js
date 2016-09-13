let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let countSchema = new Schema({
  _id: String,  //site+date+filmId+name
  filmId: String,
  site: String,
  playSum: Number,
  commentSum: Number,
  upSum: Number,
  downSum: Number,
  createdAt: Date
})

//测试
// let connection = mongoose.createConnection('mongodb://localhost/pkc3038count')

//上线
let connection = mongoose.createConnection('mongodb://normal:Joke123@ant09.idatage.com:27021/tarantula')
let countModel = connection.model('vs_count', countSchema);

export {countModel as Count}