canvasExtModule.factory('apBrowserHelper', function () {
  var uagent = navigator.userAgent.toLowerCase(),
      browser = {},
      platform = {};

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
        browser.version = uagent.match(new RegExp("(" + x + ")( |/)([0-9]+)"))[3];
        break;
      }
    }
  }

  return {
    browser: browser,
    platform: platform
  };
 
});
