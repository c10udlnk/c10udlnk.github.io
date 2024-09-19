window.onload = function(){
    var canvas = document.createElement('canvas'),
    context = canvas.getContext('2d'),
    pr = window.devicePixelRatio || 1,
    width = window.innerWidth,
    height = window.innerHeight
    canvas.width = width * pr
    canvas.height = height * pr
    context.scale(pr, pr)
    context.globalAlpha = 0.8
    canvas.style.cssText =
    'opacity:0.8;position:fixed;top:0;left:0;z-index:-1;width:100%;height:100%;pointer-events:none;'
    // create canvas
    document.getElementsByTagName('body')[0].appendChild(canvas);
    // var canvas = document.getElementById("mycanvas");
    // //获取画布的上下文
    // var context =canvas.getContext("2d");
    // var s = window.screen;
    // var W = canvas.width = s.width;
    // var H = canvas.height;
    //获取浏览器屏幕的宽度和高度
    //var W = window.innerWidth;
    //var H = window.innerHeight;
    //设置canvas的宽度和高度
    // canvas.width = W;
    // canvas.height = H;
    //每个文字的字体大小
    var fontSize = 12;
    //计算列
    var colunms = Math.floor(canvas.width /fontSize);  
    //记录每列文字的y轴坐标
    var drops = [];
    //给每一个文字初始化一个起始点的位置
    for(var i=0;i<colunms;i++){
        drops.push(0);
    }
    //运动的文字
    var str ="r3ver5e.4^fun c10udlnk";
    //4:fillText(str,x,y);原理就是去更改y的坐标位置
    //绘画的函数
    function draw(){
        context.fillStyle = "rgba(238,238,238,.09)";//遮盖层
        context.fillRect(0,0,canvas.width,canvas.height);
        //给字体设置样式
        context.font = "600 "+fontSize+"px  Consolas";
        //给字体添加颜色
        context.fillStyle = randColor();//["#33B5E5", "#0099CC", "#AA66CC", "#9933CC", "#99CC00", "#669900", "#FFBB33", "#FF8800", "#FF4444", "#CC0000"][parseInt(Math.random() * 10)];可以rgb,hsl, 标准色，十六进制颜色
        //写入画布中
        for(var i=0;i<colunms;i++){
            var index = Math.floor(Math.random() * str.length);
            var x = i*fontSize;
            var y = drops[i] *fontSize;
            context.fillText(str[index],x,y);
            //如果要改变时间，肯定就是改变每次他的起点
            if(y >= canvas.height && Math.random() > 0.99){
                drops[i] = 0;
            }
            drops[i]++;
        }
    };
    function randColor(){//随机颜色
        var r = Math.floor(Math.random() * 256);
        var g = Math.floor(Math.random() * 256);
        var b = Math.floor(Math.random() * 256);
        return "rgb("+r+","+g+","+b+")";
    }
    draw();
    setInterval(draw,35);
};