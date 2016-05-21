var token = '';
// 用来存储上一次提示对象
var _cache_ = {};

var serverRootdir = '';

var proxy = 'http://121.43.118.245:8001';

var accountServer = proxy + '/account/v1/users/get_token';

var nginx_server = 'http://10.252.173.92:8001/';

var web_dir = 'sunshine_web';

// var loginReqUrl = proxy + '/' + serverRootdir;  //发布地址 代理nginx
var loginReqUrl = 'http://121.43.118.245/mockjsdata/3/school';  //测试mockData

/***************************** login *********************************/
/*退出*/
$(function() {

  $('#logOut').click(function() {
      clearCookie();
      location.href = "../login.html";
  });

  //关闭提示后台错误
  $('.ui-backerror').on('click', '.close-error', function () { closeBackError(); });

  // 输入内容时关闭提示层
  $(document.activeElement).on('keydown', function () { closeBackError(); });

});

/*判断是否为空 空false 非空true*/
function isEmpty(value) {
  if (!value || value == null || value == "") {
    return false;
  }
  return true;
}

function getToken(username, password, token) {
  $.ajax({
    url: accountServer,
    dataType: 'json',
    type: 'post',
    data: {
      "username": username,
      "password": $.md5(password)
    },
    success: function(data) {
      token = data.token;
      document.cookie = "token="+token;

      serverRootdir = data.server_rootdir;
      document.cookie = "serverRootdir="+serverRootdir;

      loginReqUrl = proxy + '/' + serverRootdir;

      if(data.ret == 0) {
        var jump = "views/grade.html";
        $.ajax({
            url: loginReqUrl + '/v1/users/login',
            dataType: 'json',
            beforeSend: function(xhr) {
              xhr.setRequestHeader("X-ApiToken", token);
            },
            type: 'post',
            data: {
              source: 'web'
            },
            success: function(re) {
                if(re.ret == 0) {
                    console.log(re.ret);
                    location.href = jump;
                }else {
                  showError($(".username"), re.msg);
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
              if(XMLHttpRequest.status != "200" || textStatus != "OK"){
                showError($(".username"), '调用数据失败，请稍后再试');
              }
            }
        });

      }else {
        showError($(".username"), data.msg);
      }
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      if(XMLHttpRequest.status != "200" || textStatus != "OK"){
        showError($(".username"), '调用数据失败，请稍后再试');
      }
    }
  });
}

function showError(obj, text, callback) {
  var $layer = $('.ui-loginerr');
  $layer.show();
  $layer.find('p').text(text);
  obj.focus();
  if (_cache_.el !== obj) {
      $layer.pin({
          baseEl: obj,
          baseXY: [0, 0],
          selfXY: ['-205px', '100%+20']
      });
  }

  $layer.hide().fadeIn();
  _cache_.el = obj;

  // 回调方法
  callback && callback();
}

/*****************************login end*********************************/

function getUrlParam(name) {
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r!=null) return r[2]; return "";
}

function getCookie(cookie_name) {
    var allcookies = document.cookie;
    var cookie_pos = allcookies.indexOf(cookie_name);   //索引的长度

    if (cookie_pos != -1) {
        // 把cookie_pos放在值的开始，只要给值加1即可。
        cookie_pos += cookie_name.length + 1;      /******/
        var cookie_end = allcookies.indexOf(";", cookie_pos);
        if (cookie_end == -1) {
            cookie_end = allcookies.length;
        }
        var value = unescape(allcookies.substring(cookie_pos, cookie_end));
    }
    return value;
}

function clearCookie(){
    var keys=document.cookie.match(/[^ =;]+(?=\=)/g);
    if (keys) {
        for (var i =  keys.length; i--;)
        document.cookie=keys[i]+'=0;expires=' + new Date(0).toUTCString()
    }
}

function delCookie(name){//为了删除指定名称的cookie，可以将其过期时间设定为一个过去的时间
   var date = new Date();
   date.setTime(date.getTime() - 10000);
   document.cookie = name + "=a; expires=" + date.toGMTString();
}


function showBackError(errorMsg) {
  var $layerError = $('.ui-backerror');
  $layerError.show();
  $layerError.find('p').text(errorMsg);
  $layerError.hide().fadeIn();
}

function closeBackError() {
  var $layerError = $('.ui-backerror');
  $layerError.fadeOut();

}

