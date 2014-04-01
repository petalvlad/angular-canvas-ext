canvasExtModule.factory('apTypeHelper', function() {
  
  function objectType(obj){
    var text = Function.prototype.toString.call(obj.constructor)
    return text.match(/function (.*)\(/)[1]
  }

  function isInstanceOf(value, type) {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return objectType(value) === type;
  }

  function isOneOf(value, types) {
    for (var i = 0; i < types.length; i++) {
      if (isInstanceOf(value, types[i])) {
        return true;
      }
    }
    return false;
  }

  function isNumber(value) {
    return typeof value === 'number';
  }

  return {
    isInstanceOf: isInstanceOf,
    isOneOf: isOneOf,
    isNumber: isNumber
  }
});

canvasExtModule.factory('apPosition', function(apTypeHelper) {
  function APPosition(x, y) {
    this.x = apTypeHelper.isNumber(x) ? x : 0;
    this.y = apTypeHelper.isNumber(y) ? y : 0;
  }

  APPosition.prototype = {
    isValid: function() {
      return apTypeHelper.isNumber(this.x) &&
             apTypeHelper.isNumber(this.y);
    }
  }

  APPosition.defaultPosition = function() {
    return new APPosition();
  }

  return APPosition;
});

canvasExtModule.factory('apSize', function(apTypeHelper) {
  function APSize(width, height) {
    this.width = apTypeHelper.isNumber(width) ? width : 0;
    this.height = apTypeHelper.isNumber(height) ? height : 0;
  }

  APSize.prototype = {
    isValid: function() {
      return apTypeHelper.isNumber(this.width) &&
             apTypeHelper.isNumber(this.height);
    }
  }

  APSize.defaultSize = function() {
    return new APSize();
  }

  return APSize;
});

canvasExtModule.factory('apFrame', function(apTypeHelper, apPosition, apSize) {
  function APFrame(x, y, width, height) {
    this.origin = new apPosition(x, y);
    this.size = new apSize(width, height);
  }

  APFrame.prototype = {
    isValid: function() {
      return this.origin.isValid() &&
             this.size.isValid();
    }
  }

  APFrame.defaultFrame = function() {
    return new APFrame();
  }

  return APFrame;
});


canvasExtModule.factory('apImageHelper', function ($rootScope, $q, apBrowserHelper, apTypeHelper, apPosition, apSize, apFrame) {
  var browser = apBrowserHelper.browser,
      platform = apBrowserHelper.platform;

  function createCanvasContext(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext('2d');
  }

  function imageToImageData(image) {
    var context = createCanvasContext(image.width, image.height);
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  }

  function imageToCanvas(image) {
    var context = createCanvasContext(image.width, image.height);
    context.drawImage(image, 0, 0);
    return context.canvas;
  }

  function sameSizeImages(img1, img2) {
    return img1.width === img2.width && img1.height === img2.height;
  }

  function imagesDifference(img1, img2, tolerance, strict) {
    // if (!apTypeHelper.isOneOf(img1, ['HTMLImageElement', 'ImageData']) || 
    //     !apTypeHelper.isOneOf(img2, ['HTMLImageElement', 'ImageData'])) {
    //   return undefined;  
    // }

    var img1Data = img1 instanceof ImageData ? img1.data : imageToImageData(img1).data,
        img2Data = img2 instanceof ImageData ? img2.data : imageToImageData(img2).data;

    tolerance = apTypeHelper.isNumber(tolerance) || 255 * 0.05;

    var difference = 0;
    for (var i = 0; i < img1Data.length; i++) {
      if (img1Data[i] !== img2Data[i] && 
          Math.abs(img1Data[i] - img2Data[i]) > tolerance) {
        if (strict) {
          return 100;
        }
        difference++;
      }
    }
    var differencePercent = difference * 100 / img1Data.length;
    
    return differencePercent;
  }

  function sameImages(img1, img2, tolerance, treshold, strict) {
    if (!sameSizeImages(img1, img2)) {
      return false;
    }
    treshold = apTypeHelper.isNumber(treshold) ? treshold : 5;
    difference = imagesDifference(img1, img2, tolerance, strict);
    return difference <= treshold;
  }

  function loadImageFromUrl(url) {
    var d = $q.defer();
    var image = new Image();
    image.onload = function() {
      d.resolve(image);
      $rootScope.$apply();
    };
    image.onerror = function() {
      d.resolve(null);
      $rootScope.$apply();
    };
    image.src = url;
    return d.promise;
  }

  function loadImagesFromUrls(urls) {
    var promises = [];
    angular.forEach(urls, function(url, i) {
      promises.push(loadImageFromUrl(url));
    });
    return $q.all(promises);
  }

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
      if (blob && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);  
      }
      return prevent();
    }

    var type = mimetypeOfDataURI(dataURI);
    dataURI = dataURI.replace(type, "image/octet-stream"); 
    event.currentTarget.href = dataURI;
    event.currentTarget.download = filename;
    return true;
  }

  function isImageDataURL(s) {
    var regex = /^\s*data:(image\/[a-z]+);base64,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
    return s && !!s.match(regex);
  }

  function mimetypeOfDataURI(dataURI) {
    if (!isImageDataURL(dataURI)) {
      return null;
    }
    return dataURI.split(',')[0].split(':')[1].split(';')[0];
  }

  function dataURItoBlob(dataURI) {
    if (!isImageDataURL(dataURI)) {
      return null;
    }
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
      byteString = atob(dataURI.split(',')[1]);
    }
    else {
      byteString = unescape(dataURI.split(',')[1]);
    }
        
    var mimeString = mimetypeOfDataURI(dataURI);

    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], {type: mimeString});
  }

  function fileToImageDataURI(file, type, quality, callback) {
    if (!(file instanceof Blob) && !(file instanceof File)) {
      callback(null);
      return;
    }
    if (!type) {
      type = file.type;
    }
    var imgSrc = URL.createObjectURL(file);
    if (imgSrc && imgSrc !== "") {
      var image = new Image();
      image.onload = function () {
        if (platform.ios) {
          getImageOrientation(image, function(orientation) {
            var fixOptions = {               
              orientation: orientation,
              maxWidth: 500, 
              maxHeight: 500
            };
            getCanvasWithFixedImage(image, fixOptions, function(target) {
              callback(canvasToDataURI(target, type, quality));
            });            
          });  
        }
        else {
          var ctx = createCanvasContext(image.width, image.height);
          ctx.drawImage(image, 0, 0);
          callback(canvasToDataURI(ctx.canvas, type, quality));
        }        
      };
      image.src = imgSrc;  
    }
    else {
      callback(null);
    }
  }

  function getImageOrientation(image, callback) {
    EXIF.getData(image, function() {
      callback(EXIF.getTag(image, "Orientation"));
    });
  }

  function getCanvasWithFixedImage(image, fixOptions, callback) {
    var mpImg = new MegaPixImage(image),
        canvas = createCanvasContext(image.width, image.height).canvas;    
    
    mpImg.onrender = function(target) {
      callback(target);
    }

    mpImg.render(canvas, fixOptions);
  }

  function copyImageData(ctx, src) {
    var dst = ctx.createImageData(src.width, src.height);
    if (dst.data.set) {
      dst.data.set(src.data);  
    }
    else {
      var srcData = src.data,
          dstData = dst.data;
      for (var i = 0; i < srcData.length; ++i) {
        dstData[i] = srcData[i];  
      }
    }
    return dst;
  }

  function makeFrame(x, y, width, height) {
    return new apFrame(x, y, width, height);
  }

  function cropImage(image, frame, maxSize, type, quality) {
    if (!image || !frame) {
      return null;
    }
    // if (!apTypeHelper.isOneOf(image, ['HTMLImageElement', 'ImageData', 'HTMLCanvasElement']) ||
    //     !frame || 
    //     !frame.isValid()) {
    //   return null;
    // }

    var ctx = createCanvasContext(frame.size.width, frame.size.height);
    if (image instanceof ImageData) {
      var srcCtx = createCanvasContext(image.width, image.height);
      srcCtx.putImageData(image, 0, 0);
      image = srcCtx.canvas;
    }
    ctx.drawImage(image, frame.origin.x, frame.origin.y, frame.size.width, frame.size.height, 0, 0, frame.size.width, frame.size.height);
    if (maxSize && (frame.size.width > maxSize.width || frame.size.height > maxSize.height)) {
      return resizeImage(ctx.canvas, maxSize, type, quality);
    }
    return canvasData(ctx, type, quality);
  }

  function resizeImage(image, size, type, quality, fill) {
    if (!image || (!(image instanceof Image) && !(image instanceof ImageData) && !(image instanceof HTMLCanvasElement))) {
      return null;
    }

    var widthScale = size.width / image.width,
        heightScale = size.height / image.height,
        scale = fill ? Math.max(widthScale, heightScale) : Math.min(widthScale, heightScale),
        size = {
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
    var imageHalfWidth = image.width / 2,
        imageHalfHeight = image.height / 2,
        boundsHalfWidth = size.width / 2,
        boundsHalfHeight = size.height / 2,
        scaledBoundsHalfWidth = boundsHalfWidth / scale,
        scaledBoundsHalfHeight = boundsHalfHeight / scale;

    return {
      left: -imageHalfWidth + scaledBoundsHalfWidth,
      right: imageHalfWidth - scaledBoundsHalfWidth,
      top: -imageHalfHeight + scaledBoundsHalfHeight,
      bottom: imageHalfHeight - scaledBoundsHalfHeight
    }
  }

  function drawImage(image, scale, offset, ctx) {
    var imageHalfWidth = image.width / 2,
        imageHalfHeight = image.height / 2,
        canvasHalfWidth = ctx.canvas.width / 2,
        canvasHalfHeight = ctx.canvas.height / 2,
        beforeScaleOffset = {
          x: (-imageHalfWidth + offset.x) * scale,
          y: (-imageHalfHeight + offset.y) * scale 
        },
        afterScaleOffset = {
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
    
    var x = imageHalfWidth - canvasHalfWidth / scale - offset.x,
        y = imageHalfHeight - canvasHalfHeight / scale - offset.y,
        width = ctx.canvas.width / scale,
        height = ctx.canvas.height / scale; 

    return makeFrame(x, y, width, height);       
  }

  function snapImage(image, size, scale, offset) {
    var ctx = createCanvasContext(size.width, size.height);
    drawImage(image, scale, offset, ctx);
    return canvasData(ctx); 
  }

  function canvasToDataURI(canvas, type, quality) {
    if (!type) {
      type = 'image/jpeg';
    }
    if (!quality) {
      quality = 1.0;
    }
    return canvas.toDataURL(type, quality);
  }

  function canvasData(ctx, type, quality) {
    return {
      dataURI: canvasToDataURI(ctx.canvas, type, quality),
      imageData: ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    }
  }

  return {
    downloadImageHandler: downloadImageHandler,
    dataURItoBlob: dataURItoBlob,
    fileToImageDataURI: fileToImageDataURI,
    copyImageData: copyImageData,
    cropImage: cropImage,
    resizeImage: resizeImage,
    getImageOffsetLimits: getImageOffsetLimits,
    drawImage: drawImage,
    mimetypeOfDataURI: mimetypeOfDataURI,
    loadImagesFromUrls: loadImagesFromUrls,
    loadImageFromUrl: loadImageFromUrl,
    sameImages: sameImages,
    makeFrame: makeFrame,
    imageToImageData: imageToImageData,
    imageToCanvas: imageToCanvas,
    snapImage: snapImage
  }
});
