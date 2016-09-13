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
let getter = function () {
    return __awaiter(this, void 0, void 0, function* () {
        let options = {
            url: 'http://pl.hd.sohu.com/videolist?playlistid=1001374&pagenum=1&pagesize=100',
            encoding: null
        };
        let body = yield rp(options);
        console.log(body);
        console.log(iconv.decode(body, 'gbk'));
    });
};
let crawler = function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(1);
        yield getter();
        console.log(2);
    });
};
//# sourceMappingURL=demo.js.map