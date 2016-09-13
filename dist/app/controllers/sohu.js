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
let iconv = require('iconv-lite');
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
    let pos = data.indexOf('playlistId="');
    let pid = data.substring(pos + 12, data.indexOf('";', pos + 12)).replace(/ /g, '');
    pos = data.indexOf('vid="');
    let vid = data.substring(pos + 5, data.indexOf('";', pos + 5)).replace(/ /g, '');
    pos = data.indexOf('tvid');
    let tvid = data.substring(data.indexOf('"', pos + 5) + 1, data.indexOf('";', pos + 6)).replace(/ /g, '');
    pos = data.indexOf('cid="');
    let cid = data.substring(pos + 5, data.indexOf('";', pos + 5)).replace(/ /g, '');
    let title;
    let type;
    list_meta.each(function (index, _meta) {
        if ($(_meta).attr('name') === 'album') {
            title = $(_meta).attr('content');
        }
        if ($(_meta).attr('name') === 'category') {
            type = $(_meta).attr('content');
        }
    });
    video.pid = pid;
    video.vid = vid;
    video.tvid = tvid;
    video.cid = cid;
    video.title = title;
    video.type = type;
    return video;
};
let mvCrawler = function (pid, vid, tvid, filmId, url) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(1 * 1000);
        try {
            let requrl = 'http://count.vrs.sohu.com/count/queryext.action?plids=' + pid + '&vids=' + vid;
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let pos = body.indexOf('total":');
            let playSum = body.substring(pos + 7, body.indexOf(',', pos)).replace(/ /g, '');
            requrl = 'http://changyan.sohu.com/api/2/topic/load?client_id=cyqyBluaj&topic_url=' + url + '&topic_source_id=' + vid;
            options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            body = yield rp(options);
            let commentSum = JSON.parse(body).cmt_sum;
            requrl = 'http://score.my.tv.sohu.com/digg/get.do?type=1&tvid=' + tvid;
            options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            body = yield rp(options);
            let data = body.substring(body.indexOf('{'), body.lastIndexOf('}') + 1);
            let upSum = JSON.parse(data).upCount;
            let downSum = JSON.parse(data).downCount;
            let site = '搜狐视频';
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
let tvCrawler = function (pid, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(1 * 1000);
        try {
            let requrl = 'http://pl.hd.sohu.com/videolist?playlistid=' + pid;
            let options = {
                url: requrl,
                encoding: null,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let data = iconv.decode(body, 'gbk');
            let tvlist = JSON.parse(data).videos;
            for (let tv of tvlist) {
                try {
                    yield timeout(1 * 1000);
                    let requrl = 'http://count.vrs.sohu.com/count/queryext.action?plids=' + pid + '&vids=' + tv.vid;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let pos = body.indexOf('total":');
                    let playSum = body.substring(pos + 7, body.indexOf(',', pos)).replace(/ /g, '');
                    requrl = 'http://changyan.sohu.com/api/2/topic/load?client_id=cyqyBluaj&topic_url=' + tv.pageUrl + '&topic_source_id=' + tv.vid;
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    let commentSum = JSON.parse(body).cmt_sum;
                    let site = '搜狐视频';
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
                    requrl = 'http://score.my.tv.sohu.com/digg/get.do?type=2&tvid=' + tv.tvId;
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    let data = body.substring(body.indexOf('{'), body.lastIndexOf('}') + 1);
                    let up = JSON.parse(data).upCount;
                    let down = JSON.parse(data).downCount;
                    let name = tv.name;
                    _id = _id + name;
                    let _movie = {
                        _id: _id,
                        filmId: filmId,
                        name: name,
                        site: site,
                        up: up,
                        down: down,
                        createdAt: createdAt
                    };
                    yield dbInserter(movie_1.Movie, _movie);
                }
                catch (error) {
                    console.log(error);
                }
            }
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
            let requrl = 'http://pl.hd.sohu.com/videolist?playlistid=' + pid;
            let options = {
                url: requrl,
                encoding: null,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let data = iconv.decode(body, 'gbk');
            let length = JSON.parse(data).size;
            let pages = [];
            let i = 1;
            while (i < length) {
                pages.push(i);
                i += 100;
            }
            let showlist = [];
            for (let page of pages) {
                let requrl = 'http://pl.hd.sohu.com/videolist?playlistid=' + pid + '&pagenum=' + page + '&pagesize=100';
                let options = {
                    url: requrl,
                    encoding: null,
                    timeout: 1000 * 60 * 2
                };
                let body = yield rp(options);
                let data = iconv.decode(body, 'gbk');
                let vlist = JSON.parse(data).videos;
                showlist = showlist.concat(vlist);
            }
            for (let show of showlist) {
                try {
                    yield timeout(1 * 1000);
                    let requrl = 'http://count.vrs.sohu.com/count/queryext.action?plids=' + pid + '&vids=' + show.vid;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let pos = body.indexOf('total":');
                    let playSum = body.substring(pos + 7, body.indexOf(',', pos)).replace(/ /g, '');
                    requrl = 'http://changyan.sohu.com/api/2/topic/load?client_id=cyqyBluaj&topic_url=' + show.pageUrl + '&topic_source_id=' + show.vid;
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    let commentSum = JSON.parse(body).cmt_sum;
                    let site = '搜狐视频';
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
                    requrl = 'http://score.my.tv.sohu.com/digg/get.do?type=' + cid + '&tvid=' + show.tvId;
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    let data = body.substring(body.indexOf('{'), body.lastIndexOf('}') + 1);
                    let up = JSON.parse(data).upCount;
                    let down = JSON.parse(data).downCount;
                    let name = show.name;
                    _id = _id + name;
                    let _movie = {
                        _id: _id,
                        filmId: filmId,
                        name: name,
                        site: site,
                        up: up,
                        down: down,
                        createdAt: createdAt
                    };
                    yield dbInserter(movie_1.Movie, _movie);
                }
                catch (error) {
                    console.log(error);
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    });
};
let sohu = {};
exports.Sohu = sohu;
sohu.parse = function (obj) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let options = {
                url: obj.url,
                encoding: null
            };
            let body = yield rp(options);
            let data = iconv.decode(body, 'gbk');
            let { pid, vid, tvid, cid, type } = parseVideo(data);
            if (type) {
                switch (type) {
                    case '电影':
                        yield mvCrawler(pid, vid, tvid, obj.filmId, obj.url);
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
//# sourceMappingURL=sohu.js.map