canvasExtModule.directive('apCanvas', function(apImageHelper) {
  return {
    restrict: "A",
    scope: {
      src: "=",
      scale: "=?",
      offset: "=?",
      zoomable: "=?",
      mode: "=?",
      image: "=?",
      frame: "=?"
    },
    link: function($scope, element, attrs) {
      var canvas = element[0],
          ctx = canvas.getContext('2d'),
          previousMousePosition = null,
          isMoving = false,
          defaultScale = 0.0,
          isUpdateOffset = false,
          isUpdateScale = false,
          lastZoomDist = null;

      if (!$scope.offset) {
        $scope.offset = {
          x: 0.0,
          y: 0.0
        };
      }

      if (!$scope.mode) {
        $scope.mode = 'fill';
      }

      $scope.$watch(function() {
        return $scope.src;
      }, function(newSrc) {
        console.log('new src ' + newSrc);
        if (newSrc) {
          loadImage();
        } else {
          $scope.image = null;
        }
      });

      function loadImage() {
        var image = new Image();
        image.onload = function() {
          $scope.image = image;
          $scope.$apply();
        };
        image.src = $scope.src;
      }

      $scope.$watch(function() {
        return $scope.image;
      }, function(newImage, oldImage) {
        console.log('new image ' + newImage);
        canvas.width = canvas.width;
        if (newImage) {
          if (oldImage || !$scope.scale) {
            updateScale();  
          }
          drawImage();
        }
      });

      function setScale(scale) {
        isUpdateScale = true;
        $scope.scale = scale;
        isUpdateScale = false;
      }

      function updateScale() {
        
        var image = $scope.image,
            widthScale = canvas.width / image.width,
            heightScale = canvas.height / image.height;
        if ($scope.mode === 'fill') {
          defaultScale = Math.max(widthScale, heightScale);
        }
        else if ($scope.mode === 'fit') {
          defaultScale = Math.min(widthScale, heightScale);
        }
        else {
          defaultScale = 1.0;
        }

        setScale(defaultScale);
      }

      function drawImage() {
        if (!$scope.image || isUpdateScale || isUpdateOffset) {
          return;
        }        
        clipToBounds();
        $scope.frame = apImageHelper.drawImage($scope.image, $scope.scale, $scope.offset, ctx);        
      }

      function clipToBounds() {
        isUpdateOffset = true;
        var bounds = {
              width: canvas.width, 
              height: canvas.height
            },
            offsetLimits = apImageHelper.getImageOffsetLimits($scope.image, $scope.scale, bounds);

        if ($scope.offset.y < offsetLimits.top) {
          $scope.offset.y = offsetLimits.top;
        }
        
        if ($scope.offset.y > offsetLimits.bottom) {
          $scope.offset.y = offsetLimits.bottom;
        }
        
        if ($scope.offset.x < offsetLimits.left) {
          $scope.offset.x = offsetLimits.left;
        }
        
        if ($scope.offset.x > offsetLimits.right) {
          $scope.offset.x = offsetLimits.right;
        }
        isUpdateOffset = false;
      }
      
      if ($scope.zoomable) {
        
        function getMousePosition(e) {
          var rect = canvas.getBoundingClientRect();
          return {
            x: (e.clientX - rect.left) / $scope.scale,
            y: (e.clientY - rect.top) / $scope.scale
          };
        }

        function setIsMoving(moving, event, position) {
          event.preventDefault();
          isMoving = moving;
          if (moving) {
            previousMousePosition = getMousePosition(position);  
          }
        }

        function moveTo(e, position) {
          if (isMoving) {
            e.preventDefault();
            var mousePosition = getMousePosition(position);
            $scope.offset = {
              x: $scope.offset.x + (mousePosition.x - previousMousePosition.x),
              y: $scope.offset.y + (mousePosition.y - previousMousePosition.y)
            }
            previousMousePosition = mousePosition;
            $scope.$apply(); 
          }
        }

        function zoom(e, touch1, touch2) {
          e.preventDefault();            
          var dist = Math.sqrt(Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2));
          if (lastZoomDist) {
            $scope.scale *= dist / lastZoomDist;            
            $scope.$apply(); 
          }
          lastZoomDist = dist;
        }

        function handleMouseDown(e) {
          setIsMoving(true, e, e);
        }

        function handleTouchStart(e) {
          if (e.targetTouches.length === 1) {
            setIsMoving(true, e, e.changedTouches[0]);  
          }
        }

        function handleMouseUp(e) {
          setIsMoving(false, e);
        }

        function handleTouchEnd(e) {
          lastZoomDist = null;
          setIsMoving(false, e);
        }

        function handleMouseMove(e) {
          moveTo(e, e);                 
        }
        
        function handleTouchMove(e) {
          if (e.targetTouches.length >= 2) {
            var touch1 = e.targetTouches[0],
                touch2 = e.targetTouches[1];
            if (touch1 && touch2) {
              zoom(e, touch1, touch2);              
            }  
          }          
          else {
            moveTo(e, e.changedTouches[0]);             
          }
        }

        function handleMouseWheel(e) {
          if (e.wheelDelta > 0) {
            $scope.scale *= 1.01;
          }
          else {
            $scope.scale /= 1.01;
          }          
        }

        canvas.addEventListener('mousedown', handleMouseDown, false);
        canvas.addEventListener('mouseup', handleMouseUp, false);
        canvas.addEventListener('mouseleave', handleMouseUp, false);
        canvas.addEventListener('mousemove', handleMouseMove, false);
        canvas.addEventListener('mousewheel', handleMouseWheel, false);

        canvas.addEventListener("touchstart", handleTouchStart, false);
        canvas.addEventListener("touchend", handleTouchEnd, false);
        canvas.addEventListener("touchcancel", handleTouchEnd, false);
        canvas.addEventListener("touchleave", handleTouchEnd, false);
        canvas.addEventListener("touchmove", handleTouchMove, false);

        $scope.$watch(function() {
          return $scope.scale;
        }, function(newScale, oldScale) {
          if (newScale && newScale < defaultScale) {
            setScale(defaultScale);            
          }
          drawImage();  
        });

        $scope.$watch(function() {
          return $scope.offset;
        }, function(newOffset) {
          drawImage();  
        });

      }
    }
  };
});
