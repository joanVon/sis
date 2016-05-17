var isIE6 = ($.browser || 0).msie && $.browser.version == 6.0;
/**
 * 名称: diyselect.js
 * 描述: 用其它 HTMLElement 模拟 select
 * 属性: UI组件
 * 版本: 0.9.5
 * 依赖: jQuery ~> 1.7.2, pin ~> 0.9.0
 */

var DiySelect = function (select, options) {
    options = $.extend({}, $.fn.diySelect.defaults, options);

    this.options = options;
    this.hasInit = false;

    this.init(select);
};

DiySelect.prototype = {

    constructor: DiySelect,

    init: function (select) {
        // 是否初始化且目标元素是否为 `select`
        if (this.hasInit && select.tagName.toLowerCase !== 'select') {
            return;
        }

        var id = select.id;
        this.unique(id); // 去重

        this.selectSpan = $('<span/>').addClass(this.options.selectClass).attr('id', id + '-select');
        this.optionDiv = $('<div/>').addClass(this.options.optionClass).attr('id', id + '-option');
        this.optionUl = $('<ul/>');
        this.option = $(select).find('option');
        this.optionSize = this.option.length;
        this.arrowHtml = '<i class="' + this.options.arrowClass + '"></i>';
        this.bgIframe = $('<iframe/>').addClass('bgiframe').attr('frameborder', '0');

        // 组装模拟元件
        this.setupOption();
        this.setupSelect();

        // DOM 操作：
        // 隐藏原 `select`，再其后加入模拟的 `HTMLElement`
        $(select).hide();
        this.selectSpan.insertAfter($(select));
        this.optionDiv.insertAfter(this.selectSpan).hide();

        // 初始化完成标记
        this.hasInit = true;

        var that = this;
        var active = -1;
        var list = this.optionDiv.find('li');

        // 事件绑定
        list.on('click', function (e) {
            var text = $(this).text();

            e.preventDefault();
            e.stopPropagation();

            that.chooseOption(text);
            $(select).trigger('change');
        });

        list.on('mouseenter', function () {
            list.removeClass('active');
            $(this).addClass('active');
            active = list.filter(':visible').index(this);
        });

        this.selectSpan.on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // 自定义事件
            if (that.options.beforeSelect) {
                that.options.beforeSelect.apply(this);
            };

            $('.' + that.options.optionClass).hide();

            // if (that.optionVisible) {
            //  that.hideOption();
            // } else {
            //  that.showOption();
            // }
            that.showOption();
        });

        $(select).on('choose', function (e, text) {
            e.stopPropagation();
            that.chooseOption(text);
        });

        $(select).on('revert', function (e) {
            e.stopPropagation();
            that.revert();
        });

        // 窗口变化时调整位置
        $(window).on('resize', $.proxy(this.setPosition, this));

        // 模拟 `select` 失焦
        $(document).on('click', function () {
            if (that.optionVisible) { that.hideOption(); }
        });

        // 键盘事件
        $(document).on('keydown', function (e) {
            if (that.optionDiv.is(':visible')) {
                switch (e.keyCode) {
                    case 13: // enter
                        if (active !== -1) {
                            var text = list.slice(active, active + 1).text();
                            that.chooseOption(text);
                        }

                        that.hideOption();
                        $(select).trigger('change');
                        break;
                    case 27: // esc
                        that.hideOption();
                        break;
                    case 38: // up
                        e.preventDefault();
                        moveSelect(-1);
                        break;
                    case 40: // down
                        e.preventDefault();
                        moveSelect(1);
                        break;
                }
            }
        });

        /**
         * 焦点位移
         * @param  {float} step 位移步长
         */
        function moveSelect(step) {
            var count = list.length;

            active += step;

            if (active < 0) {
                active =  0;
            } else if (active >= count) {
                active = count - 1;
            } else {
                list.removeClass('active');
                list.slice(active, active + 1).addClass('active');

                // 出现滚动条的情况
                if ( active >= (that.options.maxSize / 2) && count > that.options.maxSize) {
                    that.optionDiv.scrollTop(list.height() * (active - (that.options.maxSize / 2)));
                }
            }
        }
    },

    setupOption: function () {
        var fragment = document.createDocumentFragment();

        for (var i = 0; i < this.optionSize; i++) {
            var li = document.createElement('li');
            var value = this.option[i].value;
            var text = this.option[i].text;

            li.innerHTML = text;

            if (value) {
                li.setAttribute('data-' + this.options.valueAttr, value);
            }

            fragment.appendChild(li);
        }

        this.optionDiv.append(this.optionUl);
        this.optionUl.get(0).appendChild(fragment);
        this.optionVisible = false;
    },

    setupSelect: function () {
        var checkText = this.options.checkText || this.option.filter(':selected').text();

        // 初始选择（可设置）
        this.chooseOption(checkText);

        if (this.options.width) {
            this.selectSpan.width(this.options.width);
        }

        var spanStyle = this.selectSpan.attr('style');

        if (spanStyle) {
            spanStyle += ';' + this.options.style;
        }

        this.selectSpan.attr('style', spanStyle);
    },

    setPosition: function () {
        // 可视窗口顶部到 `selectSpan` 的距离
        var top_height = this.selectSpan.offset().top + this.selectSpan.outerHeight() - $(window).scrollTop();

        // 可视窗口剩余空间与 `optionDiv` 高度的差值
        var diff = $(window).height() - top_height - this.optionDiv.height();

        // 差值大于零，说明剩余空间还可容纳 `optionDiv`
        // `optionDiv` 就位居 `selectSpan` 正下方展示
        // 反之亦然
        if ( diff > 0 ) {
            this.optionDiv.pin({
                base: this.selectSpan,
                baseXY: [0, '100%-1px']
            });
        } else {
            this.optionDiv.pin({
                base: this.selectSpan,
                selfXY: [0, '100%-1px']
            });
        }
    },

    chooseOption: function(text) {
        this.hideOption();
        this.selectSpan.html(text + this.arrowHtml);
        // this.option.attr('selected', false);

        for (var i = 0; i < this.optionSize; i++) {
            if (text === this.option[i].text) {
                // 原生 `select` 跟随选择
                this.option[i].selected = true;
                break;
            }
        }

        if (this.options.afterChoose) {
            this.options.afterChoose.apply(this);
        }
    },

    showOption: function () {
        this.optionDiv.show();

        this.optionDiv.height(Math.min(this.optionDiv.height(),
            this.optionDiv.find('li').height() * this.options.maxSize));

        this.optionDiv.css({
            'min-width': this.selectSpan.outerWidth()-2,
            'z-index': this.options.zIndex
        });

        if (isIE6) {
            this.optionDiv.css('zoom', 1);
        }

        this.setPosition();
        this.optionVisible = true;
    },

    hideOption: function () {
        this.optionDiv.hide();
        this.optionVisible = false;
    },

    unique: function (id) {
        if ($('#' + id + '-select')) { $('#' + id + '-select').remove(); }
        if ($('#' + id + '-option')) { $('#' + id + '-option').remove(); }
    },

    revert: function () {
        this.selectSpan.remove();
        this.optionDiv.remove();
    }
};

