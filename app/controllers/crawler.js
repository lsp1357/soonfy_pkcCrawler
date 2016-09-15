import {Url} from '../models/film2url';
import {Iqiyi} from './iqiyi'
import {QQ} from './qq'
import {Letv} from './letv'
import {Sohu} from './sohu'
import {Youku} from './youku'
import {Tudou} from './tudou'
import {Mgtv} from './mgtv'

let urlsGetter = async function () {
  try {
    let urls = await Url.find().sort({site: 1, category: 1}).exec();
    return urls;
  } catch (error) {
    console.log(error);
    filmGetter();
  }
}

let timeout = async function (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  })
}

//并发执行
let crawler = async function (arr) {
  let promises = arr.map(async function (obj) {
    // console.log(obj);
    try {
      switch (obj.site) {
        case '爱奇艺':
          return await Iqiyi.parse(obj);
        case '腾讯视频':
          return await QQ.parse(obj);
        case '乐视视频':
          return await Letv.parse(obj);
        case '搜狐视频':
          return await Sohu.parse(obj);
        case '优酷':
          return await Youku.parse(obj)
        case '土豆网':
          return await Tudou.parse(obj)
        case '芒果TV':
          return await Mgtv.parse(obj)
        default:
          console.log('obj site is error.')
          break;
      } 
    } catch (error) {
      console.log(error);
    }
  })
  return await Promise.all(promises);
}

//分批次
let main = async function (num, time) {
  try {
    console.log('start crawler...');

    let urls = await urlsGetter();
    console.log(urls.length);
    await timeout(1 * 1000 * 10);

    let _arr = urls.slice(0, num);
    await crawler(_arr);
    let count = num;
    console.log('------------------------------------');
    console.log('------------------------------------');
    console.log('------------------------------------');
    console.log('the crawl time is ', time);
    console.log('now is crawl ', count);
    console.log('urls length', urls.length);
    await timeout(1 * 1000 * 10);

    while (count < urls.length) {
      let _arr = urls.slice(count, count + num);
      await crawler(_arr);
      count += num;
      console.log('------------------------------------');
      console.log('------------------------------------');
      console.log('------------------------------------');
      console.log('the crawl time is ', time);
      console.log('now is crawl ', count);
      console.log('urls length', urls.length);
      await timeout(1 * 1000 * 10);
    }

    //一轮结束
    console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
    console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
    console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
    console.log('all urls walk over.');
    await timeout(1 * 1000 * 60);

    //下次采集
    console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
    console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
    console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
    console.log('next time crawl.');
    console.log('the crawl time is ', time + 1);
    await timeout(1 * 1000 * 60);

    await main(num, time + 1);
  } catch (error) {
    console.log(error);
  }
}

//限定并发数目，执行次数
main(10, 1);
