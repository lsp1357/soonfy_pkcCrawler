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
    let pos = data.indexOf('typeid:');
    let typeid = data.substring(pos + 7, data.indexOf(',', pos + 7)).replace(/ /g, '');
    let vtype = typeid === '1' ? '电影' : typeid === '2' ? '电视剧' : typeid === '10' ? '综艺' : '综艺';
    let type = $('div.breadcrumb').children('a').first().attr('title');
    let url = $('div.breadcrumb').children('a').last().attr('href');
    let pid = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.')).replace(/ /g, '');
    let furl = $('div.breadcrumb').children('a').eq(1).attr('href') || '';
    let fid = furl.substring(furl.lastIndexOf('/') + 1, furl.lastIndexOf('.')).replace(/ /g, '');
    let ftitle = $('div.breadcrumb').children('a').eq(1).attr('title') || '';
    let infoindex = data.indexOf('COVER_INFO');
    let nameindex = data.indexOf('"', infoindex);
    let lastindex = data.indexOf('"', nameindex + 1);
    let info = data.substring(nameindex + 1, lastindex).replace(/ /g, '');
    let title = $('.breadcrumb').children('a').last().attr('title') || info;
    video.type = type;
    video.pid = pid;
    video.title = title;
    video.fid = fid;
    video.ftitle = ftitle;
    video.url = url;
    return video;
};
let mvCrawler = function (pid, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(1 * 1000);
        let requrl = 'http://data.video.qq.com/fcgi-bin/data?tid=70&appid=10001007&appkey=e075742beb866145&otype=json&idlist=' + pid;
        try {
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let reg = /QZOutputJson=(.+);/;
            let data = body.replace(reg, '$1');
            let playSum = JSON.parse(data).results[0].fields.allnumc;
            let site = '腾讯视频';
            let createdAt = new Date();
            let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
            let _count = {
                _id: _id,
                filmId: filmId,
                site: site,
                playSum: playSum,
                createdAt: createdAt
            };
            console.log(_count);
            yield dbInserter(count_1.Count, _count);
            requrl = 'http://sns.video.qq.com/fcgi-bin/video_comment_id?otype=json&op=3&cid=' + pid;
            options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            body = yield rp(options);
            data = body.replace(reg, '$1');
            let cid = JSON.parse(data).comment_id;
            requrl = 'http://coral.qq.com/article/' + cid + '/commentnum';
            options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            body = yield rp(options);
            let commentSum = JSON.parse(body).data.commentnum;
            _count = yield count_1.Count.findOne({ _id: _id }).exec();
            if (_count !== null) {
                _count.commentSum = commentSum;
                yield _count.save();
            }
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
            let requrl = 'http://data.video.qq.com/fcgi-bin/data?tid=70&appid=10001007&appkey=e075742beb866145&otype=json&idlist=' + pid;
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let reg = /QZOutputJson=(.+);/;
            let data = body.replace(reg, '$1');
            let playSum = JSON.parse(data).results[0].fields.allnumc;
            let site = '腾讯视频';
            let createdAt = new Date();
            let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
            let _count = {
                _id: _id,
                filmId: filmId,
                site: site,
                playSum: playSum,
                createdAt: createdAt
            };
            console.log(_count);
            yield dbInserter(count_1.Count, _count);
            requrl = 'http://s.video.qq.com/loadplaylist?type=6&plname=qq&otype=json&id=' + pid;
            options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            body = yield rp(options);
            reg = /QZOutputJson=(.+);/;
            data = body.replace(reg, '$1');
            let tvlist = JSON.parse(data).video_play_list.playlist;
            let countId = _id;
            let promises = tvlist.map((tv, index) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield timeout(1 * 1000 * 5 * (index / 100));
                    let requrl = 'http://sns.video.qq.com/fcgi-bin/video_comment_id?otype=json&op=3&vid=' + tv.id;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let data = body.replace(reg, '$1');
                    let cid = JSON.parse(data).comment_id;
                    requrl = 'http://coral.qq.com/article/' + cid + '/commentnum';
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    let comment = JSON.parse(body).data.commentnum;
                    let name = tv.title;
                    let _id = countId + name;
                    let _movie = {
                        _id: _id,
                        filmId: filmId,
                        name: name,
                        site: site,
                        comment: comment,
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
let showCrawler = function (pid, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(1 * 1000);
        try {
            let requrl = 'http://s.video.qq.com/loadplaylist?type=6&plname=qq&otype=json&id=' + pid;
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let reg = /QZOutputJson=(.+);/;
            let data = body.replace(reg, '$1');
            let years = JSON.parse(data).video_play_list.year;
            let showlist = [];
            for (let year of years) {
                let requrl = 'http://s.video.qq.com/loadplaylist?type=4&plname=qq&otype=json&id=' + pid + '&year=' + year;
                let options = {
                    url: requrl,
                    timeout: 1000 * 60 * 2
                };
                let body = yield rp(options);
                let reg = /QZOutputJson=(.+);/;
                let data = body.replace(reg, '$1');
                let vlist = JSON.parse(data).video_play_list.playlist;
                showlist.concat(vlist);
            }
            let promises = showlist.map((show, index) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield timeout(1 * 1000 * 5 * (index / 100));
                    let vid = show.id;
                    let requrl = 'http://data.video.qq.com/fcgi-bin/data?tid=70&appid=10001007&appkey=e075742beb866145&otype=json&idlist=' + vid;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let reg = /QZOutputJson=(.+);/;
                    let data = body.replace(reg, '$1');
                    let playSum = JSON.parse(data).results[0].fields.column.c_column_view.c_allnumc;
                    let site = '腾讯视频';
                    let createdAt = new Date();
                    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
                    let _count = {
                        _id: _id,
                        filmId: filmId,
                        site: site,
                        playSum: playSum,
                        createdAt: createdAt
                    };
                    console.log(_count);
                    yield dbInserter(count_1.Count, _count);
                    requrl = 'http://sns.video.qq.com/fcgi-bin/video_comment_id?otype=json&op=3&cid=' + vid;
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    data = body.replace(reg, '$1');
                    let cid = JSON.parse(data).comment_id;
                    requrl = 'http://coral.qq.com/article/' + cid + '/commentnum';
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    let comment = JSON.parse(body).data.commentnum;
                    let name = show.title;
                    _id = _id + name;
                    let _movie = {
                        _id: _id,
                        filmId: filmId,
                        name: name,
                        site: site,
                        comment: comment,
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
let qq = {};
exports.QQ = qq;
qq.parse = function (obj) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let options = {
                url: obj.url,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let { title, pid, type } = parseVideo(body);
            if (title.indexOf('utf-8') === -1 && title.indexOf('zh-cn') === -1 && title.indexOf('Content-Type') === -1) {
                switch (type) {
                    case '电影':
                        yield mvCrawler(pid, obj.filmId);
                        break;
                    case '电视剧':
                    case '动漫':
                        yield tvCrawler(pid, obj.filmId);
                        break;
                    default:
                        yield showCrawler(pid, obj.filmId);
                        break;
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    });
};
//# sourceMappingURL=qq.js.map