// 注册插件
$.fn.diySelect = function (options) {
    return this.each(function () {
        new DiySelect(this, options);
    });
};

$.fn.chooseSelect = function (value) {
    return this.trigger('choose', [value]);
};

$.fn.revertSelect = function () {
    return this.trigger('revert');
};

// 默认设置
$.fn.diySelect.defaults = {
    selectClass: 'js-select',
    optionClass: 'js-option',
    arrowClass: 'arrow',
    valueAttr: 'select-val',
    zIndex: '10000',
    offsetY: 1,
    maxSize: 6
};

$.fn.Constructor = DiySelect;
// 定义 Overlay 类
var Overlay = function (element, options) {
    options = $.extend({}, $.fn.overlay.defaults, options);

    this.options = options;
    this.overlay = $(element);

    this.init(options);
};

Overlay.prototype = {

    constructor: Overlay,

    init: function (options) {
        this.overlay.addClass(this.options.className);

        // 添加外部自定义的样式
        this.overlay.attr('style', this.options.style);

        // 基本 CSS
        this.overlay.css({
            width: this.options.width,
            height: this.options.height,
            zIndex: this.options.zIndex
        });

        // 将浮出层插入 DOM 并进行定位
        this.overlay.appendTo($(this.options.parent));
        this.setPosition();

        // 窗口变化重新定位
        $(window).on('resize', $.proxy(this.setPosition, this));
    },

    show: function () {
        this.overlay.show();
    },

    hide: function () {
        this.overlay.hide();
    },

    remove: function () {
        this.overlay.remove();
    },

    blurHide: function () {
        $(document).on('click', $.proxy(this.hide, this));
        this.overlay.on('click', function (e) {
            e.stopPropagation();
        });
    },

    setPosition: function () {
        this.overlay.pin({
            // 基准定位元素，默认为当前可视区域
            base: this.options.align.base,
            // element 的定位点，默认为中心
            selfXY: this.options.align.selfXY,
            // 基准定位元素的定位点，默认为中心
            baseXY: this.options.align.baseXY
        });
    }
};

