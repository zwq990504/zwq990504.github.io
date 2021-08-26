/**
	snow.js
	处理掉下来的雪，天空
**/

var MySnow = function() {

	var SNOW_COUNT = 400;		// 雪数量
	var SNOW_TOP = 1600;		// 雪最高的地方
	var SNOW_BOTTOM = -300;	// 雪最低的地方

	var snowGeometry;				// 天空几何
	var skyMaterial;				// 天空材质


	function init(){


		// 下雪
		snowGeometry = new THREE.Geometry();

		var snowSprite = THREE.ImageUtils.loadTexture( "res/img/snow.png" );

		for ( i = 0; i < SNOW_COUNT; i ++ ) {

			var vertex = new THREE.Vector3();
			vertex.x = ATUtil.randomRange(-MyConfig.FLOOR_WIDTH/2,MyConfig.FLOOR_WIDTH/2);
			vertex.y = ATUtil.randomRange(SNOW_BOTTOM,SNOW_TOP);
			vertex.z = ATUtil.randomRange(-MyConfig.FLOOR_DEPTH/2,MyConfig.FLOOR_DEPTH/2);

			snowGeometry.vertices.push( vertex );

		}

		// 粒子几何
		var snowMaterial = new THREE.PointCloudMaterial( {
			size: 50,								// 大小
			sizeAttenuation: true,	// 点的大小是否因相机深度而衰减。
			map: snowSprite,				// 使用Texture中的数据设置点的颜色
			transparent: true ,			// 此材质是否透明
			depthTest: true,				// 深度检测
			opacity:0.7,						// 材质的透明度
			depthWrite:false				// 渲染此材质是否对深度缓冲区有任何影响
		} );


		var particles = new THREE.PointCloud( snowGeometry, snowMaterial );
		MyGame.getMoverGroup().add( particles );




		// 天空球
		var textureSky = THREE.ImageUtils.loadTexture( "res/img/sky.jpg" );
		skyMaterial = new THREE.MeshBasicMaterial( {
			map: textureSky,
			depthTest: true,
			fog: false,
			side: THREE.DoubleSide,
			transparent: true ,			// 此材质是否透明
			opacity: 0.5
		} );

		var planeGeometry = new THREE.SphereGeometry( 5000,32,32 );
		skyMesh = new THREE.Mesh( planeGeometry, skyMaterial );
		MyMain.getScene().add( skyMesh );
		skyMesh.position.z = 1000;
		skyMesh.position.y = 1000;

	}

  // 刷新
	function shift(){


		for(  i = 0; i < SNOW_COUNT; i++) {

			var vert = snowGeometry.vertices[i];
			vert.z += MyConfig.MOVE_STEP;

			if (vert.z + MyGame.getMoverGroup().position.z > MyConfig.FLOOR_DEPTH/2){
				vert.z	-= MyConfig.FLOOR_DEPTH;
			}

		}
		snowGeometry.verticesNeedUpdate = true;


	}


	function animate(){

		// 循环
		for(  i = 0; i < SNOW_COUNT; i++) {
			var vert = snowGeometry.vertices[i];	// 调取

			// 重力 往下掉
			vert.y -= 3;

			// 到达最低下，刷到最顶上
			if (vert.y < SNOW_BOTTOM){
				vert.y = SNOW_TOP;
			}

		}
		snowGeometry.verticesNeedUpdate = true;
	}

	return {
		init:init,
		animate:animate,
		shift:shift
	};


}();
