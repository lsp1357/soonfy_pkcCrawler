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
  let pos = data.indexOf('typeid:')
  let typeid = data.substring(pos + 7, data.indexOf(',', pos + 7)).replace(/ /g, '')
  let vtype = typeid === '1' ? '电影' : typeid === '2' ? '电视剧' : typeid === '10' ? '综艺' : '综艺'
  let type = $('div.breadcrumb').children('a').first().attr('title')
  let url = $('div.breadcrumb').children('a').last().attr('href')
  let pid = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.')).replace(/ /g, '')

  //时尚
  let furl = $('div.breadcrumb').children('a').eq(1).attr('href') || ''
  let fid = furl.substring(furl.lastIndexOf('/') + 1, furl.lastIndexOf('.')).replace(/ /g, '')
  let ftitle = $('div.breadcrumb').children('a').eq(1).attr('title') || ''
  let infoindex = data.indexOf('COVER_INFO')
  let nameindex = data.indexOf('"', infoindex)
  let lastindex = data.indexOf('"', nameindex + 1)
  let info = data.substring(nameindex + 1, lastindex).replace(/ /g, '')
  let title = $('.breadcrumb').children('a').last().attr('title') || info

  video.type = type
  video.pid = pid
  video.title = title
  video.fid = fid
  video.ftitle = ftitle
  video.url = url
  // console.log('腾讯')
  // console.log(video)
  return video
}

let mvCrawler = async function (pid, filmId) {
  // console.log('mv', pid, filmId);
  await timeout(1 * 1000);
  let requrl = 'http://data.video.qq.com/fcgi-bin/data?tid=70&appid=10001007&appkey=e075742beb866145&otype=json&idlist=' + pid;
  try {
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let reg = /QZOutputJson=(.+);/;
    let data = body.replace(reg, '$1');
    let playSum = JSON.parse(data).results[0].fields.allnumc;
    let site = '腾讯视频';
    let createdAt = new Date();
    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
    let _count = {
      _id,
      filmId,
      site,
      playSum,
      createdAt
    }
    // console.log(_count);
    await dbInserter(Count, _count);
    requrl = 'http://sns.video.qq.com/fcgi-bin/video_comment_id?otype=json&op=3&cid=' + pid;
    options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    body = await rp(options);
    data = body.replace(reg, '$1');
    let cid = JSON.parse(data).comment_id;
    requrl = 'http://coral.qq.com/article/' + cid + '/commentnum';
    options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    body = await rp(options);
    let commentSum = JSON.parse(body).data.commentnum;
    _count = await Count.findOne({_id: _id}).exec();
    if(_count !== null){
      _count.commentSum = commentSum;
      await _count.save();
    }
  } catch (error) {
    console.log(error);
  }
}

let tvCrawler = async function (pid, filmId) {
  // console.log('tv', pid, filmId);
  await timeout(1 * 1000);
  try {
    let requrl = 'http://data.video.qq.com/fcgi-bin/data?tid=70&appid=10001007&appkey=e075742beb866145&otype=json&idlist=' + pid;
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let reg = /QZOutputJson=(.+);/;
    let data = body.replace(reg, '$1');
    let playSum = JSON.parse(data).results[0].fields.allnumc;
    let site = '腾讯视频';
    let createdAt = new Date();
    let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
    let _count = {
      _id,
      filmId,
      site,
      playSum,
      createdAt
    }
    // console.log(_count);
    await dbInserter(Count, _count);
    requrl = 'http://s.video.qq.com/loadplaylist?type=6&plname=qq&otype=json&id=' + pid;
    options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    body = await rp(options);
    reg = /QZOutputJson=(.+);/;
    data = body.replace(reg, '$1');
    let tvlist = JSON.parse(data).video_play_list.playlist;
    let countId = _id
    let promises = tvlist.map(async (tv, index) => {
      try {
        await timeout(1 * 1000 * 5 * (index/100));
        let requrl = 'http://sns.video.qq.com/fcgi-bin/video_comment_id?otype=json&op=3&vid=' + tv.id;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let data = body.replace(reg, '$1');
        let cid = JSON.parse(data).comment_id;
        requrl = 'http://coral.qq.com/article/' + cid + '/commentnum';
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let comment = JSON.parse(body).data.commentnum;
        let name = tv.title
        let _id = countId + name;
        let _movie = {
          _id,
          filmId,
          name,
          site,
          comment,
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

let showCrawler = async function (pid, filmId) {
  // console.log('show', pid, filmId);
  await timeout(1 * 1000);
  try {
    let requrl = 'http://s.video.qq.com/loadplaylist?type=6&plname=qq&otype=json&id=' + pid;
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let reg = /QZOutputJson=(.+);/;
    let data = body.replace(reg, '$1');
    let years = JSON.parse(data).video_play_list.year;
    let showlist = []
    for(let year of years){
      let requrl = 'http://s.video.qq.com/loadplaylist?type=4&plname=qq&otype=json&id=' + pid + '&year=' + year;
      let options = {
        url: requrl,
        timeout: 1000 * 60 * 2
      }
      let body = await rp(options);
      let reg = /QZOutputJson=(.+);/;
      let data = body.replace(reg, '$1');
      let vlist = JSON.parse(data).video_play_list.playlist;
      showlist.concat(vlist);
    }
    let promises = showlist.map(async (show, index) => {
      try {
        await timeout(1 * 1000 * 5 * (index/100));
        let vid = show.id;
        let requrl = 'http://data.video.qq.com/fcgi-bin/data?tid=70&appid=10001007&appkey=e075742beb866145&otype=json&idlist=' + vid;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let reg = /QZOutputJson=(.+);/;
        let data = body.replace(reg, '$1');
        let playSum = JSON.parse(data).results[0].fields.column.c_column_view.c_allnumc;
        let site = '腾讯视频';
        let createdAt = new Date();
        let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId;
        let _count = {
          _id,
          filmId,
          site,
          playSum,
          createdAt
        }
        // console.log(_count);
        await dbInserter(Count, _count);
        requrl = 'http://sns.video.qq.com/fcgi-bin/video_comment_id?otype=json&op=3&cid=' + vid;
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        data = body.replace(reg, '$1');
        let cid = JSON.parse(data).comment_id;
        requrl = 'http://coral.qq.com/article/' + cid + '/commentnum';
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let comment = JSON.parse(body).data.commentnum;
        let name = show.title
        _id = _id + name;
        let _movie = {
          _id,
          filmId,
          name,
          site,
          comment,
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

let qq = {}
qq.parse = async function (obj) {
  try {
    let options = {
      url: obj.url,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let $ = cheerio.load(body)
    if($('title').text().includes('正在跳转')){
      let url = obj.url.replace(/\/prev\//ig, "/cover/").replace(/cover\/(\w)\//ig, "x/cover/")
      let options = {
        url: url,
        timeout: 1000 * 60 * 2
      }
      body = await rp(options)
    }
    let {title, pid, type} = parseVideo(body);
    if (title.indexOf('utf-8') === -1 && title.indexOf('zh-cn') === -1 && title.indexOf('Content-Type') === -1) {
      switch (type) {
        case '电影':
          await mvCrawler(pid, obj.filmId);
          break;
        case '电视剧':
        case '动漫':
          await tvCrawler(pid, obj.filmId);
          break;
        default:
          await showCrawler(pid, obj.filmId);
          break;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export {qq as QQ}