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

  let pos = data.indexOf('type: "')
  let vtype = data.substring(pos + 7, data.indexOf('",', pos + 7)).replace(/ /g, '')
  let type
  switch (vtype) {
    case 'movie':
      type = '电影'
      break
    case 'tv':
      type = '电视剧'
      break
    case 'show':
      type = '综艺'
      break
    default:
      type = vtype
  }

  pos = data.indexOf('cname: "')
  let title = data.substring(pos + 8, data.indexOf('"', pos + 8)).replace(/ /g, '')

  pos = data.indexOf('vid:')
  let vid = data.substring(pos + 5, data.indexOf(',', pos)).replace(/ /g, '')

  pos = data.indexOf('cid:')
  let cid = data.substring(pos + 5, data.indexOf(',', pos)).replace(/ /g, '')

  pos = data.indexOf('site: "')
  let site = data.substring(pos + 7, data.indexOf('",', pos + 7)).replace(/ /g, '')

  pos = data.indexOf('path:')
  let path = data.substring(pos + 6, data.indexOf(',', pos)).replace(/ /g, '')

  video.title = title
  video.type = type
  video.vid = vid
  video.cid = cid
  video.site = site
  video.path = path
  // console.log('芒果')
  // console.log(video)
  return video
}

let mvCrawler = async function (pid, filmId) {
  // console.log('mv', pid, filmId);
  await timeout(10 * 1000);
  try {
    let requrl = 'http://videocenter-2039197532.cn-north-1.elb.amazonaws.com.cn//dynamicinfo?vid=' + pid;
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let playSum = JSON.parse(body).data.all;
    let upSum = JSON.parse(body).data.like;
    let downSum = JSON.parse(body).data.unlike;
    requrl = 'http://comment.hunantv.com/video_comment/list/?subject_id=' + pid;
    options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    body = await rp(options);
    let reg = /null\((.+)\)/;
    let data = body.replace(reg, '$1');
    let commentSum = JSON.parse(data).total_number;
    let site = '芒果TV';
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

let tvCrawler = async function (vid, filmId) {
  // console.log('tv', vid, filmId);
  await timeout(10 * 1000);
  try {
    let requrl = 'http://v.api.mgtv.com/list/tvlist?video_id=' + vid;
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let pagemax = JSON.parse(body).data.total_page;
    let pages = [];
    let i = 1;
    while (i <= pagemax) {
      pages.push(i);
      i++;
    }
    let tvlist = [];
    for(let page of pages){
      let requrl = 'http://v.api.mgtv.com/list/tvlist?video_id=' + vid + '&size=25&page=' + page;
      let options = {
        url: requrl,
        timeout: 1000 * 60 * 2
      }
      let body = await rp(options);
      let vlist = JSON.parse(body).data.list;
      tvlist = tvlist.concat(vlist);
    }
    for(let tv of tvlist){
      await timeout(10 * 1000);
      try {
        let requrl = 'http://videocenter-2039197532.cn-north-1.elb.amazonaws.com.cn//dynamicinfo?vid=' + tv.video_id;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let play = JSON.parse(body).data.all;
        let up = JSON.parse(body).data.like;
        let down = JSON.parse(body).data.unlike;
        requrl = 'http://comment.hunantv.com/video_comment/list/?subject_id=' + tv.video_id;
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let reg = /null\((.+)\)/;
        let data = body.replace(reg, '$1');
        let comment = JSON.parse(data).total_number;
        let site = '芒果TV';
        let createdAt = new Date();
        let name = tv.t2;
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
    }
  } catch (error) {
    console.log(error);
  }
}

let showCrawler = async function (vcid, vsite, vpath, filmId) {
  // console.log('show', vcid, vsite, vpath, filmId);
  await timeout(10 * 1000);
  try {
    let requrl = 'http://www.hunantv.com/' + vsite + '/' + vpath + '/' + vcid + '/s/json.year.js';
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let reg = /.+(\[.+\])\)/;
    let data = body.replace(reg, '$1');
    let years = JSON.parse(data);
    let showlist = [];
    for(let year of years){
      let requrl = 'http://www.hunantv.com/' + vsite + '/' + vpath + '/' + vcid + '/s/json.' + year + '.js';
      let options = {
        url: requrl,
        timeout: 1000 * 60 * 2
      }
      let body = await rp(options);
      let reg = /[^\[]+(\[.+\])\)/;
      let data = body.replace(reg, '$1');
      let vlist = JSON.parse(data);
      showlist = showlist.concat(vlist);
    }
    for(let show of showlist){
      await timeout(10 * 1000);
      try {
        let requrl = 'http://videocenter-2039197532.cn-north-1.elb.amazonaws.com.cn//dynamicinfo?vid=' + show.id;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let play = JSON.parse(body).data.all;
        let up = JSON.parse(body).data.like;
        let down = JSON.parse(body).data.unlike;
        requrl = 'http://comment.hunantv.com/video_comment/list/?subject_id=' + show.id;
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let reg = /[^\[]+(\[.+\])\)/;
        let data = body.replace(reg, '$1');
        let comment = JSON.parse(data).total_number;
        let name = show.stitle + show.title
        let site = '芒果TV';
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
          down
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

let mgtv = {}
mgtv.parse = async function (obj) {
  try {
    let options = {
      url: obj.url,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let {vid, cid, site, path, type} = parseVideo(body);
    if (!site.includes('湖南卫视')) {
      switch (type) {
        case '电影':
          await mvCrawler(vid, obj.filmId);
          break;
        case '电视剧':
          await tvCrawler(vid, obj.filmId);
          break;
        default:
          await showCrawler(cid, site, path, obj.filmId);
          break;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export {mgtv as Mgtv}