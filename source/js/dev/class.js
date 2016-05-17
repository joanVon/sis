var oTable;
var list;
var userInfo;
var token = getCookie("token");
if(token == '' || token == undefined) {
  location.href = "../login.html";
}
var serverRootdir = getCookie("serverRootdir");
var urlArr = window.location.href.split('/');
var grade_id = getUrlParam("gradeID");
var school_year = getUrlParam("schoolYear");
// console.log(urlArr[3]);

// var rootReqUrl = proxy + '/' + serverRootdir;
var rootReqUrl = 'http://121.43.118.245/mockjsdata/3/school'; //测试mockData


$(function() {
  $('.link.item-grade').addClass('current');
  $('.bread-title').html('班级管理('+school_year+'级)');

  initTable();
  oTable = initTable();

 });

/**
* 表格初始化
* @returns {*|jQuery}
*/
var classListUrl = rootReqUrl +'/v1/classes/view_more';
var teacherSelectUrl = rootReqUrl +'/v1/teachers/view_more';
function initTable() {
  var table = $('#classesTable').DataTable({
    ajax: {
      "url": classListUrl,
      "beforeSend": function(xhr) {
        xhr.setRequestHeader("X-ApiToken", token);
      },
      "type": "post",
      "data": {
        grade_id: grade_id
      },
      "dataSrc": function ( json ) {
        console.log('classes:'+json.classes);
        if(json.ret != 0){
          showBackError(json.msg);
        }else{
          return json.classes;
        }
      }
    },
    columns: [
        { "data": "class_no", "title": "班级号"},
        { "data": "name", "title": "别名"},
        { "data": "student_number", "title": "学生数",
          "fnCreatedCell": function (nTd, sData, oData) {
              $(nTd).html(sData+"&nbsp;<a href='javascript:void(0);' onclick='viewStudent(\"" + oData.id + "\",\"" + oData.grade_id + "\")' >管理</a>");
          }
        },
        { "data": "created", "title": "创建时间", "visible": false},
        { "data": "modified", "title": "修改时间","visible": false},

        { "data": "fullname", "title": "班主任", "orderable": false},
        { "data": "teacher_id", "title": "teacherID", "visible": false},
        { "data": "grade_id", "title": "课程表", "orderable": false,
          "fnCreatedCell": function (nTd, sData, oData) {
              $(nTd).html("<a href='javascript:void(0);' onclick='editSchedule(\"" + oData.id + "\",\"" + oData.class_no + "\",\"" + sData + "\")'>查看/编辑</a>");
          }
        },
        { "data": "id", "title": "操作", "orderable": false,
          "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
            $(nTd).html("<a class='edit-btn' href='javascript:void(0);'>编辑</a>&nbsp;" +
            "<a class='del' href='javascript:void(0);' onclick='_delSingle(\"" + sData + "\")'>删除</a>&nbsp;");
          }
        }
    ],
    ordering: true,
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

/*选择班主任*/
function selectTec() {
  var teachers = $(".select");
  $.ajax({
    url: teacherSelectUrl,
    type: "get",
    dataType: "json",
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-ApiToken", token);
    },
    success: function(data) {
      // var name = [];
     var name = data.teachers;
      console.log(name);
      teachers.empty();
      for(var i=0;i<name.length;i++) {
        var option = $("<option>").attr('name',name[i].id).text(name[i].fullname).val(name[i].fullname);
        teachers.append(option);
        teachers.parents('span').attr('data',name[i].id);
      }
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      if(XMLHttpRequest.status != "200" || textStatus != "OK"){
        showBackError('调用数据失败，请稍后再试');
      }
    }
  });
}

/**
  * 添加班级
  */
  var addClassUrl = rootReqUrl + '/v1/classes/add';
$("#addClass").click(function() {

  var classDialog = new Dialog(null, {
    title: '新增班级',
    content: addClassRoom,
    width: '600',
    hasBtn: true,
    // needDestroy: true,
    btnText: ['确定','取消'],
    btnRole: ['confirm','cancel'],
    init: function() {selectTec();},
    confirm: function () {

      var classNo = $('#classNo').val();
      var className = $('#className').val();
      var teacher_id = $('.select').find("option:selected").attr('name');

      if (!isEmpty(classNo)) {
        $('#classNo').css('border-color','#f42a2a');
        return classNo;
      }
      if (!isEmpty(className)) {
        $('#className').css('border-color','#f42a2a');
        return className;
      }

      $.ajax({
        url: addClassUrl,
        beforeSend: function(xhr) {
          xhr.setRequestHeader("X-ApiToken", token);
        },
        dataType: 'json',
        type: 'post',
        data: {
          grade_id : grade_id,
          class_no : classNo,
          name : className,
          teacher_id: teacher_id
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
selectTec();
});

/**
* 编辑Class
* edit single
*/
var editClassUrl = rootReqUrl + '/v1/classes/edit';
var t_id;
$("#classesTable tbody").on("click",".edit-btn",function(){
   var tds = $(this).parents("tr").children();
   $.each(tds, function(i,val){
    var jqob = $(val);
     if(i == 2 || jqob.has('a').length ){return true;}//跳过第3项 课程表,按钮
      var txt = jqob.text();
      var put = $("<input type='text'>");
      var selT = $("<span><select class='selectTd select'><option></option></select></span>");

      if(i == 3) {
        selT.children('option').text(txt).val(txt);
        jqob.html(selT);
        selectTec();

      }else {
        put.val(txt);
        jqob.html(put);
      }
   });
   $(this).html("保存");
   $(this).toggleClass("edit-btn");
   $(this).toggleClass("save-btn");
});

$("#classesTable tbody").on("click",".save-btn",function(){
    var row = oTable.row($(this).parents("tr"));
    var tds = $(this).parents("tr").children();

    // console.log(row.data());
    $.each(tds, function(i,val){
       var jqob = $(val);

       //把input select变为字符串
       if(!jqob.has('a').length && i != 3){
         var txt = jqob.children().val();
         jqob.val(txt);
         oTable.cell(jqob).data(txt);//修改DataTables对象的数据
       }
       if(i == 3){
        var teacher_id = jqob.find("option:selected").attr('name');
        var txt = jqob.children().val();
        jqob.val(txt);
        oTable.cell(jqob).data(txt);//修改DataTables对象的数据
        row.data().teacher_id = teacher_id;
       }

    });

    var data = row.data();
   $.ajax({
    url: editClassUrl,
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-ApiToken", token);
    },
    dataType: 'json',
    type: 'post',
    data: {
      id: data.id,
      name: data.name,
      class_no: data.class_no,
      teacher_id: data.teacher_id,
      student_no: data.student_no,
      student_code: data.student_code,
      fullname: data.fullname
    },
    success: function(result) {
        if(result.ret == 0) {
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
});

/*查看班级学生*/
function viewStudent(id, grade_id) {
  location.href = 'student.html?gradeID='+grade_id+'&classID='+id+'&schoolYear='+school_year;
}

/*查看 编辑 课程表*/
function editSchedule(id, class_no, grade_id) {
  location.href = 'schedule.html?gradeID='+grade_id+'&classNo='+class_no+'&classID='+id+'&schoolYear='+school_year;
}

/*删除*/
var delClassesUrl = rootReqUrl + '/v1/classes/delete';
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
        url: delClassesUrl,
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