// 注册插件
$.fn.overlay = function (options) {
    return this.each(function () {
        new Overlay(this, options);
    });
};

// 默认设置
$.fn.overlay.defaults = {
    className: '',
    style: '',
    width: 'auto',
    height: 'auto',
    zIndex: 999,
    parent: 'body',
    align: {
        base: null,
        selfXY: ['50%', '50%'],
        baseXY: ['50%', '50%']
    }
};

$.fn.overlay.Constructor = Overlay;


/**
 * 名称: pin.js
 * 描述: 通过两个对象分别描述定位元素及其定位点，然后将其定位点重合
 * 属性: 工具
 * 版本: 0.9.0
 * 依赖: jQuery ~> 1.7.2
 */

$.fn.pin = function (options, fixed) {
    options = $.extend({
        base: null,
        selfXY: [0, 0],
        baseXY: [0, 0]
    }, options || {});

    // 是否相对于当前可视区域（Window）进行定位
    var isViewport = !options.base,

            // 定位 fixed 元素的标志位，表示需要特殊处理
            isPinFixed = false,

            parent = this.offsetParent(),

            // 基准元素的偏移量
            offsetLeft, offsetTop,

            // 基准元素根据定位点坐标 `baseXY` 分别获得纵横两个方向上的 size
            baseX, baseY,

            // 同上，根据定位点坐标 `selfXY` 获取的横纵两个方向上的 size
            selfX, selfY,

            // 定位元素位置
            left, top;

    // 设定目标元素的 position 为绝对定位
    // 若元素的初始 position 不为 absolute，会影响元素的 display、宽高等属性
    if (this.css('position') !== 'fixed' || isIE6) {
        this.css('position', 'absolute');
        isPinFixed = false;
    } else {
        isPinFixed = true;
    }

    // 修正 ie6 下 absolute 定位不准的 bug
    if (isIE6) {
        this.css('zoom', 1);
        parent.css('zoom', 1);
    }

    // 如果不定义基准元素，则相对于当前可视区域进行定位
    if (isViewport) {
        offsetLeft = $(document).scrollLeft();
        offsetTop = $(document).scrollTop();

        baseX = getSize($(window), options.baseXY[0], 'outerWidth');
        baseY = getSize($(window), options.baseXY[1], 'outerHeight');
    } else {
        // 判断定位元素的祖先是否被定位过，是的话用 `$.position()`，否则用 `$.offset()`
        var offsetFixed = (parent[0] === document.documentElement) ?
                                            options.base.offset() :
                                            options.base.position();

        offsetLeft = offsetFixed.left;
        offsetTop = offsetFixed.top;

        baseX = getSize(options.base, options.baseXY[0], 'outerWidth');
        baseY = getSize(options.base, options.baseXY[1], 'outerHeight');
    }

    selfX = getSize(this, options.selfXY[0], 'outerWidth');
    selfY = getSize(this, options.selfXY[1], 'outerHeight');

    // 计算定位元素位置
    // 若定位 fixed 元素，则父元素的 offset 没有意义
    left = (isPinFixed? 0 : offsetLeft) + baseX - selfX;
    top = (isPinFixed? 0 : offsetTop) + baseY - selfY;

    // 进行定位
    this.css({ left: left, top: top });
};

// 扩展：相对于当前可视区域页面上某一元素的居中定位
$.fn.pinCenter = function (options) {
    this.pin({
        base: (options) ? options.base : null,
        selfXY: ['50%', '50%'],
        baseXY: ['50%', '50%']
    });
};

/**
 * 根据坐标点获取对应尺寸值
 * @param  {jquery} object 被获取尺寸的元素
 * @param  {array}  coord  坐标点
 * @param  {string} type   尺寸类型
 * @return {number}
 */
