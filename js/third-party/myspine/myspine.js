function MySpine(config) {
    this.config = config;
    this.widget = null;

    this.widgetContainer = document.querySelector(".myspine-spine-widget");
    this.voiceText = document.createElement("div");
    this.voicePlayer = new Audio();

    this.triggerEvents = ["mousedown", "touchstart", "scroll"];
    this.animationQueue = new Array(); // 动画播放队列
    this.isPlayingVoice = false;
    this.lastInteractTime = Date.now();
    this.localX = 0;
    this.localY = 0;

    this.load();
}

MySpine.downloadBinary = function (url, success, error) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function () {
        if (request.status == 200) {
            success(new Uint8Array(request.response));
        } else {
            error(request.status, request.responseText);
        }
    };
    request.onerror = function () {
        error(request.status, request.responseText);
    };
    request.send();
};

MySpine.prototype = {
    load: function () {
        let c = this.config;

        MySpine.downloadBinary(this.getUrl(c.skeleton), data => {
            function setStyle(element, style) {
                for (var prop in style) {
                    element.style.setProperty(prop, style[prop]);
                }
            }

            setStyle(this.widgetContainer, c.styles.widget);
            setStyle(this.voiceText, c.styles.voiceText);

            var skeletonJson = new spine.SkeletonJsonConverter(data, 1);
            skeletonJson.convertToJson();

            new spine.SpineWidget(this.widgetContainer, {
                animation: this.getAnimationList("start")[0].name,
                skin: c.skin,
                atlas: this.getUrl(c.atlas),
                jsonContent: skeletonJson.json,
                backgroundColor: "#00000000",
                loop: false,
                success: this.spineWidgetSuccessCallback.bind(this)
            });
        }, function (status, responseText) {
            console.error(`Couldn't download skeleton ${path}: status ${status}, ${responseText}.`);
        });
    },

    spineWidgetSuccessCallback: function (widget) {
        var init = () => {
            this.triggerEvents.forEach(e => window.removeEventListener(e, init));
            this.triggerEvents.forEach(e => window.addEventListener(e, this.tryPlayingIdleVoice.bind(this)));

            this.initVoiceComponents();
            this.initWidgetActions();
            this.initDragging();

            this.widget.play(); // 开始播放动画
            this.playVoice(this.getVoice("start"));
            this.widgetContainer.style.display = "block";
        };

        this.widget = widget;
        this.widget.pause(); // 停止动画播放
        this.widgetContainer.style.display = "none"; // 隐藏
        this.triggerEvents.forEach(e => window.addEventListener(e, init));
    },

    initVoiceComponents: function () {
        this.voiceText.setAttribute("class", "myspine-voice-text");
        this.widgetContainer.appendChild(this.voiceText); // 保证在canvas之上
        this.voiceText.style.opacity = 0; // 默认隐藏

        // 自动滚动文字
        this.voicePlayer.addEventListener("timeupdate", () => {
            this.voiceText.scrollTo({
                left: 0,
                top: this.voiceText.offsetHeight * (this.voicePlayer.currentTime / this.voicePlayer.duration),
                behavior: "smooth"
            });
        });

        this.voicePlayer.addEventListener("ended", () => {
            this.voiceText.style.opacity = 0; // 播放完立刻隐藏
            this.isPlayingVoice = false;
        });
    },

    initWidgetActions: function () {
        this.widget.canvas.onclick = this.interact.bind(this);
        this.widget.state.addListener({
            complete: entry => {
                // 如果音频没播放完就一直循环指定的动画，而不是回到闲置动画
                if (this.isPlayingVoice && entry.loop) {
                    this.playAllAnimations({
                        name: entry.animation.name,
                        loop: true
                    });
                } else {
                    this.playAllAnimations(this.animationQueue.shift() || this.getAnimationList("idle"));
                }
            }
        });
    },

    initDragging: function () {
        function getPagePos(event) {
            var x = document.documentElement.scrollLeft;
            var y = document.documentElement.scrollTop;

            if (event.targetTouches) {
                x += event.targetTouches[0].clientX;
                y += event.targetTouches[0].clientY;
            } else if (event.clientX && event.clientY) {
                x += event.clientX;
                y += event.clientY;
            }

            return {
                x: x,
                y: y
            };
        }

        function preventDefault(event) {
            if (event.cancelable) {
                event.preventDefault();
            }
        }

        var setWidgetPos = (left, top) => {
            left = Math.max(0, left);
            top = Math.max(0, top);
            left = Math.min(document.body.clientWidth - this.widgetContainer.clientWidth, left);
            top = Math.min(document.body.clientHeight - this.widgetContainer.clientHeight, top);

            this.widgetContainer.style.left = left + "px";
            this.widgetContainer.style.top = top + "px";
        };

        var down = event => {
            var {
                x,
                y
            } = getPagePos(event);

            this.localX = x - this.widgetContainer.offsetLeft;
            this.localY = y - this.widgetContainer.offsetTop;
        };

        var move = event => {
            var {
                x,
                y
            } = getPagePos(event);

            setWidgetPos(x - this.localX, y - this.localY);
            window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty(); // 清除选中文字
        };

        var passive = {
            passive: true
        };
        var nonPassive = {
            passive: false
        };

        this.widgetContainer.addEventListener("mousedown", event => {
            down(event);
            document.addEventListener("mousemove", move); // 防止鼠标快速滑出
        });
        this.widgetContainer.addEventListener('touchstart', event => {
            down(event);
            document.addEventListener("touchmove", preventDefault, nonPassive); // 防止屏幕滚动
        }, passive)

        this.widgetContainer.addEventListener('touchmove', move, passive)

        document.addEventListener("mouseup", () => document.removeEventListener("mousemove", move));
        this.widgetContainer.addEventListener('touchend', () => document.removeEventListener("touchmove", preventDefault));

        window.addEventListener("resize", () => {
            let style = this.widgetContainer.style;

            if (style.left && style.top) {
                var left = Number.parseInt(style.left.substring(0, style.left.length - 2));
                var top = Number.parseInt(style.top.substring(0, style.top.length - 2));
                setWidgetPos(left, top); // 防止窗口大小变化时人物消失
            }
        });
    },

    interact: function () {
        if (this.isPlayingVoice || this.animationQueue.length > 0 || !this.isIdle()) {
            console.warn("互动过于频繁！");
        } else {
            this.lastInteractTime = Date.now();
            this.playAllAnimations(this.getAnimationList("interact"));
            this.playVoice(this.getVoice("interact"));
        }
    },

    getUrl: function (file) {
        return this.config.urlPrefix + file;
    },

    getAnimationList: function (behaviorName) {
        var behavior = this.config.behaviors[behaviorName];
        if (behaviorName == "start" || behaviorName == "idle") {
            return [{
                name: behavior.animation,
                loop: false
            }];
        }
        return behavior.animations.slice(); // 拷贝一份，防止外部修改
    },

    getVoice: function (behaviorName) {
        var behavior = this.config.behaviors[behaviorName];
        if (behaviorName == "start" || behaviorName == "idle") {
            return {
                voice: behavior.voice,
                text: behavior.text
            };
        }
        return behavior.voices[Math.floor(Math.random() * behavior.voices.length)];
    },

    playAllAnimations: function (animations) {
        if (Array.isArray(animations)) {
            this.playAllAnimations(animations.shift());
            animations.forEach(a => this.animationQueue.push(a)); // 加入播放队列
        } else if (animations) {
            // this.widget.setAnimation 会先重置人物的姿势，让动画切换不连贯
            this.widget.state.setAnimation(0, animations.name, animations.loop);
        }
    },

    playVoice: function (voice) {
        if (voice) {
            this.isPlayingVoice = true;
            this.voicePlayer.src = this.getUrl(voice.voice);
            this.voicePlayer.load();
            this.voicePlayer.play().then(() => {
                this.voiceText.innerHTML = voice.text;
                this.voiceText.scrollTo(0, 0); // 立刻滑动至最上方
                this.voiceText.style.opacity = 1;
            }, reason => {
                this.isPlayingVoice = false;
                console.error(`无法播放音频，因为：${reason}`);
            });

        }
    },

    isIdle: function () {
        return this.widget.state.tracks[0].animation.name == this.getAnimationList("idle")[0].name;
    },

    tryPlayingIdleVoice: function () {
        var time = Date.now();
        var delta = time - this.lastInteractTime;
        var hour = Math.floor(delta / 1000 / 60 / 60);
        var minute = Math.floor(delta / 1000 / 60 - hour * 60);

        if (minute >= this.config.behaviors.idle.maxMinutes) {
            this.lastInteractTime = time;
            this.playVoice(this.getVoice("idle"));
        }
    }
};