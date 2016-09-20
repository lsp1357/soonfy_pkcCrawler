# api

## 爱奇艺

#### 电影

  输入剧目pid  
  'http://mixer.video.iqiyi.com/jp/mixin/videos/' + pid  
  输出剧目播放评论数据

#### 电视剧
  1.
  输入剧目pid  
  'http://cache.video.qiyi.com/jp/avlist/' + pid + '/'  
  输出剧目最大页数  
  2.
  遍历页数  
  'http://cache.video.qiyi.com/jp/avlist/' + pid + '/' + page + '/'  
  输出剧集列表  
  3.
  遍历剧集vid  
  'http://mixer.video.iqiyi.com/jp/mixin/videos/' + vid  
  输出剧目播放，剧集评论赞踩  

#### 其它
  1.
  输入剧目频道cid，pid  
  'http://cache.video.qiyi.com/jp/sdlst/' + cid + '/' + pid + '/'  
  输出年份列表  
  2.
  遍历年份year  
  'http://cache.video.qiyi.com/jp/sdvlst/' + cid + '/' + pid + '/' + year + '/'  
  输出剧集列表  
  3.
  遍历剧集vid  
  'http://mixer.video.iqiyi.com/jp/mixin/videos/' + vid  
  输出剧集播放评论赞踩  

## 腾讯视频

#### 电影
  1.
  输入剧目pid  
  'http://data.video.qq.com/fcgi-bin/data?tid=70&appid=10001007&appkey=e075742beb866145&otype=json&idlist=' + pid  
  输出剧目播放  
  2.
  输入剧目pid  
  'http://sns.video.qq.com/fcgi-bin/video_comment_id?otype=json&op=3&cid=' + pid  
  输出评论cid  
  3.
  输入评论cid  
  'http://coral.qq.com/article/' + cid + '/commentnum'  
  输出剧目评论  

#### 电视剧
  1.
  输入剧目pid  
  'http://data.video.qq.com/fcgi-bin/data?tid=70&appid=10001007&appkey=e075742beb866145&otype=json&idlist=' + pid  
  输出剧目播放  
  2.
  输入剧目pid  
  'http://s.video.qq.com/loadplaylist?type=6&plname=qq&otype=json&id=' + pid  
  输出剧集列表  
  3.
  遍历剧集列表  
  'http://sns.video.qq.com/fcgi-bin/video_comment_id?otype=json&op=3&vid=' + vid  
  输出剧集评论cid  
  4.
  输入剧集评论cid  
  'http://coral.qq.com/article/' + cid + '/commentnum'  
  输出剧集评论  

#### 其它
  1.
  输入剧目pid  
  'http://s.video.qq.com/loadplaylist?type=6&plname=qq&otype=json&id=' + pid  
  输出年份列表  
  2.
  遍历年份year  
  'http://s.video.qq.com/loadplaylist?type=4&plname=qq&otype=json&id=' + pid + '&year=' + year  
  输出剧集列表  
  3.
  遍历剧集列表  
  'http://data.video.qq.com/fcgi-bin/data?tid=70&appid=10001007&appkey=e075742beb866145&otype=json&idlist=' + vid  
  输出剧目播放  
  'http://sns.video.qq.com/fcgi-bin/video_comment_id?otype=json&op=3&cid=' + vid  
  输出剧集评论cid  
  4.
  输入剧集评论cid  
  'http://coral.qq.com/article/' + cid + '/commentnum'  
  输出剧集评论  

## 乐视视频

#### 电影
  1.
  输入剧目pid  
  'http://v.stat.letv.com/vplay/queryMmsTotalPCount?pid=' + pid  
  输出剧目播放评论  
  2.
  输入剧目vid  
  'http://v.stat.letv.com/vplay/getIdsInfo?ids=' + vid  
  输出剧目赞踩  

#### 电视剧
  1.
  根据剧集数目确定页数，100集1页  
  2.
  输入剧目pic，cid，遍历页数  
  'http://api.letv.com/mms/out/album/videos?id=' + pid + '&cid=' + cid + '&platform=pc&page=' + page  
  输出剧集列表  
  3.
  遍历剧集列表  
  'http://v.stat.letv.com/vplay/queryMmsTotalPCount?pid=' + pid + '&vid=' + vid  
  输出剧目播放评论，剧集赞踩  

#### 其它
  1.
  输入剧目pid，cid  
  'http://api.letv.com/mms/out/album/videos?id=' + pid +'&cid=' + cid + '&platform=pc&relvideo=1'  
  输出年份列表  
  2.
  遍历年份列表  
  'http://api.letv.com/mms/out/album/videos?id=' + pid + '&cid=' + cid + '&platform=pc&relvideo=1&year=' + year + '&month=' + month  
  输出剧集列表  
  3.
  遍历剧集列表  
  'http://v.stat.letv.com/vplay/queryMmsTotalPCount?pid=' + pid + '&vid=' + vid  
  输出剧目播放评论，剧集赞踩  

## 搜狐视频

