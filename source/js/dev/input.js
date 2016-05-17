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
var school_year = getUrlParam("schoolYear");
// var school_year = getUrlParam("schoolYear");

var a = serverRootdir.split('/');

var serverIP = a[0];

var rootReqUrl = proxy + '/' + serverRootdir;

var studentList;

$(function() {
  $('.link.item-grade').addClass('current');

    $('#upload').click(function(){
        upload();
    });

    $('#inputTable').DataTable({
      ordering: false,
      retrieve: true,
      destroy: true,
      lengthChange: false,
      searching: false,
      language:{
        'url': '../config/zh_CN.json'
      }
    });
 });

var uploadUrl = rootReqUrl + '/v1/students/parse_student';
var str = '';

var addAllUrl = rootReqUrl + '/v1/students/add_more';

function upload() {
  var formData = new FormData();
  formData.append('data[Upload][file]', $('#file')[0].files[0]);
  formData.append('school_year', school_year);
  $.ajax({
    url: uploadUrl,
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-ApiToken", token);
    },
    type: 'post',
    data: formData,
    processData: false,
    contentType: false,
    success: function(result) {
        if(result.ret == 0) {
          studentList = result.student;
          for (var i=0; i < studentList.length; i++) {
            var class_no = studentList[i].class_no;
            var fullname = studentList[i].fullname;
            var student_code = studentList[i].student_code;
            var student_no = studentList[i].student_no;
            var username = studentList[i].username;

            str += '<tr>' +
                '<td>'+class_no+'</td>' +
                '<td>'+student_code+'</td>' +
                '<td>'+student_no+'</td>' +
                '<td>'+username+'</td>' +
                '<td>'+fullname+'</td>' +
                '</tr>';
          }

          $('#inputTable tbody').html(str);

          $('#addStudents').click(function(){
            $.ajax({
              url: addAllUrl,
              beforeSend: function(xhr) {
                xhr.setRequestHeader("X-ApiToken", token);
              },
              dataType: 'json',
              type: 'post',
              data: {
                grade_id : grade_id,
                server_ip : serverIP,
                students : studentList
              },
              success: function(result) {
                  if(result.ret == 0) {
                    showBackError('√ 添加成功');
                  }else {
                    var error_alert = '添加失败：用户名'+result.msg+'，<strong>刷新</strong>页面重新导入文件！'
                    // showBackError('添加失败：用户名'+result.msg+',请刷新页面重新导入！');
                    var alertDialog = new Dialog(null, {
                        width: 450,
                        hasTitle: false,
                        tipType: 'error',
                        message: error_alert,
                        hasBtn: true,
                        btnText: ['确定'],
                        btnRole: ['confirm'],
                        confirm: function () {
                           location.reload();
                        }
                    });
                    return false;
                  }
              },
              error: function(XMLHttpRequest, textStatus, errorThrown) {
                if(XMLHttpRequest.status != "200" || textStatus != "OK"){
                  showBackError('调用数据失败，请稍后再试');
                }
              }
            });
          });
        }
    },
    error: function(XMLHttpRequest, textStatus, errorThrown){
      if(XMLHttpRequest.status != "200" || textStatus != "OK"){
        showBackError('调用数据失败，请稍后再试');
      }
    }
  });
}




