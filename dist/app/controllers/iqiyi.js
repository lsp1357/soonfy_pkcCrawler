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
    let $ = cheerio.load(data);
    let list_meta = $('meta');
    let pos = data.indexOf('sourceId:');
    let sid = data.substring(pos + 9, data.indexOf(',', pos)).replace(/ /g, '');
    pos = data.indexOf('albumId:');
    let aid = data.substring(pos + 8, data.indexOf(',', pos)).replace(/ /g, '');
    pos = data.indexOf('cid:');
    let cid = data.substring(pos + 4, data.indexOf(',', pos)).replace(/ /g, '');
    video.pid = sid == 0 ? aid : sid;
    video.cid = cid;
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
let mvCrawler = function (pid, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(1 * 1000);
        let requrl = 'http://mixer.video.iqiyi.com/jp/mixin/videos/' + pid;
        try {
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let reg = /var\s+tvInfoJs=()/;
            let data = body.replace(reg, '$1');
            let { playCount: playSum, commentCount: commentSum, upCount: upSum, downCount: downSum } = JSON.parse(data);
            let site = '爱奇艺';
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
            yield dbInserter(count_1.Count, _count);
        }
        catch (error) {
            console.log(error);
        }
    });
};
let tvCrawler = function (pid, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(1 * 1000);
        try {
            let requrl = 'http://cache.video.qiyi.com/jp/avlist/' + pid + '/';
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let reg = /var\s+tvInfoJs=()/;
            let data = body.replace(reg, '$1');
            let pagemax = JSON.parse(data).data.pgt;
            let i = 1;
            let pages = [];
            while (i <= pagemax) {
                pages.push(i);
                i++;
            }
            let tvlist = [];
            for (let page of pages) {
                let requrl = 'http://cache.video.qiyi.com/jp/avlist/' + pid + '/' + page + '/';
                let options = {
                    url: requrl,
                    timeout: 1000 * 60 * 2
                };
                let body = yield rp(options);
                let reg = /var\s+tvInfoJs=()/;
                let data = body.replace(reg, '$1');
                let vlist = JSON.parse(data).data.vlist;
                tvlist = tvlist.concat(vlist);
            }
            let promises = tvlist.map((tv, index) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield timeout(1 * 1000 * 5 * (index / 100));
                    let vid = tv.id;
                    let requrl = 'http://mixer.video.iqiyi.com/jp/mixin/videos/' + vid;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let reg = /var\s+tvInfoJs=()/;
                    let data = body.replace(reg, '$1');
                    let { name, playCount: playSum, commentCount: comment, upCount: up, downCount: down } = JSON.parse(data);
                    let site = '爱奇艺';
                    let createdAt = new Date();
                    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
                    let _count = {
                        _id: _id,
                        filmId: filmId,
                        playSum: playSum,
                        site: site,
                        createdAt: createdAt,
                    };
                    yield dbInserter(count_1.Count, _count);
                    _id = _id + name;
                    let _movie = {
                        _id: _id,
                        filmId: filmId,
                        name: name,
                        site: site,
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
let showCrawler = function (pid, cid, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(1 * 1000);
        try {
            let requrl = 'http://cache.video.qiyi.com/jp/sdlst/' + cid + '/' + pid + '/';
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let reg = /var\s+tvInfoJs=()/;
            let data = body.replace(reg, '$1');
            let yearo = JSON.parse(data).data;
            let showlist = [];
            for (let year of Object.keys(yearo)) {
                let requrl = 'http://cache.video.qiyi.com/jp/sdvlst/' + cid + '/' + pid + '/' + year + '/';
                let options = {
                    url: requrl,
                    timeout: 1000 * 60 * 2
                };
                let body = yield rp(options);
                let reg = /var\s+tvInfoJs=()/;
                let data = body.replace(reg, '$1');
                let vlist = JSON.parse(data).data;
                showlist = showlist.concat(vlist);
            }
            let promises = showlist.map((show, index) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield timeout(1 * 1000 * 5 * (index / 100));
                    let requrl = 'http://mixer.video.iqiyi.com/jp/mixin/videos/' + show.tvId;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let reg = /var\s+tvInfoJs=()/;
                    let data = body.replace(reg, '$1');
                    let { name, playCount: play, commentCount: comment, upCount: up, downCount: down } = JSON.parse(data);
                    let site = '爱奇艺';
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
let iqiyi = {};
exports.Iqiyi = iqiyi;
iqiyi.parse = function (obj) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let options = {
                url: obj.url,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let { title, pid, cid, type } = parseVideo(body);
            if (title) {
                switch (type) {
                    case '电影':
                        yield mvCrawler(pid, obj.filmId);
                        break;
                    case '电视剧':
                        yield tvCrawler(pid, obj.filmId);
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
//# sourceMappingURL=iqiyi.js.map