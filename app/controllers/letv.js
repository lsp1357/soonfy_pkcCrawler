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

var parseVideo = function (data) {
  var video = {}
  var $ = cheerio.load(data)
  var list_meta = $('meta')
  var pos = data.indexOf('pid:')
  video.pid = data.substring(pos + 5, data.indexOf(',', pos)).replace(/ /g, '')
  pos = data.indexOf('vid:')
  video.vid = data.substring(pos + 5, data.indexOf(',', pos)).replace(/ /g, '')
  pos = data.indexOf('cid:')
  video.cid = data.substring(pos + 5, data.indexOf(',', pos)).replace(/ /g, '')
  pos = data.indexOf('nowEpisodes:')
  video.length = data.substring(pos + 13, data.indexOf(',', pos) - 1).replace(/ /g, '')
  list_meta.each(function (index, _meta) {
    if ($(_meta).attr('name') === 'irAlbumName') {
      video.title = $(_meta).attr('content')
    }
    if ($(_meta).attr('name') === 'irCategory') {
      video.type = $(_meta).attr('content')
    }
  })
  // console.log('乐视')
  // console.log(video)
  return video
}

let mvCrawler = async function (pid, vid, filmId) {
  // console.log('mv', pid, vid, filmId);
  await timeout(1 * 1000);
  try {
    let requrl = 'http://v.stat.letv.com/vplay/queryMmsTotalPCount?pid=' + pid;
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let playSum = JSON.parse(body).plist_play_count;
    let commentSum = JSON.parse(body).pcomm_count;
    requrl = 'http://v.stat.letv.com/vplay/getIdsInfo?ids=' + vid;
    options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    body = await rp(options);
    let upSum = JSON.parse(body)[0].up;
    let downSum = JSON.parse(body)[0].down;
    let site = '乐视视频';
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
    console.log(_count);
    await dbInserter(Count, _count);
  } catch (error) {
    console.log(error);
  }
}

let tvCrawler = async function (pid, cid, length, filmId) {
  // console.log('tv', pid, cid, length, filmId);
  try {
    await timeout(1 * 1000);
    let i = 1
    let pages = []
    while(i < length){
      pages.push(i);
      i += 100;
    }
    let tvlist = []
    for(let page of pages){
      let requrl = 'http://api.letv.com/mms/out/album/videos?id=' + pid + '&cid=' + cid + '&platform=pc&page=' + page;
      let options = {
        url: requrl,
        timeout: 1000 * 60 * 2
      }
      let body = await rp(options);
      let vlist = JSON.parse(body).data;
      vlist.map(tv => {
        if(tv.key <= length){
          tvlist.push(tv);
        }
      })
    }
    for(let tv of tvlist){
      try {
        await timeout(1 * 1000);
        let requrl = 'http://v.stat.letv.com/vplay/queryMmsTotalPCount?pid=' + pid + '&vid=' + tv.vid;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let playSum = JSON.parse(body).plist_play_count;
        let commentSum = JSON.parse(body).pcomm_count;
        let site = '乐视视频';
        let createdAt = new Date();
        let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
        let _count = {
          _id,
          filmId,
          site,
          playSum,
          commentSum,
          createdAt
        }
        console.log(_count);
        await dbInserter(Count, _count);
        let name = tv.title;
        let up = JSON.parse(body).up;
        let down = JSON.parse(body).down;
        _id = _id + name;
        let _movie = {
          _id,
          filmId,
          site,
          name,
          up,
          down,
          createdAt
        }
        await dbInserter(Movie, _movie);
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

let showCrawler = async function (pid, cid, filmId) {
  // console.log('show', pid, cid, filmId);
  await timeout(1 * 1000);
  try {
    let requrl = 'http://api.letv.com/mms/out/album/videos?id=' + pid +'&cid=' + cid + '&platform=pc&relvideo=1';
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let showlist = [];
    let timeo = JSON.parse(body).data;
    for(let year of Object.keys(timeo)){
      for(let month of Object.keys(timeo[year])){
        let requrl = 'http://api.letv.com/mms/out/album/videos?id=' + pid + '&cid=' + cid + '&platform=pc&relvideo=1&year=' + year + '&month=' + month;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let vlist = JSON.parse(body).data[year][month];
        showlist = showlist.concat(vlist);
      }
    }
    for(let show of showlist){
      await timeout(1 * 1000);
      try {
        let requrl = 'http://v.stat.letv.com/vplay/queryMmsTotalPCount?pid=' + pid + '&vid=' + show.vid;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let playSum = JSON.parse(body).plist_play_count;
        let commentSum = JSON.parse(body).pcomm_count;
        let site = '乐视视频';
        let createdAt = new Date();
        let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
        let _count = {
          _id,
          filmId,
          site,
          playSum,
          commentSum,
          createdAt
        }
        console.log(_count);
        await dbInserter(Count, _count);
        let name = show.title;
        let up = JSON.parse(body).up;
        let down = JSON.parse(body).down;
        _id = _id + name;
        let _movie = {
          _id,
          filmId,
          site,
          name,
          up,
          down,
          createdAt
        }
        await dbInserter(Movie, _movie);
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

let letv = {}
letv.parse = async function (obj) {
  try {
    let options = {
      url: obj.url,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let {pid, vid, cid, type, length} = parseVideo(body);
    if (type) {
      switch (type) {
        case '电影':
          await mvCrawler(pid, vid, obj.filmId);
          break;
        case '电视剧':
        case '动漫':
          await tvCrawler(pid, cid, length, obj.filmId);
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

export {letv as Letv}