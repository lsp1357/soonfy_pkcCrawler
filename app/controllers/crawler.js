import {Url} from '../models/film2url';
import {Iqiyi} from './iqiyi'
import {QQ} from './qq'
import {Letv} from './letv'
import {Sohu} from './sohu'
import {Youku} from './youku'
import {Tudou} from './tudou'
import {Mgtv} from './mgtv'

let schedule = require('node-schedule');

let iqlsGetter = async function () {
  try {
    let urls = await Url.find({site: {$in: ['爱奇艺', '腾讯视频', '乐视视频', '搜狐视频']}}).sort({site: 1, category: 1}).exec();
    return urls;
  } catch (error) {
    console.log(error);
    filmGetter();
  }
}

let ytmGetter = async function () {
  try {
    let urls = await Url.find({site: {$in: ['优酷', '土豆网', '芒果TV']}}).sort({site: 1, category: 1}).exec();
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


//继发执行
// let main = async function () {
//   try {
//     let urls = await urlGetter();
//     for(let obj of urls){
//       console.log(obj);
//       switch (obj.site) {
//         case '爱奇艺视频':
//           // await Iqiyi.parse(obj)
//           break;
//         case '腾讯视频':
//           // await QQ.parse(obj)
//           break;
//         case '乐视视频':
//           // await Letv.parse(obj)
//           break;
//         case '搜狐视频':
//           // await Sohu.parse(obj)
//           break;
//         case '优酷视频':
//           // await Youku.parse(obj)
//           break;
//         case '土豆视频':
//           // await Tudou.parse(obj)
//           break;
//         case '芒果视频':
//           await Mgtv.parse(obj)
//           break;
//         default:
//           console.log('obj site is error.')
//           console.log(obj)
//           break;
//       }
//     }
//     console.log('all urls walk over.');
//   } catch (error) {
//     console.log(error);
//   }
// }


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

let fastCrawler = async function (fast) {
  try {
    let urls = await iqlsGetter();
    let _arr = urls.slice(0, fast);
    await crawler(_arr);
    let count = fast;
    while (count < urls.length) {
      let _arr = urls.slice(count, count + fast);
      await crawler(_arr);
      count += fast;
      await timeout(1 * 1000);
      console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
      console.log('fast now is crawl ', count);
    }
  } catch (error) {
    console.log(error);
  }
}

let slowCrawler = async function (slow) {
  try {
    let urls = await ytmGetter();
    let _arr = urls.slice(0, slow);
    await crawler(_arr);
    let count = slow;
    while (count < urls.length) {
      let _arr = urls.slice(count, count + slow);
      await crawler(_arr);
      count += slow;
      await timeout(10 * 1000);
      console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
      console.log('slow now is crawl ', count);
    }
  } catch (error) {
    console.log(error);
  }
}
//分批次
let main = async function (fast, slow) {
  try {
    console.log('start crawler...');

    let urls = await iqlsGetter();
    let _arr = urls.slice(0, fast);
    await crawler(_arr);
    let count = fast;
    console.log('fast now is crawl ', count);
    while (count < urls.length) {
      let _arr = urls.slice(count, count + fast);
      await crawler(_arr);
      count += fast;
      await timeout(1 * 1000);
      console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
      console.log('fast now is crawl ', count);
    }

    urls = await ytmGetter();
    _arr = urls.slice(0, slow);
    await crawler(_arr);
    count = slow;
    console.log('slow now is crawl ', count);
    while (count < urls.length) {
      let _arr = urls.slice(count, count + slow);
      await crawler(_arr);
      count += slow;
      await timeout(10 * 1000);
      console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
      console.log('slow now is crawl ', count);
    }

    console.log('==> ==> ==> ==> ==> ==> ==> ==> ==> ==>');
    console.log('all urls walk over.');
    // //下次采集
    // console.log('next time crawl.');
    // await main(fast, slow);
  } catch (error) {
    console.log(error);
  }
}

//限定并发数目
main(40, 20);

//上线定时任务
let rule = new schedule.RecurrenceRule();
let timer = schedule.scheduleJob('0 0 */5 * * *', function () {
  main(40, 20);
});