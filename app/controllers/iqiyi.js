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
  let pos = data.indexOf('sourceId:')
  let sid = data.substring(pos + 9, data.indexOf(',', pos)).replace(/ /g, '')
  pos = data.indexOf('albumId:')
  let aid = data.substring(pos + 8, data.indexOf(',', pos)).replace(/ /g, '')
  pos = data.indexOf('cid:')
  let cid = data.substring(pos + 4, data.indexOf(',', pos)).replace(/ /g, '')
  video.pid = sid == 0 ? aid : sid
  video.cid = cid
  list_meta.each(function (index, _meta) {
    if ($(_meta).attr('name') === 'irAlbumName') {
      video.title = $(_meta).attr('content')
    }
    if ($(_meta).attr('name') === 'irCategory') {
      video.type = $(_meta).attr('content')
    }
  })
  // console.log('爱奇艺')
  // console.log(video)
  return video
}

let mvCrawler = async function (pid, filmId) {
  // console.log('mv', pid, filmId);
  await timeout(1 * 1000);
  let requrl = 'http://mixer.video.iqiyi.com/jp/mixin/videos/' + pid
  try {
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let reg = /var\s+tvInfoJs=()/;
    let data = body.replace(reg, '$1');
    let {playCount: playSum, commentCount: commentSum, upCount: upSum, downCount: downSum} = JSON.parse(data);
    let site = '爱奇艺';
    let createdAt = new Date();
    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
    let _count = {
      _id,
      filmId,
      site,
      playSum,
      commentSum,
      upSum,
      downSum,
      createdAt
    }
    // console.log(_count);
    await dbInserter(Count, _count);
  } catch (error) {
    console.log(error);
  }
}

let tvCrawler = async function (pid, filmId) {
  // console.log('tv', pid, filmId);
  await timeout(1 * 1000);
  try {
    let requrl = 'http://cache.video.qiyi.com/jp/avlist/' + pid + '/';
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let reg = /var\s+tvInfoJs=()/;
    let data = body.replace(reg, '$1');
    let pagemax = JSON.parse(data).data.pgt;
    let i = 1;
    let pages = [];
    while (i <= pagemax) {
      pages.push(i);
      i++;
    }
    let tvlist = []
    for (let page of pages) {
      let requrl = 'http://cache.video.qiyi.com/jp/avlist/' + pid + '/' + page + '/';
      let options = {
        url: requrl,
        timeout: 1000 * 60 * 2
      }
      let body = await rp(options);
      let reg = /var\s+tvInfoJs=()/;
      let data = body.replace(reg, '$1');
      let vlist = JSON.parse(data).data.vlist
      tvlist = tvlist.concat(vlist);
    }
    let promises = tvlist.map(async (tv, index) => {
      try {
        await timeout(1 * 1000 * 5 * (index/100));
        let vid = tv.id;
        let requrl = 'http://mixer.video.iqiyi.com/jp/mixin/videos/' + vid;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let reg = /var\s+tvInfoJs=()/;
        let data = body.replace(reg, '$1');
        let {name, playCount: playSum, commentCount: comment, upCount: up, downCount: down} = JSON.parse(data);
        let site = '爱奇艺';
        let createdAt = new Date();
        let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
        let _count = {
          _id,
          filmId,
          playSum,
          site,
          createdAt,
        }
        // console.log(_count);
        await dbInserter(Count, _count);
        _id = _id + name;
        let _movie = {
          _id,
          filmId,
          name,
          site,
          comment,
          up,
          down,
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

let showCrawler = async function (pid, cid, filmId) {
  // console.log('show', pid, cid, filmId);
  await timeout(1 * 1000);
  try {
    let requrl = 'http://cache.video.qiyi.com/jp/sdlst/' + cid + '/' + pid + '/';
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let reg = /var\s+tvInfoJs=()/;
    let data = body.replace(reg, '$1');
    let yearo = JSON.parse(data).data;
    let showlist = []
    for (let year of Object.keys(yearo)) {
      let requrl = 'http://cache.video.qiyi.com/jp/sdvlst/' + cid + '/' + pid + '/' + year + '/';
      let options = {
        url: requrl,
        timeout: 1000 * 60 * 2
      }
      let body = await rp(options);
      let reg = /var\s+tvInfoJs=()/;
      let data = body.replace(reg, '$1');
      let vlist = JSON.parse(data).data;
      showlist = showlist.concat(vlist);
    }
    let promises = showlist.map(async (show, index) => {
      try {
        await timeout(1 * 1000 * 5 * (index/100));
        let requrl = 'http://mixer.video.iqiyi.com/jp/mixin/videos/' + show.tvId;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let reg = /var\s+tvInfoJs=()/;
        let data = body.replace(reg, '$1');
        let {name, playCount: play, commentCount: comment, upCount: up, downCount: down} = JSON.parse(data);
        let site = '爱奇艺';
        let createdAt = new Date();
        let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId + name;
        let _movie = {
          _id,
          filmId,
          name,
          site,
          play,
          comment,
          up,
          down,
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

let iqiyi = {}
iqiyi.parse = async function (obj) {
  try {
    let options = {
      url: obj.url,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let {title, pid, cid, type} = parseVideo(body);
    if (title) {
      switch (type) {
        case '电影':
          await mvCrawler(pid, obj.filmId);
          break;
        case '电视剧':
          await tvCrawler(pid, obj.filmId);
          break;
        default:
          await showCrawler(pid, cid, obj.filmId);
          break;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export {iqiyi as Iqiyi}