function getSize(object, coord, type) {
    // 参考 `https://github.com/aralejs/position/blob/master/src/position.js`
    // 中的 `xyConverter` 方法
    // 先将坐标值转成字符串
    var x = coord + '';

    // 处理 alias，此处正则表达式内的 `:?` 表示此括号为非捕获型括号
    if (/\D/.test(x)) {
        x = x.replace(/(?:top|left)/gi, '0%')
                    .replace(/center/gi, '50%')
                    .replace(/(?:bottom|right)/gi, '100%');
    }

    // 处理 `px`
    if (x.indexOf('px') !== -1) {
        x = x.replace(/px/gi, '');
    }

    // 将百分比转为像素值
    if (x.indexOf('%') !== -1) {
        // 支持小数
        x = x.replace(/(\d+(?:\.\d+)?)%/gi, function (m, d) {
            return object[type]() * (d / 100.0);
        });
    }

    // 处理类似 100%+20px 的情况
    if (/[+\-*\/]/.test(x)) {
        try {
            x = (new Function('return ' + x))();
        } catch (e) {
            throw new Error('Invalid position value: ' + x);
        }
    }

    // 转回为数字
    return parseFloat(x, 10);
}

/**
 * Dialog 弹出层组件
 * @param {jQuery} element
 * @param {Object} options
 * @class
 */
var Dialog = function (element, options) {
  options = $.extend({}, $.fn.dialog.defaults, options);

  this.options = options;
  this.el = element;
  this.hasInit = false;

  this.setup();
};

Dialog.prototype = {

  constructor: Dialog,

  init: function () {
    // 创建弹出层
    this.dialog = new Overlay(this.options.template, {
      className: this.options.dialogClass,
      width: this.options.width,
      height: this.options.height,
      zIndex: this.options.zIndex
    });

    if (this.options.hasMask) {
      var $mask = $('.' + this.options.maskClass);

      if ($mask.length === 0) {
        // 创建遮罩
        this.mask = new Overlay(document.createElement('div'), {
          className: this.options.maskClass,
          width: '100%',
          height: '100%',
          zIndex: this.options.zIndex - 1,
          style: {
            position: 'fixed',
            top: 0,
            left: 0
          }
        });
      } else {
        // 已有遮罩
        this.mask = $mask;
      }
    }

    // 内容填充
    this.render();

    // 先隐藏浮动层与遮罩
    this.dialog.hide();
    this.options.hasMask && this.mask.hide();

        var $dialog = $(this.dialog.overlay);
    // 关闭按钮事件绑定
    $dialog.on('click', '.js-dialog-close', $.proxy(this.hide, this));
    // 其它按钮事件绑定
    if (this.options.btnEvent) {
      for (var i = 0; i < this.options.btnEvent.length; i++) {
        (function (index, self) {

          $dialog.on('click', '.btn-event:nth-child(' + (index + 1) + ')', function () {

            self.options.btnEvent[index].call(this, self);

          });
        })(i, this);
     }
    } else {

      $dialog.on('click', '[data-role=cancel]', $.proxy(this.hide, this));

      if (this.options.confirm) {
          $dialog.on('click', '[data-role=confirm]', (function (_this) {
              return function () {
                  _this.options.confirm.call(_this);
              }
          })(this));
      }

    }

    // 初始化完成标志
    this.hasInit = true;
  },

  setup: function (element) {
    var self = this;

    if (this.el) {
      // 触发绑定
      $(this.el).on('click.dialog', function (e) {
        e.preventDefault();

        self.trigger();
      });

            // 用于一些初始化的操作，只执行一次
            if (this.options.once) {
                $(this.el).one('click.dialog', function (e) {
                    e.preventDefault();
                    self.options.once();
                });
            }
    } else {
      this.trigger();
    }
  },

  trigger: function () {
    if (!this.hasInit) {
      this.init();
    }

    this.show();
  },

  show: function () {
    this.options.beforeShow && this.options.beforeShow.call(this);

    this.dialog.setPosition();
    this.dialog.show();
    this.options.hasMask && this.mask.show();

    this.options.afterShow && this.options.afterShow.call(this);
  },

  hide: function () {
    this.options.beforeHide && this.options.beforeHide.call(this);

    this.dialog.hide();
    this.options.hasMask && this.mask.hide();

    this.options.afterHide && this.options.afterHide.call(this);
    if (this.options.needDestroy) {
      this.destroy();
    }
  },

  render: function () {
    var $dialog = $(this.dialog.overlay),
        $head = $dialog.find('.js-dialog-hd'),
        $body = $dialog.find('.js-dialog-bd'),
        $close = $dialog.find('.js-dialog-close'),
        content;

    if (!this.options.hasTitle) {
      $head.remove();
    } else {
      $head.find('h2').text(this.options.title);
    }

    if (this.options.noClose) {
      $close.remove();
    }

    if (this.options.tipType) {
      content = '<p class="tip-wrap"><i class="icon icon-' + this.options.tipType + '-lg"></i>' + this.options.message + '</p>'
    } else {
      content = this.options.content;
    }


    if (this.options.scrollHeight) {
      var sh = this.options.scrollHeight;

      if (typeof sh === 'number') {
        sh += 'px';
      }

      content = '<div class="js-scrollable" style="height: ' + sh + '">' + content + '</div>';
    }

    if (this.options.hasBtn) {
      var btnCls;
      content += '<div class="btn-wrap">';
      for (var i = 0; i < this.options.btnText.length; i++) {
        btnCls = this.options.btnCls[i];
        content += '<button type="button" data-role="' + this.options.btnRole[i] + '" class="btn-event btn-dialog btn-' + btnCls + ' btn-lw">' + this.options.btnText[i] + '</button>'
      }
      content += '</div>';
    };

    $body.html(content).css('padding', this.options.padding);
      var tipHeight = $('.js-dialog .js-dialog-bd .tip-wrap').height();
      if (tipHeight < 30){
        $('.js-dialog .js-dialog-bd .tip-wrap').attr("style","text-align:center");
      }

  },

  closeDelay: function (millisecond) {
    setTimeout($.proxy(this.hide, this), millisecond);
  },

  destroy: function () {
    if (this.options.hasMask) {
      var $dialog = $('.' + this.options.dialogClass);
      if ($dialog.length > 1) {
        this.mask.hide();
      } else {
        this.mask.remove();
      }
    }

    this.dialog.remove();

    if (this.el) {
      $(this.el).off('click.dialog');
    }
  },

}

