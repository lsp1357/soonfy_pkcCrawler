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
    let type;
    let title;
    let pos = data.indexOf('videoId = \'');
    let vid = data.substring(pos + 11, data.indexOf('\';', pos + 11)).replace(/ /g, '');
    list_meta.each(function (index, _meta) {
        if ($(_meta).attr('name') === 'irAlbumName') {
            title = $(_meta).attr('content');
        }
        if ($(_meta).attr('name') === 'irCategory') {
            type = $(_meta).attr('content');
        }
    });
    pos = data.indexOf('let showid_en=\"');
    let requrl = 'http://www.youku.com/show_page/id_z' + data.substring(pos + 15, data.indexOf('\";', pos + 15)) + '.html';
    let url = $('h1').children('a').attr('href') || requrl;
    video.type = type;
    video.title = title;
    video.vid = vid;
    video.curl = url;
    return video;
};
var parseSectionData = function (data) {
    var $ = cheerio.load(data);
    var list_item = $('ul');
    var list_data = [];
    list_item.each(function () {
        var tempObj = {};
        tempObj.url = $(this).children('li').children('a').attr('href');
        tempObj.name = $(this).children('li').children('a').attr('title');
        if (tempObj.url) {
            list_data.push(tempObj);
        }
    });
    return list_data;
};
let mvCrawler = function (vid, filmId, url) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(10 * 1000);
        try {
            let requrl = 'http://v.youku.com/QVideo/~ajax/getVideoPlayInfo?type=vv&id=';
            let options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let playSum = JSON.parse(body).vv;
            requrl = 'http://comments.youku.com/comments/~ajax/getStatus.html?__ap=%7B%22videoid%22%3A%22' + vid + '%22%7D';
            options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            body = yield rp(options);
            let commentSum = JSON.parse(body).total;
            requrl = 'http://v.youku.com/action/getVideoPlayInfo?beta&vid=' + vid + '&param%5B%5D=updown';
            options = {
                url: requrl,
                timeout: 1000 * 60 * 2
            };
            body = yield rp(options);
            let upSum = parseInt(JSON.parse(body).data.updown.up.replace(/,/g, ''));
            let downSum = parseInt(JSON.parse(body).data.updown.down.replace(/,/g, ''));
            let site = '优酷';
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
let showCrawler = function (url, filmId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield timeout(10 * 1000);
        try {
            let options = {
                url: url,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let $ = cheerio.load(body);
            let showlist = [];
            if ($('.pgm-list').length > 0) {
                let pid = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
                let list_li = $('.pgm-list').find('li');
                let list_section = [];
                list_li.each(function (index, _li) {
                    list_section.push($(_li).attr('data'));
                });
                for (let section of list_section) {
                    let requrl = 'http://www.youku.com/show_episode/' + pid + '.html?dt=json&divid=' + section;
                    let options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let vlist = parseSectionData(body);
                    showlist = showlist.concat(vlist);
                }
            }
            else {
                let list_li = $('#episode_wrap').find('li');
                list_li.each(function (index, _li) {
                    let tempObj = {};
                    tempObj.name = $(_li).children('a').attr('title');
                    tempObj.url = $(_li).children('a').attr('href');
                    if (tempObj.url) {
                        showlist.push(tempObj);
                    }
                });
            }
            let promises = showlist.map((show, index) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield timeout(1 * 1000 * 5 * (index / 100));
                    let options = {
                        url: show.url,
                        timeout: 1000 * 60 * 2
                    };
                    let body = yield rp(options);
                    let pos = body.indexOf('videoId = \'');
                    let vid = body.substring(pos + 11, body.indexOf('\';', pos + 11)).replace(/ /g, '');
                    let requrl = 'http://v.youku.com/QVideo/~ajax/getVideoPlayInfo?type=vv&id=' + vid;
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    let play = JSON.parse(body).vv;
                    requrl = 'http://comments.youku.com/comments/~ajax/getStatus.html?__ap=%7B%22videoid%22%3A%22' + vid + '%22%7D';
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    let comment = JSON.parse(body).total;
                    requrl = 'http://v.youku.com/action/getVideoPlayInfo?beta&vid=' + vid + '&param%5B%5D=updown';
                    options = {
                        url: requrl,
                        timeout: 1000 * 60 * 2
                    };
                    body = yield rp(options);
                    let up = parseInt(JSON.parse(body).data.updown.up.replace(/,/g, ''));
                    let down = parseInt(JSON.parse(body).data.updown.down.replace(/,/g, ''));
                    let name = show.name;
                    let site = '优酷';
                    let createdAt = new Date();
                    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId + name;
                    let _movie = {
                        _id: _id,
                        filmId: filmId,
                        site: site,
                        name: name,
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
let youku = {};
exports.Youku = youku;
youku.parse = function (obj) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let options = {
                url: obj.url,
                timeout: 1000 * 60 * 2
            };
            let body = yield rp(options);
            let { vid, curl, type } = parseVideo(body);
            if (type) {
                switch (type) {
                    case '电影':
                        yield mvCrawler(vid, obj.filmId, obj.url);
                        break;
                    default:
                        yield showCrawler(curl, obj.filmId);
                        break;
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    });
};
//# sourceMappingURL=youku.js.map