/**
	main.js
	处理渲染器、鼠标键盘输入、声音的控制、调整大小、分数显示
**/

//全局配置
var MyConfig = {

	//调试切换
	playSound:true,
	playMusic:true,
	hitDetect:true,

	//常量
	FLOOR_WIDTH: 4200, 	// x方向地板尺寸
	FLOOR_DEPTH: 7200, 	// y方向地板尺寸
	MOVE_STEP: 500 		// 重新创建新地板条之前移动的z距离

};

var MyMain = function() {

	//三要素： 场景 相机 渲染器  , 利用渲染器渲染 场景and相机，放到canvas中
	var camera, scene, renderer;

	var hiScore = 0;		// 历史最好分数
	var score = 0;			// 分数

	var sndPickup;			// 捡宝石
	var sndCollide;			// 碰撞
	var sndMusic;			// 音乐

	var lastEvent;
	var stats;
	var splashSize;

	var backgroundColor = 0x061837;	//背景颜色


	var splashMode = 0; //0->2 不同界面
	var isFirstGame = true;


	// 初始化函数
	function init() {

		// Zepto.js 移动端的小型 jQuery
		// 教程 https://github.com/goldfire/howler.js#documentation
		// 注册事件
		$("#container").on( 'touchstart', onTouchStart, false );	// 开始
		$("#container").on( 'touchend', onTouchEnd, false );		// 结束

		$(document).on('keydown', onKeyDown, false);
		$(document).on('keyup', onKeyUp, false);
		$("#splash").on('mousedown', onMouseDown, false);
		$("#splash").on('tap', onMouseDown, false);


		//注册音乐
		//howler.js音频库  https://www.ctolib.com/howler-js.html
		if (MyConfig.playSound){
			sndPickup = new Howl( {src: ["res/audio/point.mp3"]});
			sndCollide = new Howl({ src: ["res/audio/hit.mp3"]});
			sndBest = new Howl( {src: ["res/audio/best.mp3"]});
		}

		if (MyConfig.playMusic){
			sndMusic = new Howl( {src: ["res/audio/rouet.mp3"],loop: true});	 // loop循环开启
			$("#music-toggle").on("click",toggleMusic);
			$("#music-toggle").on("tap",toggleMusic);
		}


		// 初始化 3D
		var size = 800;

		// 创建透视相机 视角fov（看的范围角度），纵横比aspect（窗口宽/窗口高），近平面near，远平面far
		camera = new THREE.PerspectiveCamera( 120, 8 / 6, 1, 10000 );
		camera.position.z = MyConfig.FLOOR_DEPTH/2 - 300;	// 相机往外移一点 才可以看到创建物体~
		camera.position.y = 50;

		// 创建场景
		scene = new THREE.Scene();
		// 雾 （颜色、near、far）
		scene.fog = new THREE.Fog( backgroundColor, MyConfig.FLOOR_DEPTH/2, MyConfig.FLOOR_DEPTH );

		//创建渲染器
		renderer = new THREE.WebGLRenderer();
		// renderer.setSize( window.innerWidth, window.innerHeight );	// 设置渲染器大小
		renderer.setSize( 500, 500 );	// 设置渲染器大小
		renderer.setClearColor( backgroundColor);	// 设置清除的颜色和透明度。
		$("#container").append( renderer.domElement );	// 将渲染输出的 Canvas 对象插入被选元素的结尾

		renderer.render(scene, camera);	// 渲染

		MyGame.init();

		 resize();

		animate();


		//TweenMax.js https://www.tweenmax.com.cn/api/tweenmax/

		//TweenLite.fromTo('div', 5, {opacity:1}, {opacity:0});
		//动画目标：div
		//起始状态：opacity:1
		//终点状态：opacity:0
		//补间：5秒完成状态改变

		TweenMax.fromTo($('#splash') , 1, {autoAlpha: 0},{autoAlpha: 1,delay:1});
		TweenMax.fromTo($('#info') , 1, {autoAlpha: 0},{autoAlpha: 1,delay:1});
		TweenMax.fromTo($('#music-toggle') , 1, {autoAlpha: 0},{autoAlpha: 1,delay:1});

		$("#preloader").css("display","none");

		//预加载初始页面图像
		var img1 = new Image();
		img1.src = "res/img/xmas-splash.png";
		var img2 = new Image();
		img2.src = "res/img/xmas-best.png";
		var img3 = new Image();
		img3.src = "res/img/xmas-wipeout.png";

	}

	function toggleMusic(){

		$(this).toggleClass("off");

		if($(this).hasClass("off")){
			sndMusic.mute(true);
			console.log('开启音乐！');
		}else{
			sndMusic.mute(false);
			console.log('关闭音乐！');
		}

	}

	$(window).resize(function() {
		resize();
	});

	function resize(){

		var w = window.innerWidth;
		var h = window.innerHeight;

		renderer.setSize(w, h);
		camera.aspect = w / h;

		// 适应中心
		splashSize = Math.min(w,h)*0.85;
		splashSize = Math.min(splashSize,500);

		$("#splash").css("width", splashSize + "px");
		$("#splash").css("height", splashSize+ "px");

		$("#splash").css("left",(w - splashSize)/2 + "px");
		$("#splash").css("top",(h - splashSize)/2 + "px");

		// 大小
		if (splashMode === 0){
			$('#prompt-big').css("font-size" , splashSize * 0.06 + "px");
			$('#prompt-small').css("font-size" , splashSize * 0.04 + "px");
		}else if(splashMode == 1){
			$('#prompt-big').css("font-size" , splashSize * 0.09 + "px");
		}else{
			$('#prompt-big').css("font-size" , splashSize * 0.08 + "px");
			$('#prompt-small').css("font-size" , splashSize * 0.04 + "px");
		}

	}

	function playCollide(){
		if (MyConfig.playSound) sndCollide.play();
	}

	function onScorePoint(){
		if (MyConfig.playSound) sndPickup.play();
		score += 1;
		$("#score-text").text(score);
		TweenMax.fromTo($('#score-text') , 0.4, {scale: 2},{scale: 1,ease:Bounce.easeOut});

		if (score === hiScore + 1 && hiScore !== 0){
			if (MyConfig.playSound) sndBest.play();
		}
	}

	function onGameOver(){

		if (MyConfig.playSound) sndCollide.play();

		// 显示分数
		TweenMax.to($('#score-text') , 0.1, {autoAlpha: 0});
		TweenMax.fromTo($('#splash') , 0.5, {scale: 0.6,autoAlpha: 0},{scale: 1,autoAlpha: 1,ease:Expo.easeOut});
		TweenMax.fromTo($('#info') , 0.5, {autoAlpha: 0},{autoAlpha: 1});
		TweenMax.fromTo($('#music-toggle') , 0.5, {autoAlpha: 0},{autoAlpha: 1});

		if (score > hiScore){
			splashMode = 1;
			hiScore = score;
			$('#splash').css('background-image', 'url(res/img/xmas-best.png)');
			$('#prompt-big').text("SCORE: " + score);
			$('#prompt-small').css('display','none');
			$('#prompt-big').css("margin-top" , "10%");

		}else{
			splashMode = 2;
			$('#splash').css('background-image', 'url(res/img/xmas-wipeout.png)');
			$('#prompt-big').text("SCORE: " + score);
			$('#prompt-small').text("BEST SCORE: " + hiScore);
			$('#prompt-small').css('display','block');
			$('#prompt-big').css("margin-top" , "8%");
			$('#prompt-small').css("margin-top" , "2%");
		 }

		 resize();
		hueTime =0;

	}

	function onGameStart(){
		TweenMax.to($('#splash') , 0.3, {autoAlpha: 0});
		TweenMax.to($('#info') , 0.3, {autoAlpha: 0});
		TweenMax.to($('#music-toggle') , 0.3, {autoAlpha: 0});
		TweenMax.to($('#score-text') , 0.3, {autoAlpha: 1,delay:0.3});
		score = 0;
		$("#score-text").text(score);

		if (isFirstGame && MyConfig.playMusic ) sndMusic.play();

		MyGame.startGame(isFirstGame);
		isFirstGame = false;
	}

	function animate(){

		requestAnimationFrame( animate );
		MyGame.animate();

		renderer.render(scene, camera);

	}

	//输入处理程序

	function onTouchStart( event ) {

		if (!MyGame.getPlaying() && MyGame.getAcceptInput()){
			onGameStart();
		}

		for(  var i = 0; i <  event.touches.length; i++) {

			event.preventDefault();

			var xpos = event.touches[ i ].pageX;	// x偏移

			if (xpos > window.innerWidth / 2){
				MyGame.setRightDown(true);
			}else{
				MyGame.setLeftDown(true);
			}
		}
	}

	function onTouchEnd( event ) {

		for(  var i = 0; i <  event.changedTouches.length; i++) {

			event.preventDefault();
			var xpos = event.changedTouches[ i ].pageX;

			if (xpos > window.innerWidth / 2){
				MyGame.setRightDown(false);
			}else{
				MyGame.setLeftDown( false);
			}
		}
	}

	function onKeyUp( event ) {

		lastEvent = null;

		switch ( event.keyCode ) {
			case 39: /* RIGHT */
				MyGame.setRightDown(false);
				break;
			case 37: /* LEFT */
				MyGame.setLeftDown(false);
				break;
		}

		//endSlide();
	}

	function onKeyDown(event) {

		if (lastEvent && lastEvent.keyCode == event.keyCode) {
			return;
		}

		lastEvent = event;

		if (!MyGame.getPlaying() && MyGame.getAcceptInput()){
			onGameStart();
		}

		switch ( event.keyCode ) {
			case 39: /* RIGHT */
				MyGame.setRightDown(true);
				break;
			case 37: /* LEFT */
				MyGame.setLeftDown( true);
				break;

		}
	}

	function onMouseDown(){

		if (!MyGame.getPlaying()){
			onGameStart();
		}
	}

	return {
		init:init,
		onGameOver:onGameOver,
		onScorePoint: onScorePoint,
		getScene:function (){return scene;},
		getCamera:function (){return camera;},
		playCollide:playCollide,
	};


}();

$(document).ready(function() {
	MyMain.init();
});
