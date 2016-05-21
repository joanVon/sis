var oTable;
var list;
var userInfo;
var token = getCookie("token");
if(token == '' || token == undefined) {
  location.href = "../login.html";
}
var serverRootdir = getCookie("serverRootdir");
// var urlArr = window.location.href.split('/');
var grade_id = getUrlParam("gradeID");
var class_id = getUrlParam("classID");
var school_year = getUrlParam("schoolYear");
// console.log(urlArr[3]);

var a = serverRootdir.split('/');

var serverIP = a[0];

// var rootReqUrl = proxy + '/' + serverRootdir;
var rootReqUrl = 'http://121.43.118.245/mockjsdata/3/school'; //测试mockData

$(function() {
  $('.link.item-grade').addClass('current');
  $('.sec-item').html('班级管理('+school_year+'级)').attr('href','class.html?gradeID='+grade_id+'&schoolYear='+school_year);

  initTable();
  oTable = initTable();

 });

/**
* 表格初始化
* @returns {*|jQuery}
*/
var studentListUrl = rootReqUrl +'/v1/students/view_more';
function initTable() {
  var table = $('#classmatesTable').DataTable({
    ajax: {
      "url": studentListUrl,
      "beforeSend": function(xhr) {
        xhr.setRequestHeader("X-ApiToken", token);
      },
      "type": "post",
      "data": {
        id: class_id,
        scope: 'class'
      },
      "dataSrc": function ( json ) {
        console.log('students:'+json.students);
        if(json.ret != 0){
          showBackError(json.msg);
        }else{
          return json.students;
        }
      }
    },
    columns: [
        { "data": "student_code", "title": "学籍号"},
        { "data": "student_no", "title": "学号"},
        { "data": "fullname", "title": "姓名"},
        { "data": "username", "title": "用户名" },
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
  * 添加学生
  */
  var addStudentUrl = rootReqUrl + '/v1/students/add';
$("#addStudent").click(function() {
  var classDialog = new Dialog(null, {
    title: '新增学生',
    content: addClassmate,
    width: '600',
    hasBtn: true,
    // needDestroy: true,
    btnText: ['确定','取消'],
    btnRole: ['confirm','cancel'],
    confirm: function () {

      var studentCode = $('#studentCode').val();
      var studentNo = $('#studentNo').val();
      var userName = $('#userName').val();
      var fullName = $('#fullName').val();

      if (!isEmpty(studentCode)) {
        $('#studentCode').css('border-color','#f42a2a');
        return studentCode;
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
        url: addStudentUrl,
        beforeSend: function(xhr) {
          xhr.setRequestHeader("X-ApiToken", token);
        },
        dataType: 'json',
        type: 'post',
        data: {
          fullname: fullName,
          username: userName,
          class_id: class_id,
          student_code: studentCode,
          student_no: studentNo,
          server_ip: serverIP
        },
        success: function(result) {
            if(result.ret == 0) {
                classDialog.destroy();

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
* 编辑学生
* edit single
*/
var editStuUrl = rootReqUrl + '/v1/students/edit';
$("#classmatesTable tbody").on("click",".edit-btn",function(){
   var tds = $(this).parents("tr").children();
   $.each(tds, function(i,val){
    var jqob = $(val);
     if(i == 3 || jqob.has('a').length ){return true;}//跳过第4项 用户名,按钮
     var txt = jqob.text();
     var put = $("<input type='text'>");
     put.val(txt);
     jqob.html(put);
   });
   $(this).html("保存");
   $(this).toggleClass("edit-btn");
   $(this).toggleClass("save-btn");
});

$("#classmatesTable tbody").on("click",".save-btn",function(){
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
    url: editStuUrl,
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-ApiToken", token);
    },
    dataType: 'json',
    type: 'post',
    data: {
      id: data.id,
      class_id: class_id,
      student_no: data.student_no,
      student_code: data.student_code,
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
* 删除学生
* delet single
*/
var delStudentsUrl = rootReqUrl + '/v1/students/delete';
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
        url: delStudentsUrl,
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



