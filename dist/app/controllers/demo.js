var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
let rp = require('request-promise');
let iconv = require('iconv-lite');
let cheerio = require('cheerio');
let getter = function () {
    return __awaiter(this, void 0, void 0, function* () {
        let href = 'http://v.qq.com/cover/m/mknc9zpas6ry30i.html?vid=e0329rk9idq';
        let options = {
            url: href
        };
        let body = yield rp(options);
        let $ = cheerio.load(body);
        if ($('title').text().includes('正在跳转')) {
            let url = href.replace(/\/prev\//ig, "/cover/").replace(/cover\/(\w)\//ig, "x/cover/");
            console.log(url);
            let options = {
                url: url
            };
            body = yield rp(options);
        }
        console.log(body);
    });
};
let crawler = function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('start');
        yield getter();
        console.log('end');
    });
};
//# sourceMappingURL=demo.js.map