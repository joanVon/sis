var oTable;
var list;
var userInfo;
var token = getCookie("token");
if(token == '' || token == undefined) {
  location.href = "../login.html";
}
var serverRootdir = getCookie("serverRootdir");
var urlArr = window.location.href.split('/');

// var rootReqUrl = proxy + '/' + serverRootdir;
var rootReqUrl = 'http://121.43.118.245/mockjsdata/3/school'; //测试mockData

$(function() {
  $('.link.item-subject').addClass('current');

  initTable();
  oTable = initTable();
 });

/**
* 表格初始化
* @returns {*|jQuery}
*/
var subjectListUrl = rootReqUrl +'/v1/subjects/view_more';
function initTable() {
  var table = $('#subjectsTable').DataTable({
    ajax: {
      "url": subjectListUrl,
      "beforeSend": function(xhr) {
        xhr.setRequestHeader("X-ApiToken", token);
      },
      "type": "get",
      "dataSrc": function ( json ) {
        console.log('subjects:'+json.subjects);
        if(json.ret != 0){
          showBackError(json.msg);
        }else{
          return json.subjects;
        }
      }
    },
    columns: [
        { "data": "code", "title": "学科编号"},
        { "data": "name", "title": "学科名称"},
        { "data": "created", "title": "创建时间"},
        { "data": "modified", "title": "更新时间"},
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
  * 添加学科
  */
  var addSubjectUrl = rootReqUrl + '/v1/subjects/add';
$("#addSubject").click(function() {
  var subjectDialog = new Dialog(null, {
    title: '新增学科',
    content: addSubject,
    width: '600',
    hasBtn: true,
    // needDestroy: true,
    btnText: ['确定','取消'],
    btnRole: ['confirm','cancel'],
    confirm: function () {
      var subjectName = $('#subjectName').val();
      var subjectCode = $('#subjectCode').val();


      if (!isEmpty(subjectCode)) {
        $('#subjectCode').css('border-color','#f42a2a');
        return subjectCode;
      }
      if (!isEmpty(subjectName)) {
        $('#subjectName').css('border-color','#f42a2a');
        return subjectName;
      }

      $.ajax({
        url: addSubjectUrl,
        beforeSend: function(xhr) {
          xhr.setRequestHeader("X-ApiToken", token);
        },
        dataType: 'json',
        type: 'post',
        data: {
          code : subjectCode,
          name : subjectName
        },
        success: function(result) {
            if(result.ret == 0) {
                subjectDialog.destroy();
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
* 编辑学科
* edit single
*/
var editSubjectUrl = rootReqUrl + '/v1/subjects/edit';
$("#subjectsTable tbody").on("click",".edit-btn",function(){
   var tds = $(this).parents("tr").children();
   $.each(tds, function(i,val){
    var jqob = $(val);
     if(i == 2 || i == 3 || jqob.has('a').length ){return true;}//跳过第3,4项 用户名,按钮
     var txt = jqob.text();
     var put = $("<input type='text'>");
     put.val(txt);
     jqob.html(put);
   });
   $(this).html("保存");
   $(this).toggleClass("edit-btn");
   $(this).toggleClass("save-btn");
});

$("#subjectsTable tbody").on("click",".save-btn",function(){
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
    url: editSubjectUrl,
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-ApiToken", token);
    },
    dataType: 'json',
    type: 'post',
    data: {
      id: data.id,
      name: data.name,
      code: data.code
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
* 删除学科
* delet single
*/
var delSubjectsUrl = rootReqUrl + '/v1/subjects/delete';
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
        url: delSubjectsUrl,
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