// 注册插件
$.fn.dialog = function (options) {
  return this.each(function () {
    new Dialog(this, options);
  });
};

// 默认设置
$.fn.dialog.defaults = {
  dialogClass: 'js-dialog',
  maskClass: 'js-mask',
  template: '<div>' +
              '<div class="js-dialog-hd">' +
                '<h2>提示</h2>' +
              '</div>' +
              '<div class="js-dialog-bd"> </div>' +
              '<div class="js-dialog-close">×</div>' +
            '</div>',
  width: 450,
  height: 'auto',
  zIndex: 999,
  hasMask: true,
  hasTitle: true,
  title: '提示',
  cotent: '',
  padding: '30px',
  hasBtn: false,
  btnText: ['确定', '取消'],
  btnRole: ['confirm', 'cancel'],
  btnCls: ['primary', 'deny'],
  message: ''
};

$.fn.dialog.Constructor = Dialog;

// 定义 Validator 类
var Validator = function (el, options) {
  options = $.extend({}, $.fn.validator.defaults, options);

    var items = [];
    var cache = new Cache();

    this.items = items;
    this.cache = cache;
  this.options = options;

  this.setup();
};

Validator.prototype = {

  constructor: Validator,

  setup: function () {
    var $btn = this.options.submit.btn;

        if ($btn) {
            $btn.data('clicking', false);
            $btn.on('click.validate', (function (_this) {
                return function (e) {
                    e.preventDefault();
                    setTimeout(function () {
                        _this.submit.call(_this, $btn);
                    }, 100);
                }
            })(this));
        }

        $.each(this.options.items, (function (_this) {
            return function () {
                _this.process(this);
            }
        })(this));
  },

  process: function (opts) {
        var self = this,
            $item = $(opts.selector),
            eventType;

    this.items.push($item);

        $item.on('validate', function () {
            self.validateItem.apply(self, [this, opts]);
        });

        if ($item.is('input') || $item.is('textarea')) {
            eventType = 'blur';
        } else if ($item.is('select')) {
            eventType = 'change';
        }

        $item.on(eventType, function () {
            $(this).trigger('validate');
        });
  },

    validateItem: function (item, opts) {
        var self = this,
            client_ret = opts.validate(),
            $loading, $parent;

        if (client_ret !== 'success') {
            self.handleTip(item, {type: 'error', info: client_ret});
            return false;
        }

        if (opts.remote) {

            // 请求数据在缓存内，则不发送请求
            if (item.value in self.cache._storage) {
                var _data = self.cache.load(item.value);

                if (_data.errorNo !== 0) {
                    self.handleTip(item, {type: 'error', info: _data.errorInfo});
                } else {
                    self.handleTip(item, {type: 'success', info: _data.successInfo});
                }

                if (opts.ajaxCallback) {
                    opts.ajaxCallback.apply(_data);
                }

                return;
            }

            // $(this.tiper).hide();
            $parent = $(item).parent();
            $parent.find('.js-valid-tip').hide();
            $loading = $('<img class="js-valid-loading" src="/images/icon/loading.gif">');
            $parent.append($loading);

            $.ajax({
                type: 'POST',
                url: opts.remote,
                data: opts.params(),
                dataType: 'json'
            }).done((function (_this) {
                return function (data) {
                    var _data = data.resMap;

                    if (_data.errorNo !== 0) {
                        self.handleTip(_this, {type: 'error', info: _data.errorInfo});
                    } else {
                        self.handleTip(_this, {type: 'success', info: _data.successInfo});
                    }

                    if (opts.ajaxCallback) {
                        opts.ajaxCallback.apply(_data);
                    }

                    // 将发送的数据加入缓存中
                    self.cache.add(item.value, _data);
                }
            })(item))
            .always(function () {
                $loading.remove();
            });
        } else {
            self.handleTip(item, {type: 'success'});
        }
    },

    initTip: function (el) {
        var tip, parent;

        tip = document.createElement('div');
        tip.setAttribute('class', 'js-valid-tip');
        parent = el.parentNode;
        parent.appendChild(tip);
        $(el).data('tiped', true);

        return tip;
    },

    handleTip: function (el, data) {
        var itemData, tiper;

        itemData = {
            type: data.type || 'success',
            info: data.info || ''
        };

        // this.tiper = $(el).data('tiped') ?
        //     $(el.parentNode).find('.js-valid-tip')[0] :
        //     this.initTip(el);

        if ($(el).data('tiped')) {
            tiper = $(el.parentNode).find('.js-valid-tip')[0];
        } else {
            tiper = this.initTip(el);
        }

        if (tiper && itemData.type !== 'success') {
            tiper.innerHTML = '<i class="icon icon-' + itemData.type + '"></i>' + itemData.info;
            $(tiper).show();
        } else {
            $(tiper).hide();
        }

        return $(el).data('item-data', itemData);
    },

    renderTip: function (tiper, data) {
        // $(el).parent().find('.js-valid-tip').html('<i class="icon icon-' + data.type + '"></i>' + data.info);
        if (tiper && data.type !== 'success') {
            tiper.innerHTML = '<i class="icon icon-' + data.type + '"></i>' + data.info;
        } else {
            tiper.innerHTML = '';
            $(tiper).hide();
        }
    },

    submit: function ($btn) {
        var self = this,
            client_rets = [];

        $.each(this.items, function () {
            this.trigger('validate');
            if (this.data('item-data').type === 'error') {
                self.handleTip(this.get(0), this.data('item-data'));
                client_rets.push(this);
            }
        });

        if (this.options.debug) {
          return !client_rets.length;
        } else {
          if (!client_rets.length) { // 本地验证通过

              // submit 事件之前的事件
              if (this.options.submit.beforeAjax) {
                  $btn.data('go', this.options.submit.beforeAjax());
                  if (!$btn.data('go')) return;
              }

              if (!this.options.submit.remote) {
                  // 如果是 `form`，采用默认的表单提交
                  if ($el.is('form')) {
                      $el.trigger('submit');
                  }
                  return;
              }

              var $loading;

              $loading = $btn.parent().find('.loading');
              if ($loading) {
                  $loading.css('visibility', 'visible');
              }

              // 防止重复点击多次请求
              if ($btn.data('clicking')) return;
              $btn.data('clicking', true);

              $.ajax({
                  type: 'POST',
                  url: this.options.submit.remote,
                  data: this.options.submit.params(),
                  dataType: 'json'
              }).done(function (data) {
                  var _data = data.resMap;

                  if (_data.errorNo !== 0) { // 失败处理
                      if (_data.errorItem) {
                          for (var i = 0, l = _data.errorItem.length; i < l; i++) {
                              var errorItem = document.getElementById(_data.errorItem[i]);
                              if (errorItem) {
                                  self.handleTip(errorItem, {type: 'error', info: _data.errorInfo});
                              }
                          }
                      } else {
                          // TODO: 不固定位置提示
                      }
                  }

                  if (self.options.submit.ajaxSubmitCallback) {
                      self.options.submit.ajaxSubmitCallback(_data);
                  };

                  $btn.data('clicking', false);
              }).always(function () {
                  $loading.css('visibility', 'hidden');
              });
          }

      }
    }

};

