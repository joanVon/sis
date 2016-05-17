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
  $('.link.item-grade').addClass('current');

  initTable();
  oTable = initTable();
 });

/**
* 表格初始化
* @returns {*|jQuery}
*/
var gradeListUrl = rootReqUrl +'/v1/grades/view_more';
function initTable() {
  var table = $('#gradesTable').DataTable({
    ajax: {
      "url": gradeListUrl,
      "beforeSend": function(xhr) {
        xhr.setRequestHeader("X-ApiToken", token);
      },
      "type": "get",
      "dataSrc": function ( json ) {
        console.log('grades:'+json.grades);
        if(json.ret != 0){
          showBackError(json.msg);
        }else{
          return json.grades;
        }
      }
    },
    columns: [
        { "data": "school_year", "title": "学年"},
        { "data": "student_number", "title": "学生数"},
        { "data": "class_number", "title": "班级数",
          "fnCreatedCell": function (nTd, sData, oData) {
              $(nTd).html(sData+"&nbsp;<a href='javascript:void(0);' onclick='viewClass(\"" + oData.id + "\",\"" + oData.school_year + "\")' >管理</a>");
          }
        },
        { "data": "created", "title": "创建时间" },
        { "data": "modified", "title": "更新时间" },
        {
          "data": "id", "title": "操作",
          "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
            $(nTd).html("<a href='javascript:void(0);' onclick='inputPage(\"" + sData + "\",\"" + oData.school_year + "\")'>导入学生</a>&nbsp;" +

            "<a class='del' href='javascript:void(0);' onclick='_delSingle(\"" + sData + "\")'>删除</a>&nbsp;");
          }
        }
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

/*上传*/
function inputPage(id, school_year) {
  location.href = 'input.html?gradeID='+id+'&schoolYear='+school_year;
}

/**
  * 添加学年
  */
  var addSchoolYearUrl = rootReqUrl + '/v1/grades/add';
$("#addGrade").click(function() {
  var schDialog = new Dialog(null, {
    title: '新增年级',
    content: addWin,
    width: '600',
    hasBtn: true,
    // needDestroy: true,
    btnText: ['确定','取消'],
    btnRole: ['confirm','cancel'],
    confirm: function () {
      var school_year = $('#schoolYear').val();
      var class_number = $('#classNumber').val();

      if (!isEmpty(school_year)) {
        $('#schoolYear').css('border-color','#f42a2a');
        return school_year;
      }
      if (!isEmpty(class_number)) {
        $('#classNumber').css('border-color','#f42a2a');
        return class_number;
      }

      $.ajax({
        url: addSchoolYearUrl,
        beforeSend: function(xhr) {
          xhr.setRequestHeader("X-ApiToken", token);
        },
        dataType: 'json',
        type: 'post',
        data: {
          school_year : school_year,
          class_number : class_number
        },
        success: function(result) {
            if(result.ret == 0) {
                schDialog.destroy();
                oTable.ajax.reload();
            }else {
              $('.error-content').html(result.msg);
              return false;
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          if(XMLHttpRequest.status != "200" || textStatus != "OK"){
            showBackError('调用数据失败，请稍后再试');
          }
        }
      });
    }
  });
});

/*查看班级列表-跳转 class.html*/
function viewClass(id, school_year) {
  location.href = 'class.html?gradeID='+id+'&schoolYear='+school_year;
}

/*删除年级*/
var delGradesUrl = rootReqUrl + '/v1/grades/delete';
function _delSingle(id) {
  var arr_id = id.split(',');
  var comfirmDialog = new Dialog(null, {
    width: 350,
    title: '提示',
    tipType: 'warn',
    message: '是否确认删除该条目',
    hasBtn: true,
    needDestroy: true,
    btnText: ['确定','取消'],
    btnRole: ['confirm','cancel'],
    confirm: function () {
      $.ajax({
        url: delGradesUrl,
        beforeSend: function(xhr) {
          xhr.setRequestHeader("X-ApiToken", token);
        },
        dataType: 'json',
        type: 'post',
        data: {
          id: arr_id
        },
        success: function(result) {
            if(result.ret == 0) {
                comfirmDialog.hide();
                oTable.ajax.reload();
            }else {
              showBackError('删除失败');
              return false;
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown){
          if(XMLHttpRequest.status != "200" || textStatus != "OK"){
            showBackError('调用数据失败，请稍后再试');
          }
        }
      });
    }
  });
}
