angular.module('app').controller('MainController', function($scope, apImageHelper) {
  $scope.leftCanvas = {
    src: null,
    image: null,
    frame: null,
    scale: null,
    offset: null
  }; 

  $scope.rightCanvas = {
    src: null,
    image: null,
    frame: null,
    scale: null,
    offset: null
  }; 

  $scope.zoomIn = function() {
    $scope.leftCanvas.scale *= 1.2;
  }

  $scope.zoomOut = function() {
    $scope.leftCanvas.scale /= 1.2;
  }

  $scope.crop = function() {
    var canvasData = apImageHelper.cropImage($scope.leftCanvas.image, $scope.leftCanvas.frame, {width: 1500, height: 1500});
    $scope.rightCanvas.src = canvasData.dataURI;
  }

  $scope.download = function($event) {
    var filename = new Date().getTime() + '.png';
    return apImageHelper.downloadImageHandler($scope.rightCanvas.src, filename, $event);    
  }

});