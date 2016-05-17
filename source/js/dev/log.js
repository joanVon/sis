/*logs*/
var oTable;
var list;
var userInfo;
var token = getCookie("token");
if(token == '' || token == undefined) {
  location.href = "../login.html";
}
var serverRootdir = getCookie("serverRootdir");
var urlArr = window.location.href.split('/');
// var rootDir = getUrlParam('rootdir');
// console.log(urlArr[3]);

// var rootReqUrl = proxy + '/' + serverRootdir;
var rootReqUrl = 'http://121.43.118.245/mockjsdata/3/school'; //测试mockData

$(function() {
  $('.link.item-log').addClass('current');

  initTable();
  oTable = initTable();
 });

/**
* 表格初始化
* @returns {*|jQuery}
*/
var logListUrl = rootReqUrl +'/v1/logs/index';
function initTable() {
  var table = $('#logsTable').DataTable({
    ajax: {
      "url": logListUrl,
      "beforeSend": function(xhr) {
        xhr.setRequestHeader("X-ApiToken", token);
      },
      "type": "get",
      "dataSrc": function ( json ) {
        console.log('logs:'+json.operation_logs);
        if(json.ret != 0){
          showBackError(json.msg);
        }else{
          return json.operation_logs;
        }
      }
    },
    columns: [
        { "data": "operation", "title": "操作事项"},
        { "data": "result", "title": "结果"},
        { "data": "created", "title": "创建时间"},
        { "data": "modified", "title": "更新时间"},
    ],
    ordering: false,
    retrieve: true,
    destroy: true,
    lengthChange: false,
    searching: false,
    language:{
      'url': '../config/zh_CN.json'
    }

  });

  return table;
}
