let rp = require('request-promise');
let iconv = require('iconv-lite');
let cheerio = require('cheerio')

let getter = async function () {
  let href = 'http://v.qq.com/cover/m/mknc9zpas6ry30i.html?vid=e0329rk9idq'
  let options = {
    url: href
  }
  let body = await rp(options)
  let $ = cheerio.load(body)
  if($('title').text().includes('正在跳转')){
    let url = href.replace(/\/prev\//ig, "/cover/").replace(/cover\/(\w)\//ig, "x/cover/")
    console.log(url);
    let options = {
      url: url
    }
    body = await rp(options)
  }
  console.log(body);
}

let crawler = async function () {
  console.log('start')
  await getter()
  console.log('end')
}

// crawler()