// 注册插件
$.fn.validator = function (options) {
  return this.each(function () {
    new Validator(this, options);
  });
};

// 默认设置
$.fn.validator.defaults = {
    submit: {}
};

$.fn.Constructor = Validator;

var Cache = function () {
    this._storage = {};
}

Cache.prototype.add = function(q, v) {
    if (!this._storage[q]) {
        this._storage[q] = v;
    }
};

Cache.prototype.load = function(q) {
    if (this._storage[q]) {
        return this._storage[q];
    }
};

Cache.prototype.clear = function() {
    this._storage = {};
    this._storage.length = 0;
};

/**
 * 判断浏览器及操作系统的版本
 * @example  B.ie10
 *           B.win7
 */
var B = (function(ua) {
  var b = {
    msie: /\b(?:msie |ie |trident)/.test(ua) && !/opera/.test(ua),
    opera: /opera/.test(ua),
    safari: /webkit/.test(ua) && !/chrome/.test(ua),
    firefox: /firefox/.test(ua),
    chrome: /chrome/.test(ua)
  };
  var vMark = "";
  for (var i in b) {
    if (b[i]) {
      vMark = "safari" == i ? "version" : i;
      break;
    }
  }
  b.version = vMark && RegExp("(?:" + vMark + ")[\\/: ]([\\d.]+)").test(ua) ? RegExp.$1 : "0";

  b.ie = b.msie;
  b.ie6 = b.msie && parseInt(b.version, 10) == 6;
  b.ie7 = b.msie && parseInt(b.version, 10) == 7;
  b.ie8 = b.msie && parseInt(b.version, 10) == 8;
  b.ie9 = b.msie && parseInt(b.version, 10) == 9;
  b.ie10 = b.msie && parseInt(b.version, 10) == 10;

  b.win2000 = ua.indexOf('windows nt 5.0') > 1 ? true : false;
  b.winxp = ua.indexOf('windows nt 5.1') > 1 ? true : false;
  b.win2003 = ua.indexOf('windows nt 5.2') > 1 ? true : false;
  b.winvista = ua.indexOf('windows nt 6.0') > 1 ? true : false;
  b.win7 = ua.indexOf('windows nt 6.1') > 1 ? true : false;
  b.win8 = ua.indexOf('windows nt 6.2') > 1 ? true : false;

  return b;
})(window.navigator.userAgent.toLowerCase());


