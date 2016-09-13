"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const film2url_1 = require('../models/film2url');
const iqiyi_1 = require('./iqiyi');
const qq_1 = require('./qq');
const letv_1 = require('./letv');
const sohu_1 = require('./sohu');
const youku_1 = require('./youku');
const tudou_1 = require('./tudou');
const mgtv_1 = require('./mgtv');
let schedule = require('node-schedule');
let iqlsGetter = function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let urls = yield film2url_1.Url.find({ site: { $in: ['爱奇艺', '腾讯视频', '乐视视频', '搜狐视频'] } }).sort({ site: 1, category: 1 }).exec();
            return urls;
        }
        catch (error) {
            console.log(error);
            filmGetter();
        }
    });
};
let ytmGetter = function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let urls = yield film2url_1.Url.find({ site: { $in: ['优酷', '土豆网', '芒果TV'] } }).sort({ site: 1, category: 1 }).exec();
            return urls;
        }
        catch (error) {
            console.log(error);
            filmGetter();
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
let crawler = function (arr) {
    return __awaiter(this, void 0, void 0, function* () {
        let promises = arr.map(function (obj) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    switch (obj.site) {
                        case '爱奇艺':
                            return yield iqiyi_1.Iqiyi.parse(obj);
                        case '腾讯视频':
                            return yield qq_1.QQ.parse(obj);
                        case '乐视视频':
                            return yield letv_1.Letv.parse(obj);
                        case '搜狐视频':
                            return yield sohu_1.Sohu.parse(obj);
                        case '优酷':
                            return yield youku_1.Youku.parse(obj);
                        case '土豆网':
                            return yield tudou_1.Tudou.parse(obj);
                        case '芒果TV':
                            return yield mgtv_1.Mgtv.parse(obj);
                        default:
                            console.log('obj site is error.');
                            break;
                    }
                }
                catch (error) {
                    console.log(error);
                }
            });
        });
        return yield Promise.all(promises);
    });
};
let fastCrawler = function (fast) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let urls = yield iqlsGetter();
            let _arr = urls.slice(0, fast);
            yield crawler(_arr);
            let count = fast;
            while (count < urls.length) {
                let _arr = urls.slice(count, count + fast);
                yield crawler(_arr);
                count += fast;
                yield timeout(1 * 1000);
                console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
                console.log('fast now is crawl ', count);
            }
        }
        catch (error) {
            console.log(error);
        }
    });
};
let slowCrawler = function (slow) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let urls = yield ytmGetter();
            let _arr = urls.slice(0, slow);
            yield crawler(_arr);
            let count = slow;
            while (count < urls.length) {
                let _arr = urls.slice(count, count + slow);
                yield crawler(_arr);
                count += slow;
                yield timeout(10 * 1000);
                console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
                console.log('slow now is crawl ', count);
            }
        }
        catch (error) {
            console.log(error);
        }
    });
};
let main = function (fast, slow) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('start crawler...');
            let urls = yield iqlsGetter();
            let _arr = urls.slice(0, fast);
            yield crawler(_arr);
            let count = fast;
            console.log('fast now is crawl ', count);
            while (count < urls.length) {
                let _arr = urls.slice(count, count + fast);
                yield crawler(_arr);
                count += fast;
                yield timeout(1 * 1000);
                console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
                console.log('fast now is crawl ', count);
            }
            urls = yield ytmGetter();
            _arr = urls.slice(0, slow);
            yield crawler(_arr);
            count = slow;
            console.log('slow now is crawl ', count);
            while (count < urls.length) {
                let _arr = urls.slice(count, count + slow);
                yield crawler(_arr);
                count += slow;
                yield timeout(10 * 1000);
                console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
                console.log('slow now is crawl ', count);
            }
            console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
            console.log('all urls walk over.');
        }
        catch (error) {
            console.log(error);
        }
    });
};
main(40, 20);
let rule = new schedule.RecurrenceRule();
let timer = schedule.scheduleJob('0 0 */5 * * *', function () {
    main(40, 20);
});
//# sourceMappingURL=crawler.js.map