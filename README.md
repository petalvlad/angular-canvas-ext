Angular canvas extensions
==================
An Angular module that allows you
* open local or remote photos and draw photos on canvas (supports iOS browsers)
* zoom & pan photo (supports touch gestures)
* crop & resize photo
* download photo

##Demo
http://petalvlad.github.io/angular-canvas-ext/

##Install
```Bash
bower install angular-canvas-ext
```

Include [third party libs](https://github.com/petalvlad/angular-canvas-ext#dependencies)
```html
<script src="bower_components/angular-canvas-ext/thirdparty.min.js"></script>
```

Include the module
```html
<script src="bower_components/angular-canvas-ext/angular-canvas-ext.min.js"></script>
```

##Use module with angular application
Pass ``ap.canvas.ext`` module as a dependency of your application
```javascript
var app = angular.module('app', ['ap.canvas.ext']);
```

##Example of usage
Use ```ap-file-src``` directive to open files
```html
<input type="file" ap-file-src="src">
```

Use the same ```src``` field with ```ap-canvas``` directive to draw open photo
```html
<canvas width="400" height="450" ap-canvas src="src" image="image" zoomable="true" frame="frame" scale="scale" offset="offset"></canvas>
```

Change ```scale``` field to zoom photo or use pinch gesture
```javascript
$scope.zoomIn = function() {
  $scope.scale *= 1.2;
}

$scope.zoomOut = function() {
  $scope.scale /= 1.2;
}
```

In order to crop photo inject ```apImageHelper``` and use its ```cropImage``` function
```javascript
angular.module('app').controller('controller', function($scope, apImageHelper) {
  $scope.crop = function() {
    var maxSize = {
      width: 1500,
      height: 1500
    };
    
    var canvasData = apImageHelper.cropImage($scope.image, $scope.frame, maxSize);
  }
}
```

It returns following object:
```javascript
{
  dataURI: <base64 string of cropped image>,
  imageData: <ImageData instance of cropped image>
}
```

In order to download image use link
```html
<a href="#" ng-click="download($event)">download</a>
```

```javascript
$scope.download = function($event) {
  var filename = new Date().getTime() + '.png';
  return apImageHelper.downloadImageHandler($scope.src, filename, $event);    
}
```

##Dependencies

Angular canvas extensions module uses third party libraries to fix rendering image on canvas in iOS browsers
* [ios-imagefile-megapixel](https://github.com/stomita/ios-imagefile-megapixel) - fixes canvas rendering
* [exif-js](https://github.com/jseidelin/exif-js) - reads EXIF data to fix orientation of photo taken using iOS camera



