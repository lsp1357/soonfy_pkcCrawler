let rp = require('request-promise');
let moment = require('moment');
let cheerio = require('cheerio');
let iconv = require('iconv-lite');

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
  let pos = data.indexOf('playlistId="')
  let pid = data.substring(pos + 12, data.indexOf('";', pos + 12)).replace(/ /g, '')
  pos = data.indexOf('vid="')
  let vid = data.substring(pos + 5, data.indexOf('";', pos + 5)).replace(/ /g, '')
  pos = data.indexOf('tvid')
  let tvid = data.substring(data.indexOf('"', pos + 5) + 1, data.indexOf('";', pos + 6)).replace(/ /g, '')
  pos = data.indexOf('cid="')
  let cid = data.substring(pos + 5, data.indexOf('";', pos + 5)).replace(/ /g, '')
  let title
  let type
  list_meta.each(function (index, _meta) {
    if ($(_meta).attr('name') === 'album') {
      title = $(_meta).attr('content')
    }
    if ($(_meta).attr('name') === 'category') {
      type = $(_meta).attr('content')
    }
  })

  video.pid = pid
  video.vid = vid
  video.tvid = tvid
  video.cid = cid
  video.title = title
  video.type = type
  // console.log('搜狐')
  // console.log(video)
  return video
}


let mvCrawler = async function (pid, vid, tvid, filmId, url) {
  // console.log('mv', pid, vid, tvid, filmId, url);
  await timeout(1 * 1000);
  try {
    let requrl = 'http://count.vrs.sohu.com/count/queryext.action?plids=' + pid + '&vids=' + vid;
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let pos = body.indexOf('total":');
    let playSum = body.substring(pos + 7, body.indexOf(',', pos)).replace(/ /g, '');
    requrl = 'http://changyan.sohu.com/api/2/topic/load?client_id=cyqyBluaj&topic_url=' + url + '&topic_source_id=' + vid;
    options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    body = await rp(options);
    let commentSum = JSON.parse(body).cmt_sum;
    requrl = 'http://score.my.tv.sohu.com/digg/get.do?type=1&tvid=' + tvid;
    options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    body = await rp(options);
    let data = body.substring(body.indexOf('{'), body.lastIndexOf('}') + 1);
    let upSum = JSON.parse(data).upCount;
    let downSum = JSON.parse(data).downCount;
    let site = '搜狐视频';
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

let tvCrawler = async function (pid, filmId) {
  // console.log('tv', pid, filmId);
  await timeout(1 * 1000);
  try {
    let requrl = 'http://pl.hd.sohu.com/videolist?playlistid=' + pid;
    let options = {
      url: requrl,
      encoding: null,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let data = iconv.decode(body, 'gbk');
    let tvlist = JSON.parse(data).videos;
    for(let tv of tvlist){
      try {
        await timeout(1 * 1000);
        let requrl = 'http://count.vrs.sohu.com/count/queryext.action?plids=' + pid + '&vids=' + tv.vid;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let pos = body.indexOf('total":');
        let playSum = body.substring(pos + 7, body.indexOf(',', pos)).replace(/ /g, '');
        requrl = 'http://changyan.sohu.com/api/2/topic/load?client_id=cyqyBluaj&topic_url=' + tv.pageUrl + '&topic_source_id=' + tv.vid;
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let commentSum = JSON.parse(body).cmt_sum;
        let site = '搜狐视频';
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
        requrl = 'http://score.my.tv.sohu.com/digg/get.do?type=2&tvid=' + tv.tvId;
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let data = body.substring(body.indexOf('{'), body.lastIndexOf('}') + 1);
        let up = JSON.parse(data).upCount;
        let down = JSON.parse(data).downCount;
        let name = tv.name;
        _id = _id + name;
        let _movie = {
          _id,
          filmId,
          name,
          site,
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
    let requrl = 'http://pl.hd.sohu.com/videolist?playlistid=' + pid;
    let options = {
      url: requrl,
      encoding: null,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let data = iconv.decode(body, 'gbk');
    let length = JSON.parse(data).size;
    let pages = [];
    let i = 1;
    while(i < length){
      pages.push(i);
      i += 100;
    }
    let showlist = []
    for(let page of pages){
      let requrl = 'http://pl.hd.sohu.com/videolist?playlistid=' + pid + '&pagenum=' + page + '&pagesize=100';
      let options = {
        url: requrl,
        encoding: null,
        timeout: 1000 * 60 * 2
      }
      let body = await rp(options);
      let data = iconv.decode(body, 'gbk');
      let vlist = JSON.parse(data).videos;
      showlist = showlist.concat(vlist);
    }
    for(let show of showlist){
      try {
        await timeout(1 * 1000);
        let requrl = 'http://count.vrs.sohu.com/count/queryext.action?plids=' + pid + '&vids=' + show.vid;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let pos = body.indexOf('total":');
        let playSum = body.substring(pos + 7, body.indexOf(',', pos)).replace(/ /g, '');
        requrl = 'http://changyan.sohu.com/api/2/topic/load?client_id=cyqyBluaj&topic_url=' + show.pageUrl + '&topic_source_id=' + show.vid;
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let commentSum = JSON.parse(body).cmt_sum;
        let site = '搜狐视频';
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
        requrl = 'http://score.my.tv.sohu.com/digg/get.do?type=' + cid + '&tvid=' + show.tvId;
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let data = body.substring(body.indexOf('{'), body.lastIndexOf('}') + 1);
        let up = JSON.parse(data).upCount;
        let down = JSON.parse(data).downCount;
        let name = show.name;
        _id = _id + name;
        let _movie = {
          _id,
          filmId,
          name,
          site,
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

let sohu = {}
sohu.parse = async function (obj) {
  try {
    let options = {
      url: obj.url,
      encoding: null
    }
    let body = await rp(options);
    let data = iconv.decode(body, 'gbk');
    let {pid, vid, tvid, cid, type} = parseVideo(data);
    if (type) {
      switch (type) {
        case '电影':
          await mvCrawler(pid, vid, tvid, obj.filmId, obj.url);
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

export {sohu as Sohu}