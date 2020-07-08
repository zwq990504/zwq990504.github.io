/**
	game.js
	处理模型、运动、命中检测
**/

var MyGame = function() {

	var ACCEL = 150;			// 加速
	var MAX_SPEED_ACCEL = 200;	// 最大速度
	var START_MAX_SPEED = 700;	// 初始最大速度
	var FINAL_MAX_SPEED = 1500; // 结束最大速度
	var SIDE_ACCEL = 300;		// 侧面加速度
	var MAX_SIDE_SPEED = 1500;	// 最大侧面加速度
	var TREE_COLS = [0x1ABC9C,0xF4D03F,0x82E0AA];	// 树的几种颜色
	var TREE_COUNT = 5;		// 树数量
	var GEM_COUNT = 3;		// 宝石数量
	var FLOOR_RES = 20;		// 地板资源
	var FLOOR_YPOS = -300;	// 地板Y位置
	var FLOOR_THICKNESS = 300;	// 地板厚度

	var stepCount = 0;
	var moveSpeed = 0; 	// 每秒z移动距离
	var maxSpeed; 		// 随时间增加
	var slideSpeed = 0;	// 滑动速度

	var rightDown = false;		// 往右移动
	var leftDown = false;		// 往左移动
	var playing = false;		// 游戏中
	var acceptInput = true;		//
	var clock;					// 时钟

	var trees = [];

	var moverGroup;		// 移动组
	var gemGroup = [];	// 宝石组
	var floorGeometry;	// 地板几何形状
	var treeMaterials;	// 树叶材料
	var trunkMaterial;	// 树干材料
	var treeGeom;		// 树叶几何
	var trunkGeom;		// 树干几何


	var car;
	function init(){


		clock = new THREE.Clock();

		//灯光

		// 半球光
		var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.6);
		//MyMain.getScene().add( hemisphereLight );
		hemisphereLight.position.y = 300;

		// 中间光
		var centerLight = new THREE.PointLight( 0xFFFFFF, 0.8, 4500 );
		MyMain.getScene().add(centerLight);
		centerLight.position.z = MyConfig.FLOOR_DEPTH/4;
		centerLight.position.y = 500;

		// 车前灯
		var frontLight = new THREE.PointLight( 0xFFFFFF, 1, 2500 );
		 MyMain.getScene().add(frontLight);
		frontLight.position.z = MyConfig.FLOOR_DEPTH/2;

		// 移动组
		moverGroup = new THREE.Object3D();
		MyMain.getScene().add( moverGroup );

		// 创建地板组
		var floorGroup = new THREE.Object3D();

		// 地板材质
		var floorMaterial = new THREE.MeshLambertMaterial({
			color: 0xCCCCCC,
			emissive: 0x000000,		// 放射光颜色
			flatShading: true,		// 平面着色
			side: THREE.BackSide	// 渲染背面
		});

		// 地板几何
		floorGeometry = new THREE.PlaneGeometry( MyConfig.FLOOR_WIDTH + 1200, MyConfig.FLOOR_DEPTH , FLOOR_RES,FLOOR_RES );
		// 地板网格
		var floorMesh = new THREE.Mesh( floorGeometry, floorMaterial );	// 地板
		floorGroup.add( floorMesh );
		moverGroup.add( floorGroup );

		floorMesh.rotation.x = Math.PI/2;
		floorGroup.position.y = FLOOR_YPOS;
		moverGroup.position.z = - MyConfig.MOVE_STEP;
		floorGroup.position.z = 500;

		// 创建树
		var i;
		treeMaterials = [];	// 树叶材质组

		// 有几种颜色就创建几种树叶材质
		for(  i= 0; i < TREE_COLS.length; i++) {

			var treeMaterial = new THREE.MeshLambertMaterial({
				color: TREE_COLS[i],
				flatShading: true,		// 平面着色
			});
			treeMaterials.push(treeMaterial);
		}

		trunkMaterial = new THREE.MeshLambertMaterial({
				color: 0x330000,			// 颜色
				flatShading: true,		// 平面着色
			});


		//	创建圆柱体(顶部半径,底部半径, 高度,
		// 侧面周围的分段数, 侧面沿着其高度的分段数,
		// 圆锥的底面是开放的还是封顶的)
		trunkGeom = new THREE.CylinderGeometry(50, 50, 700, 8, 1, false);
		treeGeom = new THREE.CylinderGeometry(0, 250, 800, 8, 1, false);

		var tree;
		for( i = 0; i < TREE_COUNT; i++) {

			var scl = ATUtil.randomRange(0.8,1.3); // 0.8~1.5 树的大小
			var matID = i%TREE_COLS.length;		// 随机颜色
			tree = makeTree(scl,matID);
			moverGroup.add( tree );
			tree.posi = Math.random();
			tree.posj = Math.random();
			tree.position.x = tree.posj * MyConfig.FLOOR_WIDTH - MyConfig.FLOOR_WIDTH/2;
			tree.position.z = - (tree.posi * MyConfig.FLOOR_DEPTH) + MyConfig.FLOOR_DEPTH/2;
			tree.rotation.y = Math.random()*Math.PI*2;
			trees.push(tree);
			tree.collided = false;
		}

		// 边缘的树

		// 右边
		var EDGE_TREE_COUNT = 12;	// 边缘树数量
		for( i = 0; i < EDGE_TREE_COUNT; i++) {
			tree = makeTree(1.3,0);		//树的大小，第一个颜色
			moverGroup.add( tree );
			tree.position.x = MyConfig.FLOOR_WIDTH/2 + 300;
			tree.position.z = MyConfig.FLOOR_DEPTH * i/EDGE_TREE_COUNT -  MyConfig.FLOOR_DEPTH/2;

		}

		// 左边
		for( i = 0; i < EDGE_TREE_COUNT; i++) {
			tree = makeTree(1.3,0);
			moverGroup.add( tree );
			tree.position.x = -(MyConfig.FLOOR_WIDTH/2 + 300);
			tree.position.z = MyConfig.FLOOR_DEPTH * i/EDGE_TREE_COUNT -  MyConfig.FLOOR_DEPTH/2;
		}


		// 宝石组
		for( i = 0; i < GEM_COUNT; i++) {

			var gemMaterial = new THREE.MeshPhongMaterial({
				color: 0xFF0000,
				specular: 0x00FFFF,		// 材质的高光颜色
				emissive: 0x0000FF,		// 发射光
				shininess: 40,				// 高亮的程度
				flatShading: true,		// 平面着色
			});

			// 四面几何体 （半径，增加的顶点数）
			var gemGeom = new THREE.TetrahedronGeometry(100, 2);

			var gem = new THREE.Object3D();
			gem = new THREE.Mesh( gemGeom, gemMaterial );

			moverGroup.add( gem );

			gem.position.x = ATUtil.randomRange(-MyConfig.FLOOR_WIDTH/2, MyConfig.FLOOR_WIDTH/2);
			gem.position.z = ATUtil.randomRange(-MyConfig.FLOOR_DEPTH/2, MyConfig.FLOOR_DEPTH/2);

			// 宝石光  点光源（颜色，强度，距离）
			var gemLight = new THREE.PointLight( 0xFF00FF, 1.0, 600 );
			gem.add( gemLight );

			gem.collided = false;

			gemGroup.push( gem );
		}





		car = new THREE.Object3D();
		//加载模型
		THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );
		var loader = new THREE.OBJMTLLoader();
		loader.load( 'res/obj/car.obj', 'res/obj/car.mtl', function ( object ) {
			object.position.y =  -50;
			object.position.x =  100;
			object.position.z =  3400;
			car = object;
			MyMain.getScene().add( car );

		} );


		MySnow.init();

		setFloorHeight();

		resetField();

		clock.start();
		maxSpeed = START_MAX_SPEED;

	}


	// 制造树
	function makeTree(scale,materialID){

		var tree = new THREE.Object3D();
		var branches = new THREE.Mesh( treeGeom, treeMaterials[materialID] );
		var trunk =   new THREE.Mesh( trunkGeom, trunkMaterial );
		tree.add( branches );
		tree.add( trunk );
		trunk.position.y =  -700;
		tree.scale.x = tree.scale.z = tree.scale.y = scale;
		tree.myheight = 1400 * tree.scale.y;
		//把树放在地板上
		tree.position.y =  tree.myheight/2 - 300;
		return tree;
	}

	function setFloorHeight(){

		//moverGroup向后移动
		stepCount++;
		moverGroup.position.z = - MyConfig.MOVE_STEP;

		//刷新树
		for(  i = 0; i < TREE_COUNT; i++) {

			var tree = trees[i];
			tree.position.z +=MyConfig.MOVE_STEP;

			if (tree.position.z + moverGroup.position.z > MyConfig.FLOOR_DEPTH/2){

				tree.collided = false;
				tree.position.z	-= MyConfig.FLOOR_DEPTH;
				//x位置随机
				tree.posj = Math.random();
				tree.position.x = tree.posj * MyConfig.FLOOR_WIDTH - MyConfig.FLOOR_WIDTH/2;
				tree.visible = true;
			}

		}

		MySnow.shift();

		// 变换宝石

		for(  i = 0; i < GEM_COUNT; i++) {

			var gem = gemGroup[i];
			gem.position.z +=MyConfig.MOVE_STEP;

			if (gem.position.z + moverGroup.position.z > MyConfig.FLOOR_DEPTH/2){
				gem.collided = false;
				gem.position.z	-= MyConfig.FLOOR_DEPTH;
				//重新随机化x位置
				gem.posj = Math.random();
				var xRange = MyConfig.FLOOR_WIDTH/2 * 0.7;
				gem.position.x = ATUtil.randomRange(-xRange,xRange);

			}

		}
	}

	function animate() {


		var i;

		var delta = clock.getDelta();

		//PLAYER MOVEMENT
		if (playing){

			//最大速度缓慢加速
			maxSpeed += delta *MAX_SPEED_ACCEL;
			maxSpeed = Math.min(maxSpeed,FINAL_MAX_SPEED);

			//移动速度加快
			moveSpeed += delta *ACCEL;
			moveSpeed = Math.min(moveSpeed,maxSpeed);
			// console.log(moveSpeed);

			// 如果同时按住左右，会往右边移动
			if (rightDown){		// 往右移动
				slideSpeed += SIDE_ACCEL;	// 滑行速度加快 变成正数
				slideSpeed = Math.min(slideSpeed,MAX_SIDE_SPEED);

			} else if (leftDown){	// 往左
				slideSpeed -= SIDE_ACCEL;	// 滑行速度减慢 变成负数
				slideSpeed = Math.max(slideSpeed,-MAX_SIDE_SPEED);

			}else{
				slideSpeed *= 0.8;
			}


			//从轨道边缘反弹
			var nextx = MyMain.getCamera().position.x + delta * slideSpeed;

			if (nextx > MyConfig.FLOOR_WIDTH/2 || nextx < -MyConfig.FLOOR_WIDTH/2){
				slideSpeed = -slideSpeed;			// 滑行速度为反
				MyMain.playCollide();	// 撞击音乐
			}

			// 左右滑行
			MyMain.getCamera().position.x += delta * slideSpeed;
			car.position.x += delta * slideSpeed;

			// 旋转
			//moverGroup.rotation.z = 0.016 * slideSpeed * 0.003;
			moverGroup.rotation.z = slideSpeed * 0.000038;
			car.rotation.z = slideSpeed * 0.000038;

		}else{
			//死后慢下来
			moveSpeed *= 0.5;

		}

		// 宝石旋转
		for(  i = 0; i < GEM_COUNT; i++) {
			gemGroup[i].rotation.x += 0.01;
			gemGroup[i].rotation.y += 0.02;
		}




		// 移动组向外移动
		moverGroup.position.z += delta * moveSpeed;



		if (moverGroup.position.z > 0){
			// 新建地板
			setFloorHeight();
		}

		MySnow.animate();

		//简单的命中检测

		if (MyConfig.hitDetect){

			var p;
			var dist;

			var camPos = MyMain.getCamera().position.clone();
			camPos.z -= 200;

			for (var i = 0; i < GEM_COUNT; i++) {
				p = gemGroup[i].position.clone();
				p.y = 0; //忽视高度
				p.add(moverGroup.position);
				dist = p.distanceTo(camPos);

				// 如果宝石和相机的距离<200 200 撞击~ if (dist < && !gemgroup[i].collided){ 得到宝石 gemgroup[i].collided="true;" mymain.onscorepoint(); 加分 } 树的 for( i="0;" tree_count; i++) { p="trees[i].position.clone();" p.y="0;" 忽视树的高度 p.add(movergroup.position); 只有当树在你面前的时候才能撞到它们 (p.z campos.z p.z> camPos.z - 200){

					dist = p.distanceTo(camPos);
					if (dist < 200 && !trees[i].collided ){

						//GAME OVER
						trees[i].collided = true;
						onGameEnd();
					}
				}
			}
		}

	}


	function startGame(isFirstGame){

		acceptInput = false;
		//如果第一场比赛刚开始
		if (isFirstGame){
			startRun();
			return;
		}


	  	// 在设定的时间（或帧）后调用函数
		 TweenMax.delayedCall(0.3,resetField);
		 TweenMax.delayedCall(0.6,startRun);

	}


	// 重置字段
	function resetField(){

		var camPos = MyMain.getCamera().position;
		// 相机x放在中间
		camPos.x = 0;
		car.position.x = 100;
		// 将倾斜设置为0
		slideSpeed = 0;
		moverGroup.rotation.z = 0;
		car.rotation.z = 0;
		// 删掉一开始就太近的树
		for(  i = 0; i < TREE_COUNT; i++) {
			p = trees[i].position.clone();
			p.add(moverGroup.position);

			if (p.z < camPos.z && p.z > camPos.z - MyConfig.FLOOR_DEPTH/2){
				trees[i].collided = true;
				trees[i].visible = false;
			}
		}

	}

	function startRun(){
		playing = true;
		acceptInput = true;
	}

	function onAcceptInput(){
	 	acceptInput = true;
	}

	function onGameEnd(){
		moveSpeed = -1200;
		maxSpeed = START_MAX_SPEED;
		playing = false;
		acceptInput = false;
		// 等待重新启用开始游戏
		TweenMax.delayedCall(1,onAcceptInput);
		MyMain.onGameOver();

	}

	return {
		init:init,
		startGame:startGame,
		animate:animate,
		setRightDown: function (b){rightDown = b;},
		setLeftDown: function (b){leftDown = b;},
		getPlaying: function (){return playing;},
		getMoverGroup:function (){return moverGroup;},
		getSpeed: function() {return moveSpeed/FINAL_MAX_SPEED;},
		resetField:resetField,
		getAcceptInput:function (){return acceptInput;},
	};


}();
</200>