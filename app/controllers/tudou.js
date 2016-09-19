let rp = require('request-promise');
let moment = require('moment');
let cheerio = require('cheerio');

import {Movie} from '../models/movie';
import {Count} from '../models/count';

let dbInserter = async function (DB, obj) {
  try {
    let data = await DB.findOne({ _id: obj._id }).exec()
    if (data === null) {
      let _db = new DB(obj)
      await _db.save()
    } else {
      // console.log(obj._id, ' id exits.');
    }
  } catch (error) {
    console.log(error)
  }
}

let timeout = async function (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  })
}

let parseVideo = function (data) {
  let video = {}
  let $ = cheerio.load(data)
  let list_meta = $('meta')
  let type
  let title
  let pos = data.indexOf('iid: ')
  let pid = data.substring(pos + 5, data.indexOf('\r\n', pos + 5)).replace(/ /g, '')
  pos = data.indexOf('icode: \'')
  let vid = data.substring(pos + 8, data.indexOf('\'', pos + 8)).replace(/ /g, '')
  list_meta.each(function (index, _meta) {
    if ($(_meta).attr('name') === 'irAlbumName') {
      title = $(_meta).attr('content')
    }
    if ($(_meta).attr('name') === 'irCategory') {
      type = $(_meta).attr('content')
    }
  })
  video.pid = pid
  video.type = type
  video.title = title
  video.vid = vid
  // console.log('土豆')
  // console.log(video)
  return video
}

let mvCrawler = async function (pid, filmId) {
  // console.log('mv', pid, filmId);
  await timeout(10 * 1000);
  try {
    let requrl = 'http://www.tudou.com/crp/itemSum.action?uabcdefg=0&iabcdefg=' + pid;
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let playSum = JSON.parse(body).playNum;
    let commentSum = JSON.parse(body).commentNum;
    let upSum = JSON.parse(body).digNum;
    let site = '土豆网';
    let createdAt = new Date();
    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
    let _count = {
      _id,
      filmId,
      site,
      playSum,
      commentSum,
      upSum,
      createdAt
    }
    // console.log(_count);
    await dbInserter(Count, _count);
  } catch (error) {
    console.log(error);
  }
}

let showCrawler = async function (filmId, url) {
  // console.log('show', filmId, url);
  await timeout(10 * 1000);
  try {
    let options = {
      url: url,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let fpos = url.indexOf('albumplay/') + 10
    let lpos = url.indexOf('/', url.indexOf('albumplay/') + 10)
    let pid
    if (lpos > fpos) {
      pid = url.substring(fpos, lpos)
    } else {
      pid = url.substring(fpos, url.indexOf('.', url.indexOf('albumplay/') + 10))
    }
    let requrl = 'http://www.tudou.com/tvp/getMultiTvcCodeByAreaCode.action?type=3&app=4&codes=' + pid;
    options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    body = await rp(options);
    let showlist = JSON.parse(body).message;
    let promises = showlist.map(async (show, index) => {
      try {
        await timeout(1 * 1000 * 5 * (index/20));
        let requrl = 'http://www.tudou.com/crp/itemSum.action?uabcdefg=0&iabcdefg=' + show.iid;
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let play = JSON.parse(body).playNum;
        let comment = JSON.parse(body).commentNum;
        let up = JSON.parse(body).digNum;
        let site = '土豆网';
        let createdAt = new Date();
        let name = show.title;
        let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId + name;
        let _movie = {
          _id,
          filmId,
          site,
          play,
          comment,
          up,
          createdAt
        }
        await dbInserter(Movie, _movie);
      } catch (error) {
        console.log(error);
      }
    })
    return Promise.all(promises);
  } catch (error) {
    console.log(error);
  }
}

let tudou = {}
tudou.parse = async function (obj) {
  try {
    let options = {
      url: obj.url,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let {pid, type} = parseVideo(body);
    if (type) {
      switch (type) {
        case '电影':
          await mvCrawler(pid, obj.filmId);
          break;
        default:
          await showCrawler(obj.filmId, obj.url);
          break;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export {tudou as Tudou}