var oTable;
var list;
var userInfo;
var token = getCookie("token");
if(token == '' || token == undefined) {
  location.href = "../login.html";
}
var serverRootdir = getCookie("serverRootdir");
// var urlArr = window.location.href.split('/');
// var rootDir = getUrlParam('rootdir');
// console.log(urlArr[3]);

var a = serverRootdir.split('/');

var serverIP = a[0];

// var rootReqUrl = proxy + '/' + serverRootdir;
var rootReqUrl = 'http://121.43.118.245/mockjsdata/3/school'; //测试mockData

$(function() {
  $('.link.item-teacher').addClass('current');

  initTable();
  oTable = initTable();
 });

/**
* 表格初始化
* @returns {*|jQuery}
*/
var teacherListUrl = rootReqUrl +'/v1/teachers/view_more';
function initTable() {
  var table = $('#teachersTable').DataTable({
    ajax: {
      "url": teacherListUrl,
      "beforeSend": function(xhr) {
        xhr.setRequestHeader("X-ApiToken", token);
      },
      "type": "get",
      "dataSrc": function ( json ) {
        console.log('teachers:'+json.teachers);
        if(json.ret != 0){
          showBackError(json.msg);
        }else{
          return json.teachers;
        }
      }
    },
    columns: [
        { "data": "teacher_no", "title": "编号"},
        { "data": "teacher_code", "title": "教师资格证号"},
        { "data": "username", "title": "用户名"},
        { "data": "fullname", "title": "姓名"},

        {
          "data": "id", "title": "操作",
          "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
            $(nTd).html("<a class='edit-btn' href='javascript:void(0);'>编辑</a>&nbsp;" +
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

/**
  * 添加老师
  */
  var addTeacherUrl = rootReqUrl + '/v1/teachers/add';
$("#addTeacher").click(function() {
  var tecDialog = new Dialog(null, {
    title: '新增老师',
    content: addTeacher,
    width: '600',
    hasBtn: true,
    // needDestroy: true,
    btnText: ['确定','取消'],
    btnRole: ['confirm','cancel'],
    confirm: function () {
      var teacherCode = $('#teacherCode').val();
      var teacherNo = $('#teacherCode').val();
      var userName = $('#userName').val();
      var fullName = $('#fullName').val();

      if (!isEmpty(teacherCode)) {
        $('#teacherCode').css('border-color','#f42a2a');
        return teacherCode;
      }
      if (!isEmpty(teacherNo)) {
        $('#teacherNo').css('border-color','#f42a2a');
        return teacherNo;
      }
      if (!isEmpty(userName)) {
        $('#userName').css('border-color','#f42a2a');
        return userName;
      }
      if (!isEmpty(fullName)) {
        $('#fullName').css('border-color','#f42a2a');
        return fullName;
      }

      $.ajax({
        url: addTeacherUrl,
        beforeSend: function(xhr) {
          xhr.setRequestHeader("X-ApiToken", token);
        },
        dataType: 'json',
        type: 'post',
        data: {
          teacher_code : teacherCode,
          teacher_no : teacherNo,
          username : userName,
          fullname : fullName,
          server_ip: serverIP
        },
        success: function(result) {
            if(result.ret == 0) {
                tecDialog.destroy();
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

/**
* 编辑老师
* edit single
*/
var editTeacherUrl = rootReqUrl + '/v1/teachers/edit';
$("#teachersTable tbody").on("click",".edit-btn",function(){
   var tds = $(this).parents("tr").children();
   $.each(tds, function(i,val){
    var jqob = $(val);
     if(i == 2 || jqob.has('a').length ){return true;}//跳过第3项 用户名,按钮
     var txt = jqob.text();
     var put = $("<input type='text'>");
     put.val(txt);
     jqob.html(put);
   });
   $(this).html("保存");
   $(this).toggleClass("edit-btn");
   $(this).toggleClass("save-btn");
});

$("#teachersTable tbody").on("click",".save-btn",function(){
    var row = oTable.row($(this).parents("tr"));
    var tds = $(this).parents("tr").children();
    $.each(tds, function(i,val){
       var jqob = $(val);
       //把input变为字符串
       if(!jqob.has('a').length){
           var txt = jqob.children("input").val();
           jqob.html(txt);
           oTable.cell(jqob).data(txt);//修改DataTables对象的数据
       }
    });
    var data = row.data();
   $.ajax({
    url: editTeacherUrl,
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-ApiToken", token);
    },
    dataType: 'json',
    type: 'post',
    data: {
      id: data.id,
      teacher_no: data.teacher_no,
      teacher_code: data.teacher_code,
      fullname: data.fullname
    },
    success: function(result) {
        if(result.ret == 0) {
          oTable.ajax.reload();
        }else {
          $('.error-content').html(result.msg);
          return false;
        }
    },
    error: function(XMLHttpRequest, textStatus, errorThrown){
      if(XMLHttpRequest.status != "200" || textStatus != "OK"){
        showBackError('调用数据失败，请稍后再试');
      }
    }
  });
});

/**
* 删除老师
* delet single
*/
var delTeachersUrl = rootReqUrl + '/v1/teachers/delete';
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
        url: delTeachersUrl,
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
              showBackError(result.msg);
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

