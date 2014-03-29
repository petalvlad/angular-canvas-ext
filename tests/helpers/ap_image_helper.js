describe('Image helper', function() {
  var imageHelper,
      browserHelper,
      APFrame,
      APSize,
      empties = [undefined, null, '', ""],
      invalidDataURLs = [
        "dataxbase64",
        "data:HelloWorld",
        "data:text/html;charset=,%3Ch1%3EHello!%3C%2Fh1%3E",
        "data:text/html;charset,%3Ch1%3EHello!%3C%2Fh1%3E", "data:base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC",
        "",
        "http://wikipedia.org",
        "base64",
        "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC",
        " data:,Hello%2C%20World!",
        " data:,Hello World!",
        " data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D",
        " data:text/html,%3Ch1%3EHello%2C%20World!%3C%2Fh1%3E",
        "data:,A%20brief%20note",
        "data:text/html;charset=US-ASCII,%3Ch1%3EHello!%3C%2Fh1%3E"
      ],
      validDataURLs = [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAFVBMVEXk5OTn5+ft7e319fX29vb5+fn///++GUmVAAAALUlEQVQIHWNICnYLZnALTgpmMGYIFWYIZTA2ZFAzTTFlSDFVMwVyQhmAwsYMAKDaBy0axX/iAAAAAElFTkSuQmCC",
        "   data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAFVBMVEXk5OTn5+ft7e319fX29vb5+fn///++GUmVAAAALUlEQVQIHWNICnYLZnALTgpmMGYIFWYIZTA2ZFAzTTFlSDFVMwVyQhmAwsYMAKDaBy0axX/iAAAAAElFTkSuQmCC   ",        
      ],
      png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC",
      jpg = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAFVBMVEXk5OTn5+ft7e319fX29vb5+fn///++GUmVAAAALUlEQVQIHWNICnYLZnALTgpmMGYIFWYIZTA2ZFAzTTFlSDFVMwVyQhmAwsYMAKDaBy0axX/iAAAAAElFTkSuQmCC",
      gif = "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAFVBMVEXk5OTn5+ft7e319fX29vb5+fn///++GUmVAAAALUlEQVQIHWNICnYLZnALTgpmMGYIFWYIZTA2ZFAzTTFlSDFVMwVyQhmAwsYMAKDaBy0axX/iAAAAAElFTkSuQmCC   ";

  

  beforeEach(module('ap.canvas.ext'));
  
  beforeEach(inject(function(apImageHelper, apBrowserHelper, apFrame, apSize, apPosition) {
    imageHelper = apImageHelper;
    browserHelper = apBrowserHelper;
    APFrame = apFrame;
    APSize = apSize;
  }));
  
  it('image helper should not be null', function() {
    expect(imageHelper).not.toBe(null);
  });

  it('browser helper should not be null', function() {
    expect(browserHelper).not.toBe(null);
  });
  
  describe('mimetypeOfDataURI', function() {
    it('should return null for empty data url', function() {      
      for (var i = 0; i < empties.length; i++) {
        expect(imageHelper.mimetypeOfDataURI(empties[i])).toBe(null);
      }       
    });

    it('should return null for non image data url', function() {      
      for (var i = 0; i < invalidDataURLs.length; i++) {
        expect(imageHelper.mimetypeOfDataURI(invalidDataURLs[i])).toBe(null);
      }
    });

    it('should return correct mime type for given data url', function() {      
      expect(imageHelper.mimetypeOfDataURI(png)).toBe('image/png');
      expect(imageHelper.mimetypeOfDataURI(jpg)).toBe('image/jpeg');
      expect(imageHelper.mimetypeOfDataURI(gif)).toBe('image/gif');
    });
  });

  describe('downloadImageHandler', function() {
    var validDataURI = 'data:image/png;base64,YWJjZA==',
        validDataURIOctetStream = 'data:image/octet-stream;base64,YWJjZA==',
        validFilename = 'filename.png';
    function mouseEventMock() {
      return {
        currentTarget: {
          href: '#',
          download: ''
        },
        defaultPrevented: false,
        preventDefault: function() {
          this.defaultPrevented = true;
        }
      };
    }    

    function testDownloadImageHandler(expDefaultPrevented, dataURI, browser, platform, filename, expFilename, expDataURI) {
      var b, p;
      if (browser) {
        b = browserHelper.browser[browser];        
        browserHelper.browser[browser] = true;
      }

      if (platform) {
        p = browserHelper.platform[platform];
        browserHelper.platform[platform] = true;  
      }
      
      var event = mouseEventMock();
      imageHelper.downloadImageHandler(dataURI, filename, event);
      if (expDefaultPrevented) {
        expect(event.defaultPrevented).toBe(expDefaultPrevented);  
      }      
      if (expFilename) {
        expect(event.currentTarget.download).toBe(expFilename);  
      }
      if (expDataURI) {
        expect(event.currentTarget.href).toBe(expDataURI);  
      }
      
      if (browser) {
        browserHelper.browser[browser] = b;
      }

      if (platform) {
        browserHelper.platform[platform] = p;  
      }
    }

    it('should prevent default behavior if dataURI is empty', function() {
      var dataURIs = [undefined, null, '', ""];
      for (var i = 0; i < dataURIs.length; i++) {
        testDownloadImageHandler(true, dataURIs[i]);        
      }      
    }); 

    it('should prevent default behavior if browser is IE', function() {
      testDownloadImageHandler(true, validDataURI, 'msie');      
    });     

    it('should prevent default behavior if it is iOS', function() {
      testDownloadImageHandler(true, validDataURI, null, 'ios');      
    });

    it('should not prevent default behavior in all browsers except IE and iOS browsers', function() {
      testDownloadImageHandler(false, validDataURI, 'chrome', 'desktop');
      testDownloadImageHandler(false, validDataURI, 'chrome', 'android');
      testDownloadImageHandler(false, validDataURI, 'firefox', 'desktop');
      testDownloadImageHandler(false, validDataURI, 'safari', 'desktop');
      testDownloadImageHandler(false, validDataURI, 'opera', 'desktop');
    });

    it('filename of download file shoud equals to given', function() {
      testDownloadImageHandler(false, validDataURI, 'chrome', 'desktop', validFilename, validFilename);      
    });

    it('downloading data uri should be octet stream in desktop chrome', function() {
      testDownloadImageHandler(false, validDataURI, 'chrome', 'desktop', null, null, validDataURIOctetStream);
    });
  });

  describe('dataURItoBlob', function() {
    it('should return null for empty dataURI', function() {
      for (var i = 0; i < empties.length; i++) {
        expect(imageHelper.dataURItoBlob(empties[i])).toBe(null);
      }      
    }); 

    it('should return null for invalid dataURI', function() {
      for (var i = 0; i < invalidDataURLs.length; i++) {
        expect(imageHelper.dataURItoBlob(invalidDataURLs[i])).toBe(null);
      }      
    }); 

    it('should return blob for valid dataURI', function() {
      for (var i = 0; i < validDataURLs.length; i++) {
        expect(imageHelper.dataURItoBlob(validDataURLs[i])).not.toBe(null);
      }      
    });

    it('should return blob with same mime type', function() {
      expect(imageHelper.dataURItoBlob(png).type).toBe('image/png');
      expect(imageHelper.dataURItoBlob(jpg).type).toBe('image/jpeg');
      expect(imageHelper.dataURItoBlob(gif).type).toBe('image/gif');
    });
  });

  describe('fileToImageDataURI', function() {
    var imageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAA8CAYAAADxJz2MAAAAzElEQVR4Xu3SsQ0AIAwEsbD/0EDBBFzrSCmvsX7NzL7vPgUWwE+5lwFsfgMQYBSIuQUCjAIxt0CAUSDmFggwCsTcAgFGgZhbIMAoEHMLBBgFYm6BAKNAzC0QYBSIuQUCjAIxt0CAUSDmFggwCsTcAgFGgZhbIMAoEHMLBBgFYm6BAKNAzC0QYBSIuQUCjAIxt0CAUSDmFggwCsTcAgFGgZhbIMAoEHMLBBgFYm6BAKNAzC0QYBSIuQUCjAIxt0CAUSDmFggwCsTcAiPgAYiWPAE3ah/aAAAAAElFTkSuQmCC',
        cat = 'base/tests/img/cat.jpeg';


    it('should return null for no file', function(done) {
      imageHelper.fileToImageDataURI(null, null, null, function(dataUrl) {
        expect(dataUrl).toBe(null);
        done();
      });  
    });

    it('should return the same data url for given blob', function(done) {
      var blob = imageHelper.dataURItoBlob(imageUrl);
      imageHelper.fileToImageDataURI(blob, null, null, function(dataUrl) {
        expect(dataUrl).toBe(imageUrl);
        done();
      });  
    });

    it('mime type of result data url should be the same as type of given blob', function(done) {
      var blob = imageHelper.dataURItoBlob(png);
      imageHelper.fileToImageDataURI(blob, null, null, function(dataUrl) {
        expect(imageHelper.mimetypeOfDataURI(dataUrl)).toBe(blob.type);
        done();
      });  
    });

    it('mime type of result data url should equals to given', function(done) {
      var blob = imageHelper.dataURItoBlob(png);
      imageHelper.fileToImageDataURI(blob, 'image/jpeg', null, function(dataUrl) {
        expect(imageHelper.mimetypeOfDataURI(dataUrl)).toBe('image/jpeg');
        done();
      });  
    }); 

    it('should decrease size of file for lower quality', function(done) {
      var image = new Image();
      image.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        var blob = imageHelper.dataURItoBlob(canvas.toDataURL('image/jpeg', 1.0));
        imageHelper.fileToImageDataURI(blob, 'image/jpeg', 0.2, function(dataUrl) {
          var compressed = imageHelper.dataURItoBlob(dataUrl);
          expect(compressed.size).toBeLessThan(blob.size);
          done();
        });
      };
      image.src = cat;
        
    }); 

    // ios rotation tests

  });

  describe('cropImage', function() {
    var catSrc = 'base/tests/img/cat.jpeg',
        catEyeSrc = 'base/tests/img/cat-eye.jpeg',
        car,
        catEye;
    
    beforeEach(function(done) {
      imageHelper.loadImagesFromUrls([catSrc, catEyeSrc])
        .then(function(images) {
          cat = images[0];
          catEye = images[1];          
      }).finally(function() {
        done();
      });
    });

    it('should return null if original image is null', function() {
      var cropCanvasData = imageHelper.cropImage(null, new APFrame(50, 88, 100, 100));          
      expect(cropCanvasData).toBe(null);
    });

    it('should return null if frame is null or invalid', function() {
      var frame = new APFrame(50, 88, 100, 100);
      frame.origin.x = 'invalid';
      expect(imageHelper.cropImage(cat, null)).toBe(null);
      expect(imageHelper.cropImage(cat, frame)).toBe(null);
    });


    it('cropped image from wrong position should not equals manually cropped image', function() {
      var cropCanvasData = imageHelper.cropImage(cat, new APFrame(0, 0, 100, 100)),
          cropImageData = cropCanvasData.imageData;
          
      expect(imageHelper.sameImages(catEye, cropImageData)).toBe(false);          
    });

    it('cropped image with different size should not equals manually cropped image', function() {
      var cropCanvasData = imageHelper.cropImage(cat, new APFrame(50, 88, 101, 101)),
          cropImageData = cropCanvasData.imageData;
          
      expect(imageHelper.sameImages(catEye, cropImageData)).toBe(false);          
    });

    it('cropped image should equals manually cropped image', function() {
      var cropCanvasData = imageHelper.cropImage(cat, new APFrame(50, 88, 100, 100)),
          cropImageData = cropCanvasData.imageData;
          
      expect(imageHelper.sameImages(catEye, cropImageData)).toBe(true);          
    });

    it('crop entire image should produce image equals original image', function() {
      var cropCanvasData = imageHelper.cropImage(cat, new APFrame(0, 0, cat.width, cat.height)),
          cropImageData = cropCanvasData.imageData;

      expect(imageHelper.sameImages(cat, cropImageData)).toBe(true);          
    });

  });
});






