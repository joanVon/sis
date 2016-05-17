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
var class_id = getUrlParam("classID");
var class_no = getUrlParam("classNo");
var school_year = getUrlParam("schoolYear");
// console.log(urlArr[3]);

// var rootReqUrl = proxy + '/' + serverRootdir;
var rootReqUrl = 'http://121.43.118.245/mockjsdata/3/school'; //测试mockData

var str = '';

var viewScheduleUrl = rootReqUrl + '/v1/lessons/view_more';
$(function() {
  $('.link.item-grade').addClass('current');
  $('.sec-item').html('班级管理('+school_year+'级)').attr('href','class.html?gradeID='+grade_id+'&schoolYear='+school_year);
  $('.bread-title').html('课程表('+class_no+'班)');

  $.ajax({
    url: viewScheduleUrl,
    type: "post",
    dataType: "json",
    data: {
      class_id: class_id
    },
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-ApiToken", token);
    },
    success: function(result) {
      console.log(result.lessons);
      var lessonList = result.lessons;

      $.each(lessonList,function(j,k){//遍历当前星期(1,2,3,4,5,6,7)对应的课程信息
        // $("tbody tr[data='section-"+k.section+"'] td").eq(0).html("<span>第"+k.section+"节</span>");//填充节次
        $("tbody tr[data='section-"+k.section+"'] td").eq(k.week).html("<span class='btn-sel'><select class='select sel-subject'><option value='"+k.subject_id+"' selected='selected'>"+k.subject+"</option></select></span><br/><span class='btn-sel'><select class='select sel-teacher'><option value='"+k.teacher_id+"'>"+k.teacher+"</option></select></span>");//填充当前老师,课程，听课群组信息

      });

      selectSubject();
      selectTec();

      $("select.select").change(function() {

        section = $(this).parents('tr').index() + 1; // 行位置
        week = $(this).parents('td').attr('data'); // 列位置

        console.log(section+','+week);

        $(this).css('color','#ff5507');

        var subject = $(this).parents('td').find('.select').eq(0).val();
        var teacher = $(this).parents('td').find('.select').eq(1).val();

        subject_id = Number(subject);
        teacher_id = Number(teacher);

        // console.log('sub:'+subject_id+',te:'+teacher_id);

        // if(subject_id != '' && subject_id != null && subject_id != 0 && teacher_id != '' && teacher_id != null && teacher_id != 0) {
            saveSingle();
        // }
      });
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      if(XMLHttpRequest.status != "200" || textStatus != "OK"){
        showBackError('调用数据失败，请稍后再试');
      }
    }
  });

 });

var subjectSelectUrl =  rootReqUrl + '/v1/subjects/view_more';
var teacherSelectUrl = rootReqUrl +'/v1/teachers/view_more';
function selectSubject() {
  var subjects = $(".sel-subject");
  $.ajax({
    url: subjectSelectUrl,
    type: "get",
    dataType: "json",
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-ApiToken", token);
    },
    success: function(data) {
     var name = data.subjects;
      console.log(name);
      // subjects.empty();
      for(var i=0;i<name.length;i++) {
        var option = $("<option>").attr('name',name[i].id).text(name[i].name).val(name[i].id);
        subjects.append(option);
        subjects.parents('span').attr('data',name[i].id);
      }
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      if(XMLHttpRequest.status != "200" || textStatus != "OK"){
        showBackError('调用数据失败，请稍后再试');
      }
    }
  });
}

/*选择老师*/
function selectTec() {
  var teachers = $(".sel-teacher");
  $.ajax({
    url: teacherSelectUrl,
    type: "get",
    dataType: "json",
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-ApiToken", token);
    },
    success: function(data) {
     var name = data.teachers;
      console.log(name);
      // teachers.empty();
      for(var i=0;i<name.length;i++) {
        var option = $("<option>").attr('name',name[i].id).text(name[i].fullname).val(name[i].id);
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

/*保存*/
var section;
var week;
var subject_id;
var teacher_id;

var editSingleUrl = rootReqUrl + '/v1/lessons/edit';
function saveSingle() {

  var data = {
    class_id : class_id,
    section: section,
    week: week,
    subject_id: subject_id,
    teacher_id: teacher_id
  }
  $.ajax({
    url: editSingleUrl,
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-ApiToken", token);
    },
    dataType: 'json',
    type: 'post',
    data: data,
    success: function(result) {
      if(result.ret != 0) {
        showBackError(result.msg);
      }
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      if(XMLHttpRequest.status != "200" || textStatus != "OK"){
        showBackError('调用数据失败，请稍后再试');
      }
    }
  });

}