/**
 * 针对不支持 Html5 placeholder 的占位符兼容解决方案
 */

var ret = (function($){

    var isInputSupported = 'placeholder' in document.createElement('input'),
        isTextareaSupported = 'placeholder' in document.createElement('textarea'),

    // 这里的修改是为了防止修改$.fn
    // prototype = $.fn,
    prototype = {},
    valHooks = $.valHooks,
    hooks,
    placeholder;

    if (isInputSupported && isTextareaSupported) {

        placeholder = prototype.placeholder = function() {
            return this;
        };

        placeholder.input = placeholder.textarea = true;

    } else {

        placeholder = prototype.placeholder = function() {
            var $this = this;
            $this
            .filter((isInputSupported ? 'textarea' : ':input') + '[placeholder]')
            .unbind({
                'focus.placeholder': clearPlaceholder,
                'blur.placeholder': setPlaceholder
            })
            .bind({
                'focus.placeholder': clearPlaceholder,
                'blur.placeholder': setPlaceholder
            })
            .data('placeholder-enabled', true)
            .trigger('blur.placeholder');
            return $this;
        };

        placeholder.input = isInputSupported;
        placeholder.textarea = isTextareaSupported;

        hooks = {
            'get': function(element) {
                var $element = $(element);
                return $element.data('placeholder-enabled') && $element.hasClass('placeholder') ? '' : element.value;
            },

            'set': function(element, value) {
                var $element = $(element);
                if (!$element.data('placeholder-enabled')) {
                    return element.value = value;
                }
                if (value == '') {
                    element.value = value;
                    // Issue #56: Setting the placeholder causes problems if the element continues to have focus.
                    if (element != document.activeElement) {
                        // We can't use `triggerHandler` here because of dummy text/password inputs :(
                        setPlaceholder.call(element);
                    }
                } else if ($element.hasClass('placeholder')) {
                    clearPlaceholder.call(element, true, value) || (element.value = value);
                } else {
                    element.value = value;
                }
                // `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
                return $element;
            }
        };

        //isInputSupported || (valHooks.input = hooks);
        //isTextareaSupported || (valHooks.textarea = hooks);

        // 这里的修改是为了防止别的hooks被覆盖
        if(!isInputSupported){
            var _old = valHooks.input;

            if(_old){
                valHooks.input = {
                    'get': function(){
                        if(_old.get){
                            _old.get.apply(this, arguments);
                        }

                        return hooks.get.apply(this, arguments);
                    },
                    'set': function(){
                        if(_old.set){
                            _old.set.apply(this, arguments);
                        }

                        return hooks.set.apply(this, arguments);
                    }
                };
            } else {
                valHooks.input = hooks;
            }
        }

        if(!isTextareaSupported){
            var _old = valHooks.textarea;

            if(_old){
                valHooks.textarea = {
                    'get': function(){
                        if(_old.get){
                            _old.get.apply(this, arguments);
                        }

                        return hooks.get.apply(this, arguments);
                    },
                    'set': function(){
                        if(_old.set){
                            _old.set.apply(this, arguments);
                        }

                        return hooks.set.apply(this, arguments);
                    }
                };
            } else {
                valHooks.textarea = hooks;
            }
        }

        $(function() {
            // Look for forms
            $(document).delegate('form', 'submit.placeholder', function() {
                // Clear the placeholder values so they don't get submitted
                var $inputs = $('.placeholder', this).each(clearPlaceholder);
                setTimeout(function() {
                    $inputs.each(setPlaceholder);
                }, 10);
            });
        });

        // Clear placeholder values upon page reload
        $(window).bind('beforeunload.placeholder', function() {
            $('.placeholder').each(function() {
                this.value = '';
            });
        });

    }

    function args(elem) {
        // Return an object of element attributes
        var newAttrs = {},
        rinlinejQuery = /^jQuery\d+$/;
        $.each(elem.attributes, function(i, attr) {
            if (attr.specified && !rinlinejQuery.test(attr.name)) {
                newAttrs[attr.name] = attr.value;
            }
        });
        return newAttrs;
    }

    function clearPlaceholder(event, value) {
        var input = this,
        $input = $(input);
        // 修改演示四出现的问题
        if ((input.value == $input.attr('placeholder') || input.value == '') && $input.hasClass('placeholder')) {
            if ($input.data('placeholder-password')) {
                $input = $input.hide().next().show().attr('id', $input.removeAttr('id').data('placeholder-id'));
                // If `clearPlaceholder` was called from `$.valHooks.input.set`
                if (event === true) {
                    return $input[0].value = value;
                }
                $input.focus();
            } else {
                input.value = '';
                $input.removeClass('placeholder');
                input == document.activeElement && input.select();
            }
        }
    }

    function setPlaceholder() {
        var $replacement,
        input = this,
        $input = $(input),
        $origInput = $input,
        id = this.id;
        if ($(input).val() == '') {
            if (input.type == 'password') {
                if (!$input.data('placeholder-textinput')) {
                    try {
                        $replacement = $input.clone().attr({ 'type': 'text' });
                    } catch(e) {
                        $replacement = $('<input>').attr($.extend(args(this), { 'type': 'text' }));
                    }
                    $replacement
                    .removeAttr('name')
                    .data({
                        'placeholder-password': true,
                        'placeholder-id': id
                    })
                    .bind('focus.placeholder', clearPlaceholder);
                    $input
                    .data({
                        'placeholder-textinput': $replacement,
                        'placeholder-id': id
                    })
                    .before($replacement);
                }
                $input = $input.removeAttr('id').hide().prev().attr('id', id).show();
                // Note: `$input[0] != input` now!
            }
            $input.addClass('placeholder');
            $input[0].value = $input.attr('placeholder');
        } else {
            $input.removeClass('placeholder');
        }
    }

    return placeholder;

})($);

// 做简单的api封装
placeholder = (!ret.input || !ret.textarea) ? function(element){
    if(!element){
        element = $('input, textarea');
    }
    if(element){
        ret.call($(element));
    }
} : function(){};

// 提供清除 input.value 的方法
placeholder.clear = function(element) {
    element = $(element);
    if (element[0].tagName === "FORM") {
        // 寻找表单下所有的 input 元素
        clearInput(element.find("input.placeholder, textarea.placeholder"));
    } else {
        // 清除指定的 input 元素
        clearInput(element);
    }
    function clearInput(input) {
        input.each(function(i, item) {
            item = $(item);
            if (item[0].value === item.attr("placeholder") && item.hasClass("placeholder")) {
                item[0].value = "";
            }
        });
    }
};

$(function () {
    // 默认运行，这样就不需要手动调用
    placeholder();
});