#### 电影
  1.
  输入剧目pid，vid  
  'http://count.vrs.sohu.com/count/queryext.action?plids=' + pid + '&vids=' + vid  
  输出剧目播放  
  2.
  输入剧集url，vid  
  'http://changyan.sohu.com/api/2/topic/load?client_id=cyqyBluaj&topic_url=' + url + '&topic_source_id=' + vid  
  输出剧目评论  
  3.
  输入剧集tvid  
  'http://score.my.tv.sohu.com/digg/get.do?type=1&tvid=' + tvid  
  输出剧集赞踩  

#### 电视剧
  1.
  输入剧目pid  
  'http://pl.hd.sohu.com/videolist?playlistid=' + pid  
  输出剧集列表  
  2.
  遍历剧集列表  
  'http://count.vrs.sohu.com/count/queryext.action?plids=' + pid + '&vids=' + vid  
  输出剧目播放  
  3.
  输入剧集url，vid  
  'http://changyan.sohu.com/api/2/topic/load?client_id=cyqyBluaj&topic_url=' + url + '&topic_source_id=' + vid  
  输出剧目评论  
  4.
  输入剧集tvid  
  'http://score.my.tv.sohu.com/digg/get.do?type=2&tvid=' + tvid  
  输出剧集赞踩  

#### 其它
  1.
  输入剧目pid  
  'http://pl.hd.sohu.com/videolist?playlistid=' + pid  
  输出剧集数目  
  2.
  根据剧集数目计算剧目页数，100集1页  
  3.
  遍历剧目页数  
  'http://pl.hd.sohu.com/videolist?playlistid=' + pid + '&pagenum=' + page + '&pagesize=100'  
  输出剧集列表  
  4.
  遍历剧集列表  
  'http://count.vrs.sohu.com/count/queryext.action?plids=' + pid + '&vids=' + vid  
  输出剧目播放  
  5.
  输入剧集url，vid  
  'http://changyan.sohu.com/api/2/topic/load?client_id=cyqyBluaj&topic_url=' + url + '&topic_source_id=' + vid  
  输出剧目评论  
  6.
  输入频道cid，tvid  
  'http://score.my.tv.sohu.com/digg/get.do?type=' + cid + '&tvid=' + tvid  
  输出剧集赞踩  

## 优酷

#### 电影
  1.
  输入剧目vid  
  'http://v.youku.com/action/getVideoPlayInfo?beta&vid=' + vid + '&param%5B%5D=updown'  
  输出剧目播放赞踩  
  2.
  输入剧目vid  
  'http://comments.youku.com/comments/~ajax/getStatus.html?__ap=%7B%22videoid%22%3A%22' + vid + '%22%7D'  
  输出剧目评论  

#### 其它
  1.
  从剧目详情页提取剧集列表
  2.
  遍历剧集列表  
  'http://v.youku.com/action/getVideoPlayInfo?beta&vid=' + vid + '&param%5B%5D=updown'  
  输出剧集播放赞踩
  3.
  输入剧集vid
  'http://comments.youku.com/comments/~ajax/getStatus.html?__ap=%7B%22videoid%22%3A%22' + vid + '%22%7D'
  输出剧集评论

## 土豆网

#### 电影

  输入剧目pid  
  'http://www.tudou.com/crp/itemSum.action?uabcdefg=0&iabcdefg=' + pid  
  输出剧目播放评论赞  

#### 其它
  1.
  输入剧目pid  
  'http://www.tudou.com/tvp/getMultiTvcCodeByAreaCode.action?type=3&app=4&codes=' + pid  
  输出剧集列表  
  2.
  遍历剧集列表  
  'http://www.tudou.com/crp/itemSum.action?uabcdefg=0&iabcdefg=' + vid  
  输出剧集播放评论赞  

## 芒果TV

#### 电影
  1.
  输入剧目pid  
  'http://videocenter-2039197532.cn-north-1.elb.amazonaws.com.cn//dynamicinfo?vid=' + pid  
  输出剧目播放赞踩  
  2.
  输入剧目pid  
  'http://comment.hunantv.com/video_comment/list/?subject_id=' + pid  
  输出剧目评论  

#### 电视剧
  1.
  输入剧目pid  
  'http://v.api.mgtv.com/list/tvlist?video_id=' + pid  
  输出最大页数  
  2.
  遍历页数  
  'http://v.api.mgtv.com/list/tvlist?video_id=' + vid + '&size=25&page=' + page  
  输出剧集列表  
  3.
  遍历剧集列表  
  'http://videocenter-2039197532.cn-north-1.elb.amazonaws.com.cn//dynamicinfo?vid=' + vid  
  输出剧集播放赞踩  
  4.
  输入剧集vid  
  'http://comment.hunantv.com/video_comment/list/?subject_id=' + vid  
  输出剧集评论  

#### 其它
  1.
  输入vsite，vpath，vcid  
  'http://www.hunantv.com/' + vsite + '/' + vpath + '/' + vcid + '/s/json.year.js'  
  输出年份列表  
  2.
  遍历年份列表  
  'http://www.hunantv.com/' + vsite + '/' + vpath + '/' + vcid + '/s/json.' + year + '.js'  
  输出剧集列表  
  3.
  遍历剧集列表  
  'http://videocenter-2039197532.cn-north-1.elb.amazonaws.com.cn//dynamicinfo?vid=' + vid  
  输出剧集播放赞踩  
  4.
  输入剧集vid  
  'http://comment.hunantv.com/video_comment/list/?subject_id=' + vid  
  输出剧集评论  