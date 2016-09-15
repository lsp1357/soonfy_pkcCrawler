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
var parseVideo = function (data) {
    var video = {};
    var $ = cheerio.load(data);
    var list_meta = $('meta');
    var pos = data.indexOf('pid:');
    video.pid = data.substring(pos + 5, data.indexOf(',', pos)).replace(/ /g, '');
    pos = data.indexOf('vid:');
    video.vid = data.substring(pos + 5, data.indexOf(',', pos)).replace(/ /g, '');
    pos = data.indexOf('cid:');
    video.cid = data.substring(pos + 5, data.indexOf(',', pos)).replace(/ /g, '');
    pos = data.indexOf('nowEpisodes:');
    video.length = data.substring(pos + 13, data.indexOf(',', pos) - 1).replace(/ /g, '');
    list_meta.each(function (index, _meta) {
        if ($(_meta).attr('name') === 'irAlbumName') {
            video.title = $(_meta).attr('content');
        }
        if ($(_meta).attr('name') === 'irCategory') {
            video.type = $(_meta).attr('content');
        }
    });
    return video;
};
let mvCrawler = function (pid, vid, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(1 * 1000);
        try {
            let requrl = 'http://v.stat.letv.com/vplay/queryMmsTotalPCount?pid=' + pid;
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let playSum = JSON.parse(body).plist_play_count;
            let commentSum = JSON.parse(body).pcomm_count;
            requrl = 'http://v.stat.letv.com/vplay/getIdsInfo?ids=' + vid;
            options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            body = yield rp(options);
            let upSum = JSON.parse(body)[0].up;
            let downSum = JSON.parse(body)[0].down;
            let site = '乐视视频';
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
let tvCrawler = function (pid, cid, length, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield timeout(1 * 1000);
            let i = 1;
            let pages = [];
            while (i < length) {
                pages.push(i);
                i += 100;
            }
            let tvlist = [];
            for (let page of pages) {
                let requrl = 'http://api.letv.com/mms/out/album/videos?id=' + pid + '&cid=' + cid + '&platform=pc&page=' + page;
                let options = {
                    url: requrl,
                    timeout: 1000 * 60 * 2
                };
                let body = yield rp(options);
                let vlist = JSON.parse(body).data;
                vlist.map(tv => {
                    if (tv.key <= length) {
                        tvlist.push(tv);
                    }
                });
            }
            let promises = tvlist.map((tv, index) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield timeout(1 * 1000 * 5 * (index / 100));
                    let requrl = 'http://v.stat.letv.com/vplay/queryMmsTotalPCount?pid=' + pid + '&vid=' + tv.vid;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let playSum = JSON.parse(body).plist_play_count;
                    let commentSum = JSON.parse(body).pcomm_count;
                    let site = '乐视视频';
                    let createdAt = new Date();
                    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
                    let _count = {
                        _id: _id,
                        filmId: filmId,
                        site: site,
                        playSum: playSum,
                        commentSum: commentSum,
                        createdAt: createdAt
                    };
                    console.log(_count);
                    yield dbInserter(count_1.Count, _count);
                    let name = tv.title;
                    let up = JSON.parse(body).up;
                    let down = JSON.parse(body).down;
                    _id = _id + name;
                    let _movie = {
                        _id: _id,
                        filmId: filmId,
                        site: site,
                        name: name,
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
let showCrawler = function (pid, cid, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(1 * 1000);
        try {
            let requrl = 'http://api.letv.com/mms/out/album/videos?id=' + pid + '&cid=' + cid + '&platform=pc&relvideo=1';
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let showlist = [];
            let timeo = JSON.parse(body).data;
            for (let year of Object.keys(timeo)) {
                for (let month of Object.keys(timeo[year])) {
                    let requrl = 'http://api.letv.com/mms/out/album/videos?id=' + pid + '&cid=' + cid + '&platform=pc&relvideo=1&year=' + year + '&month=' + month;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let vlist = JSON.parse(body).data[year][month];
                    showlist = showlist.concat(vlist);
                }
            }
            let promises = showlist.map((show, index) => __awaiter(this, void 0, void 0, function* () {
                yield timeout(1 * 1000 * 5 * (index / 100));
                try {
                    let requrl = 'http://v.stat.letv.com/vplay/queryMmsTotalPCount?pid=' + pid + '&vid=' + show.vid;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let playSum = JSON.parse(body).plist_play_count;
                    let commentSum = JSON.parse(body).pcomm_count;
                    let site = '乐视视频';
                    let createdAt = new Date();
                    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
                    let _count = {
                        _id: _id,
                        filmId: filmId,
                        site: site,
                        playSum: playSum,
                        commentSum: commentSum,
                        createdAt: createdAt
                    };
                    console.log(_count);
                    yield dbInserter(count_1.Count, _count);
                    let name = show.title;
                    let up = JSON.parse(body).up;
                    let down = JSON.parse(body).down;
                    _id = _id + name;
                    let _movie = {
                        _id: _id,
                        filmId: filmId,
                        site: site,
                        name: name,
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
let letv = {};
exports.Letv = letv;
letv.parse = function (obj) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let options = {
                url: obj.url,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let { pid, vid, cid, type, length } = parseVideo(body);
            if (type) {
                switch (type) {
                    case '电影':
                        yield mvCrawler(pid, vid, obj.filmId);
                        break;
                    case '电视剧':
                    case '动漫':
                        yield tvCrawler(pid, cid, length, obj.filmId);
                        break;
                    default:
                        yield showCrawler(pid, cid, obj.filmId);
                        break;
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    });
};
//# sourceMappingURL=letv.js.map