let rp = require('request-promise');
let iconv = require('iconv-lite');

let getter = async function () {
  let options = {
    url: 'http://pl.hd.sohu.com/videolist?playlistid=1001374&pagenum=1&pagesize=100',
    encoding: null
  }
  let body = await rp(options)
  console.log(body);
  console.log(iconv.decode(body, 'gbk'));
}

let crawler = async function () {
  console.log(1)
  await getter()
  console.log(2)
}

// crawler()