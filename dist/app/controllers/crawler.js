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
let urlsGetter = function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let urls = yield film2url_1.Url.find().sort({ site: 1, category: 1 }).exec();
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
let main = function (num, time) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('start crawler...');
            let urls = yield urlsGetter();
            console.log(urls.length);
            yield timeout(1 * 1000 * 10);
            let _arr = urls.slice(0, num);
            yield crawler(_arr);
            let count = num;
            console.log('------------------------------------');
            console.log('------------------------------------');
            console.log('------------------------------------');
            console.log('the crawl time is ', time);
            console.log('now is crawl ', count);
            console.log('urls length', urls.length);
            yield timeout(1 * 1000 * 10);
            while (count < urls.length) {
                let _arr = urls.slice(count, count + num);
                yield crawler(_arr);
                count += num;
                console.log('------------------------------------');
                console.log('------------------------------------');
                console.log('------------------------------------');
                console.log('the crawl time is ', time);
                console.log('now is crawl ', count);
                console.log('urls length', urls.length);
                yield timeout(1 * 1000 * 10);
            }
            console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
            console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
            console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
            console.log('all urls walk over.');
            yield timeout(1 * 1000 * 60);
            console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
            console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
            console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
            console.log('next time crawl.');
            console.log('the crawl time is ', time + 1);
            yield timeout(1 * 1000 * 60);
            yield main(fast, time + 1);
        }
        catch (error) {
            console.log(error);
        }
    });
};
main(10, 1);
//# sourceMappingURL=crawler.js.map