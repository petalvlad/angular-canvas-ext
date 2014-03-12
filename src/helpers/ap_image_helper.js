canvasExtModule.factory('apImageHelper', function (apBrowserHelper) {
  var browser = apBrowserHelper.browser,
      platform = apBrowserHelper.platform;

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
    dataURI = dataURI.replace(type, "image/octet-stream"); 
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
    if (!type) {
      type = file.type;
    }
    var imgSrc = URL.createObjectURL(file);
    if (imgSrc && imgSrc !== "") {
      var image = new Image();
      image.onload = function () {
        if (platform.ios) {
          getImageExifOrientation(image, function(orientation) {
            var fixOptions = {               
              orientation: orientation
            };
            fixImage(image, fixOptions, function(target) {
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

  function getImageExifOrientation(image, callback) {
    EXIF.getData(image, function() {
      callback(EXIF.getTag(image, "Orientation"));
    });
  }

  function createCanvasContext(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext('2d');
  }

  function fixImage(image, fixOptions, callback) {
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
    if (!image || (!(image instanceof Image) && !(image instanceof ImageData) && !(image instanceof HTMLCanvasElement))) {
      return null
    }

    var ctx = createCanvasContext(frame.size.width, frame.size.height),
        imageHalfWidth = image.width / 2,
        imageHalfHeight = image.height / 2,
        newImageHalfWidth = frame.size.width / 2,
        newImageHalfHeight = frame.size.height / 2,
        left = frame.origin.x,
        top = frame.origin.y;
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
    return {
      size: {
        width: ctx.canvas.width / scale,
        height: ctx.canvas.height / scale,
      },
      origin: {
        x: imageHalfWidth - canvasHalfWidth / scale - offset.x,
        y: imageHalfHeight - canvasHalfHeight / scale - offset.y
      }
    }       
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
    drawImage: drawImage
  }
});
