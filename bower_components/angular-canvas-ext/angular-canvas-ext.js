/** @license
 * Angular Canvas Extensions - AngularJS module
 *
 * Allows to open images in canvas, zoom, pan, crop, resize and download image.
 * 
 * https://github.com/petalvlad/angular-canvas-ext
 * 
 * Copyright (c) 2014 Alex Petropavlovsky <petalvlad@gmail.com>
 * Released under the MIT license
 */
var canvasExtModule = angular.module('ap.canvas.ext', []);
canvasExtModule.factory('apBrowserHelper', function () {
  var uagent = navigator.userAgent.toLowerCase(), browser = {}, platform = {};
  platform.ios = /iphone|ipad|ipod/.test(uagent);
  platform.ipad = /ipad/.test(uagent);
  platform.android = /android/.test(uagent);
  platform.blackberry = /blackberry/.test(uagent);
  platform.windowsPhone = /iemobile/.test(uagent);
  platform.mobile = platform.ios || platform.android || platform.blackberry || platform.windowsPhone;
  platform.desktop = !platform.mobile;
  browser.firefox = /mozilla/.test(uagent) && /firefox/.test(uagent);
  browser.chrome = /webkit/.test(uagent) && /chrome/.test(uagent);
  browser.safari = /applewebkit/.test(uagent) && /safari/.test(uagent) && !/chrome/.test(uagent);
  browser.opera = /opera/.test(uagent);
  browser.msie = /msie/.test(uagent);
  browser.version = '';
  if (!(browser.msie || browser.firefox || browser.chrome || browser.safari || browser.opera)) {
    if (/trident/.test(uagent)) {
      browser.msie = true;
      browser.version = 11;
    }
  }
  if (browser.version === '') {
    for (x in browser) {
      if (browser[x]) {
        browser.version = uagent.match(new RegExp('(' + x + ')( |/)([0-9]+)'))[3];
        break;
      }
    }
  }
  return {
    browser: browser,
    platform: platform
  };
});canvasExtModule.factory('apImageHelper', function (apBrowserHelper) {
  var browser = apBrowserHelper.browser, platform = apBrowserHelper.platform;
  function downloadImageHandler(imageDataURI, filename, event) {
    var dataURI = imageDataURI;
    function prevent() {
      event.preventDefault();
      return false;
    }
    if (!dataURI) {
      return prevent();
    }
    if (platform.ios) {
      window.win = open(dataURI);
      return prevent();
    }
    if (browser.msie) {
      var blob = dataURItoBlob(dataURI);
      window.navigator.msSaveOrOpenBlob(blob, filename);
      return prevent();
    }
    var type = mimetypeOfDataURI(dataURI);
    dataURI = dataURI.replace(type, 'image/octet-stream');
    event.target.href = dataURI;
    event.target.download = filename;
    return true;
  }
  function mimetypeOfDataURI(dataURI) {
    return dataURI.split(',')[0].split(':')[1].split(';')[0];
  }
  function dataURItoBlob(dataURI) {
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
      byteString = atob(dataURI.split(',')[1]);
    } else {
      byteString = unescape(dataURI.split(',')[1]);
    }
    var mimeString = mimetypeOfDataURI(dataURI);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }
  function fileToImageDataURI(file, type, quality, callback) {
    if (!type) {
      type = file.type;
    }
    var imgSrc = URL.createObjectURL(file);
    if (imgSrc && imgSrc !== '') {
      var image = new Image();
      image.onload = function () {
        if (platform.ios) {
          getImageExifOrientation(image, function (orientation) {
            var fixOptions = { orientation: orientation };
            fixImage(image, fixOptions, function (target) {
              callback(canvasToDataURI(target, type, quality));
            });
          });
        } else {
          var ctx = createCanvasContext(image.width, image.height);
          ctx.drawImage(image, 0, 0);
          callback(canvasToDataURI(ctx.canvas, type, quality));
        }
      };
      image.src = imgSrc;
    } else {
      callback(null);
    }
  }
  function getImageExifOrientation(image, callback) {
    EXIF.getData(image, function () {
      callback(EXIF.getTag(image, 'Orientation'));
    });
  }
  function createCanvasContext(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext('2d');
  }
  function fixImage(image, fixOptions, callback) {
    var mpImg = new MegaPixImage(image), canvas = createCanvasContext(image.width, image.height).canvas;
    mpImg.onrender = function (target) {
      callback(target);
    };
    mpImg.render(canvas, fixOptions);
  }
  function copyImageData(ctx, src) {
    var dst = ctx.createImageData(src.width, src.height);
    if (dst.data.set) {
      dst.data.set(src.data);
    } else {
      var srcData = src.data, dstData = dst.data;
      for (var i = 0; i < srcData.length; ++i) {
        dstData[i] = srcData[i];
      }
    }
    return dst;
  }
  function cropImage(image, size, offset) {
    var frame = {
        size: size,
        origin: {
          x: image.width / 2 - size.width / 2 - offset.x,
          y: image.height / 2 - size.height / 2 - offset.y
        }
      };
    return cropImage(image, frame);
  }
  function cropImage(image, frame, maxSize, type, quality) {
    if (!image || !(image instanceof Image) && !(image instanceof ImageData) && !(image instanceof HTMLCanvasElement)) {
      return null;
    }
    var ctx = createCanvasContext(frame.size.width, frame.size.height), imageHalfWidth = image.width / 2, imageHalfHeight = image.height / 2, newImageHalfWidth = frame.size.width / 2, newImageHalfHeight = frame.size.height / 2, left = frame.origin.x, top = frame.origin.y;
    if (image instanceof ImageData) {
      var srcCtx = createCanvasContext(image.width, image.height);
      srcCtx.putImageData(image, 0, 0);
      image = srcCtx.canvas;
    }
    ctx.drawImage(image, left, top, frame.size.width, frame.size.height, 0, 0, frame.size.width, frame.size.height);
    if (maxSize && (frame.size.width > maxSize.width || frame.size.height > maxSize.height)) {
      return resizeImage(ctx.canvas, maxSize, type, quality);
    }
    return canvasData(ctx, type, quality);
  }
  function resizeImage(image, size, type, quality, fill) {
    if (!image || !(image instanceof Image) && !(image instanceof ImageData) && !(image instanceof HTMLCanvasElement)) {
      return null;
    }
    var widthScale = size.width / image.width, heightScale = size.height / image.height, scale = fill ? Math.max(widthScale, heightScale) : Math.min(widthScale, heightScale), size = {
        width: image.width * scale,
        height: image.height * scale
      };
    var dstCtx = createCanvasContext(size.width, size.height);
    if (image instanceof ImageData) {
      var srcCtx = createCanvasContext(image.width, image.height);
      srcCtx.putImageData(image, 0, 0);
      image = srcCtx.canvas;
    }
    dstCtx.drawImage(image, 0, 0, dstCtx.canvas.width, dstCtx.canvas.height);
    return canvasData(dstCtx, type, quality);
  }
  function getImageOffsetLimits(image, scale, size) {
    var imageHalfWidth = image.width / 2, imageHalfHeight = image.height / 2, boundsHalfWidth = size.width / 2, boundsHalfHeight = size.height / 2, scaledBoundsHalfWidth = boundsHalfWidth / scale, scaledBoundsHalfHeight = boundsHalfHeight / scale;
    return {
      left: -imageHalfWidth + scaledBoundsHalfWidth,
      right: imageHalfWidth - scaledBoundsHalfWidth,
      top: -imageHalfHeight + scaledBoundsHalfHeight,
      bottom: imageHalfHeight - scaledBoundsHalfHeight
    };
  }
  function drawImage(image, scale, offset, ctx) {
    var imageHalfWidth = image.width / 2, imageHalfHeight = image.height / 2, canvasHalfWidth = ctx.canvas.width / 2, canvasHalfHeight = ctx.canvas.height / 2, beforeScaleOffset = {
        x: (-imageHalfWidth + offset.x) * scale,
        y: (-imageHalfHeight + offset.y) * scale
      }, afterScaleOffset = {
        x: canvasHalfWidth / scale,
        y: canvasHalfHeight / scale
      };
    ctx.canvas.width = ctx.canvas.width;
    // move center to the left and top corner
    ctx.translate(beforeScaleOffset.x, beforeScaleOffset.y);
    // scale
    ctx.scale(scale, scale);
    // move center back to the center
    ctx.translate(afterScaleOffset.x, afterScaleOffset.y);
    // draw image in original size
    ctx.drawImage(image, 0, 0, image.width, image.height);
    // return frame of cropped image
    return {
      size: {
        width: ctx.canvas.width / scale,
        height: ctx.canvas.height / scale
      },
      origin: {
        x: imageHalfWidth - canvasHalfWidth / scale - offset.x,
        y: imageHalfHeight - canvasHalfHeight / scale - offset.y
      }
    };
  }
  function snapImage(image, size, scale, offset) {
    var ctx = createCanvasContext(size.width, size.height);
    drawImage(image, scale, offset, ctx);
    return canvasData(ctx);
  }
  function canvasToDataURI(canvas, type, quality) {
    if (!type) {
      type = 'image/jpg';
    }
    if (!quality) {
      quality = 1;
    }
    return canvas.toDataURL(type, quality);
  }
  function canvasData(ctx, type, quality) {
    return {
      dataURI: canvasToDataURI(ctx.canvas, type, quality),
      imageData: ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    };
  }
  return {
    downloadImageHandler: downloadImageHandler,
    dataURItoBlob: dataURItoBlob,
    fileToImageDataURI: fileToImageDataURI,
    copyImageData: copyImageData,
    cropImage: cropImage,
    resizeImage: resizeImage,
    getImageOffsetLimits: getImageOffsetLimits,
    drawImage: drawImage
  };
});
canvasExtModule.directive('apCanvas', function (apImageHelper) {
  return {
    restrict: 'A',
    scope: {
      src: '=',
      scale: '=?',
      offset: '=?',
      zoomable: '=?',
      mode: '=?',
      image: '=?',
      frame: '=?'
    },
    link: function ($scope, element, attrs) {
      var canvas = element[0], ctx = canvas.getContext('2d'), previousMousePosition = null, isMoving = false, defaultScale = 1, isUpdateOffset = false, isUpdateScale = false, lastZoomDist = null;
      if (!$scope.scale) {
        $scope.scale = defaultScale;
      }
      if (!$scope.offset) {
        $scope.offset = {
          x: 0,
          y: 0
        };
      }
      if (!$scope.mode) {
        $scope.mode = 'fill';
      }
      $scope.$watch(function () {
        return $scope.src;
      }, function (newSrc) {
        console.log('new src ' + newSrc);
        if (newSrc) {
          loadImage();
        } else {
          $scope.image = null;
        }
      });
      function loadImage() {
        var image = new Image();
        image.onload = function () {
          $scope.image = image;
          $scope.$apply();
        };
        image.src = $scope.src;
      }
      $scope.$watch(function () {
        return $scope.image;
      }, function (newImage) {
        console.log('new image ' + newImage);
        canvas.width = canvas.width;
        if (newImage) {
          updateScale();
          drawImage();
        }
      });
      function setScale(scale) {
        isUpdateScale = true;
        $scope.scale = scale;
        isUpdateScale = false;
      }
      function updateScale() {
        var image = $scope.image, widthScale = canvas.width / image.width, heightScale = canvas.height / image.height;
        if ($scope.mode === 'fill') {
          defaultScale = Math.max(widthScale, heightScale);
        } else if ($scope.mode === 'fit') {
          defaultScale = Math.min(widthScale, heightScale);
        } else {
          defaultScale = 1;
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
          }, offsetLimits = apImageHelper.getImageOffsetLimits($scope.image, $scope.scale, bounds);
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
            };
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
            var touch1 = e.targetTouches[0], touch2 = e.targetTouches[1];
            if (touch1 && touch2) {
              zoom(e, touch1, touch2);
            }
          } else {
            moveTo(e, e.changedTouches[0]);
          }
        }
        function handleMouseWheel(e) {
          if (e.wheelDelta > 0) {
            $scope.scale *= 1.01;
          } else {
            $scope.scale /= 1.01;
          }
        }
        canvas.addEventListener('mousedown', handleMouseDown, false);
        canvas.addEventListener('mouseup', handleMouseUp, false);
        canvas.addEventListener('mouseleave', handleMouseUp, false);
        canvas.addEventListener('mousemove', handleMouseMove, false);
        canvas.addEventListener('mousewheel', handleMouseWheel, false);
        canvas.addEventListener('touchstart', handleTouchStart, false);
        canvas.addEventListener('touchend', handleTouchEnd, false);
        canvas.addEventListener('touchcancel', handleTouchEnd, false);
        canvas.addEventListener('touchleave', handleTouchEnd, false);
        canvas.addEventListener('touchmove', handleTouchMove, false);
        $scope.$watch(function () {
          return $scope.scale;
        }, function (newScale, oldScale) {
          if (newScale < defaultScale) {
            setScale(defaultScale);
          }
          drawImage();
        });
        $scope.$watch(function () {
          return $scope.offset;
        }, function (newOffset) {
          drawImage();
        });
      }
    }
  };
});canvasExtModule.directive('apFileSrc', function (apImageHelper) {
  return {
    restrict: 'A',
    scope: {
      src: '=apFileSrc',
      onImageSelected: '&?',
      onImageReady: '&?',
      mimeType: '=?',
      quality: '=?'
    },
    link: function ($scope, element, attrs) {
      var updateImageSrc = function (src) {
        console.log('new src ' + src);
        $scope.src = src;
        $scope.$apply();
        if ($scope.onImageReady) {
          $scope.onImageReady();
        }
      };
      element.bind('change', function (e) {
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