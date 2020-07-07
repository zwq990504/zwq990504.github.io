// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet using p5.js
=== */
/* eslint-disable */

// Grab elements, create settings, etc.
var video = document.getElementById('video');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

// The detected positions will be inside an array
let poses = [];

    //访问用户媒体设备的兼容方法
function getUserMedia(constrains,success,error){
    if(navigator.mediaDevices.getUserMedia){
        //最新标准API
        navigator.mediaDevices.getUserMedia(constrains).then(success).catch(error);
        console.log(1);
    } else if (navigator.webkitGetUserMedia){
        //webkit内核浏览器
        navigator.webkitGetUserMedia(constrains).then(success).catch(error);
        console.log(2);
    } else if (navigator.mozGetUserMedia){
        //Firefox浏览器
        navagator.mozGetUserMedia(constrains).then(success).catch(error);
        console.log(3);
    } else if (navigator.getUserMedia){
        //旧版API
        navigator.getUserMedia(constrains).then(success).catch(error);
        console.log(4);
    }
}

//成功的回调函数
function success(stream){
    //兼容webkit内核浏览器
    var CompatibleURL = window.URL || window.webkitURL;
    //将视频流设置为video元素的源
//    video.src = CompatibleURL.createObjectURL(stream);
    try {
        video.srcObject = stream;
    } catch (error) {
        video.src = CompatibleURL.createObjectURL(stream);
    }
    //播放视频
    video.play();
}

//异常的回调函数
function error(error){
    console.log("访问用户媒体设备失败：",error.name,error.message);
}
if (navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia){
    //调用用户媒体设备，访问摄像头
    getUserMedia({
        video:{width:480,height:320}
    },success,error);
} else {
    alert("你的浏览器不支持访问用户媒体设备");
}

// Create a webcam capture
//if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//  navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
//   // video.src = window.URL.createObjectURL(stream);
//    try {
//         video.srcObject = stream;} catch (error) {
//         video.src = window.URL.createObjectURL(stream);}
//    video.play();
//  });
//}

// A function to draw the video and poses into the canvas.
// This function is independent of the result of posenet
// This way the video will not seem slow if poseNet
// is not detecting a position
function drawCameraIntoCanvas() {
  // Draw the video element into the canvas
  ctx.drawImage(video, 0, 0, 640, 480);
  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  drawSkeleton();
  window.requestAnimationFrame(drawCameraIntoCanvas);
}
// Loop over the drawCameraIntoCanvas function
drawCameraIntoCanvas();

// Create a new poseNet method with a single detection
const poseNet = ml5.poseNet(video, 'single', gotPoses);
// You can optionally call it for multiple poses
//const poseNet = new ml5.PoseNet(video, 'multiple', gotPoses);

// A function that gets called every time there's an update from the model
function gotPoses(results) {
  poses = results;
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
      let keypoint = poses[i].pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        if(i==0&&j==0||i==0&&j==9||i==0&&j==10)
            ctx.strokeStyle="#0000ff";
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
        if(i==0&&j==0||i==0&&j==9||i==0&&j==10)
            ctx.strokeStyle="#000000";

      }
    }
  }


}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    // For every skeleton, loop through all body connections
    for (let j = 0; j < poses[i].skeleton.length; j++) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      ctx.beginPath();
      ctx.moveTo(partA.position.x, partA.position.y);
      ctx.lineTo(partB.position.x, partB.position.y);
      ctx.stroke();
    }
  }
}
