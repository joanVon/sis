$(function() {

    clearCookie();

  // var serverWebdir = '';
  $('#loginSubmit').click(function(){
      var username = $('.username').val();
      var password = $('.password').val();
      if(username == '') {
          $('.loginForm').find('.error').fadeOut('fast', function(){
              $(this).css('top', '0px');
          });
          $('.loginForm').find('.error').fadeIn('fast', function(){
              $(this).parent().find('.username').focus();
          });
          return false;
      }
      if(password == '') {
          $('.loginForm').find('.error').fadeOut('fast', function(){
              $(this).css('top', '56px');
          });
          $('.loginForm').find('.error').fadeIn('fast', function(){
              $(this).parent().find('.password').focus();
          });
          return false;
      }

      getToken(username, password);

});


/**
*  DOM
*/
  $("body").keydown(function(event) {
       if (event.keyCode == "13") {//keyCode=13是回车键
           $('#loginSubmit').click();
       }
   });

});

$('.page-container .loginForm .username, .page-container .loginForm .password').keyup(function(){
  $(this).parent().find('.error').fadeOut('fast');
});

// 提示层 `×` 的关闭事件绑定
$('.ui-loginerr').on('click', '.close', function () { closeError(); });

// 输入内容时关闭提示层
$(document.activeElement).on('keydown', function () { closeError(); });

/**
* 关闭报错提示层
* @param  {Function} callback 关闭后的事件回调方法
* @return {undefined}
*/
function closeError(callback) {
  var $layer = $('.ui-loginerr');
  $layer.fadeOut();

  // 回调方法
  callback && callback();
}



