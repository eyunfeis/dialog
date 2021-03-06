define("#dialog/0.9.1/anim-dialog-debug", ["./base-dialog-debug", "$-debug", "#overlay/0.9.11/overlay-debug", "#position/1.0.0/position-debug", "#iframe-shim/1.0.0/iframe-shim-debug", "#widget/1.0.2/widget-debug", "#base/1.0.1/base-debug", "#class/1.0.0/class-debug", "#events/1.0.0/events-debug", "#easing/1.0.0/easing-debug", "#overlay/0.9.11/mask-debug"], function(require, exports, module) {

    var $ = require('$-debug'),
        Overlay = require('#overlay/0.9.11/overlay-debug'),
        easing = require('#easing/1.0.0/easing-debug'),
        BaseDialog = require('./base-dialog-debug');

    // AnimDialog
    // -------
    // AnimDialog 组件继承自 Dialog 组件，提供了显隐的基本动画。

    var AnimDialog = BaseDialog.extend({

        attrs: {
            effect: {
                type: 'fade',
                duration: 400,      // 动画时长
                easing: 'easeOut',  // 平滑函数
                from: 'up'          // 方向 up|down|left|right
            },
            // 显示的动画效果，若未指定则采用 effect
            showEffect: {},
            // 隐藏时的动画效果，若未指定则采用 effect
            hideEffect: {}
        },

        show: function() {
            AnimDialog.superclass.show.call(this);
            this.element.hide();
            
            var elem = this.element,
                that = this,
                ef = this.get('showEffect');

            ef = $.extend(null, this.get('effect'), ef);

            if (ef.type == null) {
                ef = { type: 'none' };
            }

            // 无动画
            if (ef.type === 'none') {
                elem.show().focus();
            }
            // 淡入淡出
            else if (ef.type === 'fade') {
                elem.hide().fadeIn(ef.duration, ef.easing).focus();
            }
            // 滑动
            else if (ef.type === 'slide') {
                var properties = /left|right/i.test(ef.from)
                        ? { width: 'toggle' } 
                        : { height: 'toggle' };
                elem.hide().animate(properties, {
                    duration: ef.duration,
                    easing: ef.easing
                }).focus();
            }
            // 移动
            else if (ef.type === 'move') {
                // 避免当 elem.focus() 时的一个诡异的定位 bug
                // http://jsfiddle.net/ukKfH/1/
                elem.removeAttr('tabindex');
                elem.blur();
                
                // 确保目标元素为 block 对象，以便创建窗口层
                elem.css({ display:'block' });
                
                // 得到窗口层
                createLayer.call(this, elem);

                var width = this._layer.get('width'),
                    height = this._layer.get('height'),
                    properties;

                // 位置和显示前的准备
                elem.appendTo(this._layer.element).css({
                    top: 0,
                    left: 0,
                    display: 'block'
                });
                
                if (ef.from === 'left') {
                    elem.css('left', 0-width);
                    properties = { left: '+=' + width };
                }
                else if (ef.from === 'right') {
                    elem.css('left', width);    
                    properties = { left: '-=' + width };                    
                }
                else if (ef.from === 'up') {
                    elem.css('top', 0-height);
                    properties = { top: '+=' + height };                    
                }
                else if (ef.from === 'down') {
                    elem.css('top', height);
                    properties = { top: '-=' + height };                    
                }

                elem.animate(properties, {
                    duration: ef.duration,
                    easing: ef.easing,
                    complete: function() {
                        // 这里要复原因为 move 而造成的文档变化
                        // 真恶心
                        that.element.appendTo(document.body);
                        that.set('align', that.get('align'));
                        that.set('visible', 'true');                        
                        that._layer.hide();
                        
                        // 重新 focus
                        elem.attr('tabindex', '-1');
                        elem.focus();
                    }
                });
            }

            return this;
        },

        hide: function() {
            AnimDialog.superclass.hide.call(this);
            this.element.show();

            var elem = this.element,
                that = this,
                ef = this.get('hideEffect');

            ef = $.extend(null, this.get('effect'), ef);

            if (ef.type == null) {
                ef = { type: 'none' };
            }

            // 无动画
            if (!ef || ef.type === 'none') {
                elem.hide();
            }
            // 淡入淡出
            else if (ef.type === 'fade') {
                elem.fadeOut(ef.duration, ef.easing);
            }
            // 滑动
            else if (ef.type === 'slide') {
                var properties = /left|right/i.test(ef.from)
                        ? { width: 'toggle' } 
                        : { height: 'toggle' };
                elem.animate(properties, {
                    duration: ef.duration,
                    easing: ef.easing
                });
            }
            // 移动
            else if (ef.type === 'move') {
                // 如果已经隐藏，则不重复调用
                if (elem.css('display') === 'none') {
                    return;
                }
                // 得到窗口层
                createLayer.call(this, elem);
                
                var width = this._layer.get('width'),
                    height = this._layer.get('height'),
                    properties;

                // 位置和显示前的准备
                elem.appendTo(this._layer.element).css({
                    top: 0,
                    left: 0,
                    display: 'block'
                });

                if (ef.from === 'left') {
                    properties = { left: '-=' + width };
                }
                else if (ef.from === 'right') {
                    properties = { left: '+=' + width };
                }
                else if (ef.from === 'up') {
                    properties = { top: '-=' + height };
                }
                else if (ef.from === 'down') {
                    properties = { top: '+=' + height };
                }

                elem.animate(properties, {
                    duration: ef.duration,
                    easing: ef.easing,
                    complete: function() {
                        elem.appendTo(document.body);
                        that.set('align', that.get('align'));
                        elem.hide();
                        that.set('visible', false);
                        that._layer.hide();
                    }
                });
            }

            return this;
        }

    });

    module.exports = AnimDialog;

    // Helpers
    // -------

    // 准备好窗口层
    function createLayer(elem) {
        if (!this._layer) {
            this._layer = new Overlay({
                width: elem.outerWidth(true),
                height: elem.outerHeight(true),
                zIndex: 100,
                visible: true,
                style: {
                    overflow: 'hidden'
                },
                align: {
                    baseElement: elem[0]
                }
            });
        }
        this._layer.set('align', this._layer.get('align')).show();
    }

});

