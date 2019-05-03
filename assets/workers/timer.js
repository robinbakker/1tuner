var Timer = function() {
  onmessage = this.initTimer.bind(this);
  this.timerId = 0;
};
p = Timer.prototype;
p.initTimer = function(e) {
  var nr = parseInt(e.data);
  if (isNaN(nr) || nr<=0) {
    this.stopTimer();
  } else {
    nr = nr<100 ? nr*1000 : nr;
    this.startTimer(nr);
  }
};
p.stopTimer = function() {
  clearInterval(this.timerId);
  this.timerId = 0;
  postMessage(0);
};
p.startTimer = function(ATimeOut) {
  this.timerId = setInterval(function() {
    this.getTime();
  }.bind(this), ATimeOut);
};
p.getTime = function() {
  postMessage('update');
};
new Timer();