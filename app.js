var express = require('express');

var routes = require('./routes/index');

/**
 * mark
 */

let db = 'mongodb://localhost/pkc3038';
let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(db);
mongoose.set('debug', true);

var app = express();
