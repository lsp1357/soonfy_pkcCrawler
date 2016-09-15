"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
let rp = require('request-promise');
let moment = require('moment');
let cheerio = require('cheerio');
const movie_1 = require('../models/movie');
const count_1 = require('../models/count');
let dbInserter = function (DB, obj) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let data = yield DB.findOne({ _id: obj._id }).exec();
            if (data === null) {
                let _db = new DB(obj);
                yield _db.save();
            }
            else {
            }
        }
        catch (error) {
            console.log(error);
        }
    });
};
let timeout = function (ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    });
};
let parseVideo = function (data) {
    let video = {};
    let pos = data.indexOf('type: "');
    let vtype = data.substring(pos + 7, data.indexOf('",', pos + 7)).replace(/ /g, '');
    let type;
    switch (vtype) {
        case 'movie':
            type = '电影';
            break;
        case 'tv':
            type = '电视剧';
            break;
        case 'show':
            type = '综艺';
            break;
        default:
            type = vtype;
    }
    pos = data.indexOf('cname: "');
    let title = data.substring(pos + 8, data.indexOf('"', pos + 8)).replace(/ /g, '');
    pos = data.indexOf('vid:');
    let vid = data.substring(pos + 5, data.indexOf(',', pos)).replace(/ /g, '');
    pos = data.indexOf('cid:');
    let cid = data.substring(pos + 5, data.indexOf(',', pos)).replace(/ /g, '');
    pos = data.indexOf('site: "');
    let site = data.substring(pos + 7, data.indexOf('",', pos + 7)).replace(/ /g, '');
    pos = data.indexOf('path:');
    let path = data.substring(pos + 6, data.indexOf(',', pos)).replace(/ /g, '');
    video.title = title;
    video.type = type;
    video.vid = vid;
    video.cid = cid;
    video.site = site;
    video.path = path;
    return video;
};
let mvCrawler = function (pid, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(10 * 1000);
        try {
            let requrl = 'http://videocenter-2039197532.cn-north-1.elb.amazonaws.com.cn//dynamicinfo?vid=' + pid;
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let playSum = JSON.parse(body).data.all;
            let upSum = JSON.parse(body).data.like;
            let downSum = JSON.parse(body).data.unlike;
            requrl = 'http://comment.hunantv.com/video_comment/list/?subject_id=' + pid;
            options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            body = yield rp(options);
            let reg = /null\((.+)\)/;
            let data = body.replace(reg, '$1');
            let commentSum = JSON.parse(data).total_number;
            let site = '芒果TV';
            let createdAt = new Date();
            let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
            let _count = {
                _id: _id,
                filmId: filmId,
                site: site,
                playSum: playSum,
                commentSum: commentSum,
                upSum: upSum,
                downSum: downSum,
                createdAt: createdAt
            };
            console.log(_count);
            yield dbInserter(count_1.Count, _count);
        }
        catch (error) {
            console.log(error);
        }
    });
};
let tvCrawler = function (vid, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(10 * 1000);
        try {
            let requrl = 'http://v.api.mgtv.com/list/tvlist?video_id=' + vid;
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let pagemax = JSON.parse(body).data.total_page;
            let pages = [];
            let i = 1;
            while (i <= pagemax) {
                pages.push(i);
                i++;
            }
            let tvlist = [];
            for (let page of pages) {
                let requrl = 'http://v.api.mgtv.com/list/tvlist?video_id=' + vid + '&size=25&page=' + page;
                let options = {
                    url: requrl,
                    timeout: 1000 * 60 * 2
                };
                let body = yield rp(options);
                let vlist = JSON.parse(body).data.list;
                tvlist = tvlist.concat(vlist);
            }
            let promises = tvlist.map((tv, index) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield timeout(1 * 1000 * 5 * (index / 100));
                    let requrl = 'http://videocenter-2039197532.cn-north-1.elb.amazonaws.com.cn//dynamicinfo?vid=' + tv.video_id;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let play = JSON.parse(body).data.all;
                    let up = JSON.parse(body).data.like;
                    let down = JSON.parse(body).data.unlike;
                    requrl = 'http://comment.hunantv.com/video_comment/list/?subject_id=' + tv.video_id;
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    let reg = /null\((.+)\)/;
                    let data = body.replace(reg, '$1');
                    let comment = JSON.parse(data).total_number;
                    let site = '芒果TV';
                    let createdAt = new Date();
                    let name = tv.t2;
                    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId + name;
                    let _movie = {
                        _id: _id,
                        filmId: filmId,
                        name: name,
                        site: site,
                        play: play,
                        comment: comment,
                        up: up,
                        down: down,
                        createdAt: createdAt
                    };
                    yield dbInserter(movie_1.Movie, _movie);
                }
                catch (error) {
                    console.log(error);
                }
            }));
            return Promise.all(promises);
        }
        catch (error) {
            console.log(error);
        }
    });
};
let showCrawler = function (vcid, vsite, vpath, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(10 * 1000);
        try {
            let requrl = 'http://www.hunantv.com/' + vsite + '/' + vpath + '/' + vcid + '/s/json.year.js';
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let reg = /.+(\[.+\])\)/;
            let data = body.replace(reg, '$1');
            let years = JSON.parse(data);
            let showlist = [];
            for (let year of years) {
                let requrl = 'http://www.hunantv.com/' + vsite + '/' + vpath + '/' + vcid + '/s/json.' + year + '.js';
                let options = {
                    url: requrl,
                    timeout: 1000 * 60 * 2
                };
                let body = yield rp(options);
                let reg = /[^\[]+(\[.+\])\)/;
                let data = body.replace(reg, '$1');
                let vlist = JSON.parse(data);
                showlist = showlist.concat(vlist);
            }
            let promises = showlist.map((show, index) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield timeout(1 * 1000 * 5 * (index / 100));
                    let requrl = 'http://videocenter-2039197532.cn-north-1.elb.amazonaws.com.cn//dynamicinfo?vid=' + show.id;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let play = JSON.parse(body).data.all;
                    let up = JSON.parse(body).data.like;
                    let down = JSON.parse(body).data.unlike;
                    requrl = 'http://comment.hunantv.com/video_comment/list/?subject_id=' + show.id;
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    let reg = /[^\[]+(\[.+\])\)/;
                    let data = body.replace(reg, '$1');
                    let comment = JSON.parse(data).total_number;
                    let name = show.stitle + show.title;
                    let site = '芒果TV';
                    let createdAt = new Date();
                    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId + name;
                    let _movie = {
                        _id: _id,
                        filmId: filmId,
                        name: name,
                        site: site,
                        play: play,
                        comment: comment,
                        up: up,
                        down: down
                    };
                    yield dbInserter(movie_1.Movie, _movie);
                }
                catch (error) {
                    console.log(error);
                }
            }));
            return Promise.all(promises);
        }
        catch (error) {
            console.log(error);
        }
    });
};
let mgtv = {};
exports.Mgtv = mgtv;
mgtv.parse = function (obj) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let options = {
                url: obj.url,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let { vid, cid, site, path, type } = parseVideo(body);
            if (!site.includes('湖南卫视')) {
                switch (type) {
                    case '电影':
                        yield mvCrawler(vid, obj.filmId);
                        break;
                    case '电视剧':
                        yield tvCrawler(vid, obj.filmId);
                        break;
                    default:
                        yield showCrawler(cid, site, path, obj.filmId);
                        break;
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    });
};
//# sourceMappingURL=mgtv.js.map