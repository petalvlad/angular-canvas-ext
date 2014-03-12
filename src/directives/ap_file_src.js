canvasExtModule.directive('apFileSrc', function(apImageHelper) {
  return {
    restrict: "A",
    scope: {
      src: "=apFileSrc",
      onImageSelected: "&?",
      onImageReady: "&?",
      mimeType: "=?",
      quality: "=?"
    },
    link: function($scope, element, attrs) {
      
      var updateImageSrc = function(src) {
        console.log('new src ' + src);
        $scope.src = src;
        $scope.$apply();
        if ($scope.onImageReady) {
          $scope.onImageReady();  
        }
      };

      element.bind('change', function(e) {
        console.log('file changed');
        if ($scope.onImageSelected) {
          $scope.onImageSelected();  
        }
        
        var file = e.target.files.length ? e.target.files[0] : null;
        if (file) {
          apImageHelper.fileToImageDataURI(file, $scope.mimeType, $scope.quality, updateImageSrc);
        }
      });
    }
  };
});
