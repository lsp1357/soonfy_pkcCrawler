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
  let pos = data.indexOf('videoId = \'')
  let vid = data.substring(pos + 11, data.indexOf('\';', pos + 11)).replace(/ /g, '')
  list_meta.each(function (index, _meta) {
    if ($(_meta).attr('name') === 'irAlbumName') {
      title = $(_meta).attr('content')
    }
    if ($(_meta).attr('name') === 'irCategory') {
      type = $(_meta).attr('content')
    }
  })
  pos = data.indexOf('let showid_en=\"')
  let requrl = 'http://www.youku.com/show_page/id_z' + data.substring(pos + 15, data.indexOf('\";', pos + 15)) + '.html'
  let url = $('h1').children('a').attr('href') || requrl

  video.type = type
  video.title = title
  video.vid = vid
  video.curl = url
  // console.log('优酷')
  // console.log(video)
  return video
}

var parseSectionData = function (data) {
  var $ = cheerio.load(data)
  var list_item = $('ul')
  var list_data = []
  list_item.each(function () {
    var tempObj = {}
    tempObj.url = $(this).children('li').children('a').attr('href')
    tempObj.name = $(this).children('li').children('a').attr('title')
    if (tempObj.url) {
      list_data.push(tempObj)
    }
  })
  return list_data
}


let mvCrawler = async function (vid, filmId, url) {
  // console.log('mv', vid, filmId, url);
  await timeout(10 * 1000);
  try {
    let requrl = 'http://v.youku.com/QVideo/~ajax/getVideoPlayInfo?type=vv&id=';
    let options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let playSum = JSON.parse(body).vv;
    requrl = 'http://comments.youku.com/comments/~ajax/getStatus.html?__ap=%7B%22videoid%22%3A%22' + vid + '%22%7D';
    options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    body = await rp(options);
    let commentSum = JSON.parse(body).total;
    requrl = 'http://v.youku.com/action/getVideoPlayInfo?beta&vid=' + vid + '&param%5B%5D=updown';
    options = {
      url: requrl,
      timeout: 1000 * 60 * 2
    }
    body = await rp(options);
    let upSum = parseInt(JSON.parse(body).data.updown.up.replace(/,/g, ''));
    let downSum = parseInt(JSON.parse(body).data.updown.down.replace(/,/g, ''));
    let site = '优酷';
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

let showCrawler = async function (url, filmId) {
  // console.log('show', url, filmId);
  await timeout(10 * 1000);
  try {
    let options = {
      url,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let $ = cheerio.load(body)
    let showlist = [];
    if ($('.pgm-list').length > 0) {
      let pid = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
      let list_li = $('.pgm-list').find('li');
      let list_section = [];
      list_li.each(function (index, _li) {
        list_section.push($(_li).attr('data'));
      })
      for (let section of list_section) {
        let requrl = 'http://www.youku.com/show_episode/' + pid + '.html?dt=json&divid=' + section;
        let options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let vlist = parseSectionData(body)
        showlist = showlist.concat(vlist);
      }
    } else {
      let list_li = $('#episode_wrap').find('li')
      list_li.each(function (index, _li) {
        let tempObj = {}
        tempObj.name = $(_li).children('a').attr('title')
        tempObj.url = $(_li).children('a').attr('href')
        if (tempObj.url) {
          showlist.push(tempObj)
        }
      })
    }
    for(let show of showlist){
      try {
        await timeout(10 * 1000);
        let options = {
          url: show.url,
          timeout: 1000 * 60 * 2
        }
        let body = await rp(options);
        let pos = body.indexOf('videoId = \'')
        let vid = body.substring(pos + 11, body.indexOf('\';', pos + 11)).replace(/ /g, '')
        let requrl = 'http://v.youku.com/QVideo/~ajax/getVideoPlayInfo?type=vv&id=' + vid;
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let play = JSON.parse(body).vv;
        requrl = 'http://comments.youku.com/comments/~ajax/getStatus.html?__ap=%7B%22videoid%22%3A%22' + vid + '%22%7D';
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let comment = JSON.parse(body).total;
        requrl = 'http://v.youku.com/action/getVideoPlayInfo?beta&vid=' + vid + '&param%5B%5D=updown';
        options = {
          url: requrl,
          timeout: 1000 * 60 * 2
        }
        body = await rp(options);
        let up = parseInt(JSON.parse(body).data.updown.up.replace(/,/g, ''));
        let down = parseInt(JSON.parse(body).data.updown.down.replace(/,/g, ''));
        let name = show.name;
        let site = '优酷';
        let createdAt = new Date();
        let _id = site + moment(createdAt).format('YYYY-MM-DD') + filmId + name;
        let _movie = {
          _id,
          filmId,
          site,
          name,
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

let youku = {}
youku.parse = async function (obj) {
  try {
    let options = {
      url: obj.url,
      timeout: 1000 * 60 * 2
    }
    let body = await rp(options);
    let {vid, curl, type} = parseVideo(body);
    if (type) {
      switch (type) {
        case '电影':
          await mvCrawler(vid, obj.filmId, obj.url);
          break;
        default:
          await showCrawler(curl, obj.filmId);
          break;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export {youku as Youku}