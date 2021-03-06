//app.js

import { Alarm } from './utils/alarm.js'

var ringtoneName = ['ringtone1', 'ringtone2', 'ringtong3', 'neusong']
var ringtoneUrl = [
  'https://raw.githubusercontent.com/xueweiguo/alarmmap/master/ringtones/1.silk',
  'https://raw.githubusercontent.com/xueweiguo/alarmmap/master/ringtones/2.silk',
  'https://raw.githubusercontent.com/xueweiguo/alarmmap/master/ringtones/3.silk',
  'https://raw.githubusercontent.com/xueweiguo/alarmmap/master/ringtones/neusong.silk'
]

const util = require('./utils/util.js')
const voiceplayer = require('./utils/voiceplayer.js')
const countDownStart = 3   //20TIMES,When Timeout in index.js = 15s, Waittime=1min

App({
  onLaunch: function () {
    try {
      var res = wx.getSystemInfoSync()
      this.pixelRatio = res.pixelRatio
      this.windowWidth = res.windowWidth
      this.windowHeight = res.windowHeight
    } catch (e) {
      console.log("wx.getSystemInfoSync() error!")
    }
    //读出监控点信息。
    var that = this
    var alarm_array = wx.getStorageSync('alarms') || []
    alarm_array.forEach(function(alarm_data){
      that.globalData.alarms.push(new Alarm(alarm_data));
    })

    //this.addLog("app.onLaunch")
    voiceplayer.prepare()
  },

  onShow: function (options) {
    
  },
  onHide: function () {
   // this.addLog('app.onHide, pageCount=' + getCurrentPages().length) 
  },

  addAlarm: function(alarm){
    if (alarm.dateTime == null) {
      //edit alarm
      alarm.dateTime = new Date()
      this.globalData.alarms.push(alarm);
    } else {
      //new alarm 
      this.globalData.alarms.push(app.globalData.currentAlarm);
      this.globalData.alarms.forEach(function (a, i, alarms) {
        if (a.dateTime == alarm.dateTime){
          alarms[i] = alarm
        }  
      })
    }
    wx.setStorageSync('alarms', this.globalData.alarms)
  },

  deleteAlarm: function(index){
    if(index >= 0 && index < this.globalData.alarms.length) {
      this.globalData.alarms.splice(index, 1);
      wx.setStorageSync('alarms', this.globalData.alarms)
    }
  },

  resumeAlarms:function(){
    this.globalData.alarms.forEach(function(alarm){alarm.resume()})  
  },

  suspendAlarms:function(){
    this.globalData.alarms.forEach(function(alarm){ alarm.suspend()})  
  },

  checkAlarms: function (callback, absolute) {
    console.log("checkAlarms,dis=", this.globalData.lastDistance)
    var that = this;

    //最近监控点在500m以内时，提高监控频率
    if ((that.globalData.lastDistance < 500) || (absolute == true)){
      that.globalData.countDown = countDownStart;
      that.checkAlarmsImpl(callback)
    }else{
      if (that.globalData.countDown == 0) {
        that.checkAlarmsImpl(callback)
        that.globalData.countDown = countDownStart;
      } else {
        that.globalData.countDown--;
      }
    }
  },

  checkAlarmsImpl: function (callback) {
    console.log('checkAlarmsImpl')
    var that = this
    util.getLocation({
      success: function (res) {
        that.globalData.here = {
          latitude: res.latitude,
          longitude: res.longitude,
          accuracy: res.accuracy
        }
        var index = 0;
        var min_distance = 10000 //big enough
        while (index < that.globalData.alarms.length) {
          var alarm = that.globalData.alarms[index]
          alarm.checkLocation(res.latitude, res.longitude, res.accuracy)
          if(alarm.isActive()){
            if(alarm.distance < min_distance){
              min_distance = alarm.distance
            }
          }
          index++
        }
        for (index = 0; index < that.globalData.alarms.length; index++) {
          var alarm = that.globalData.alarms[index]
          if (alarm.state == 'fired') {
            alarm.executeAction();
            break;
          }
        }
        that.globalData.lastDistance = min_distance
        callback()
      },
      fail:function(res){
        that.globalData.lastDistance = 0
      }
    })
  },

  getRingtoneNames: function () {
    return ringtoneName;
  },

  getRingtoneUrl: function (index) {
    return ringtoneUrl[index];
  },

  getRingoneUrlByName: function (name) {
    var index = ringtones.indexOf(name);
    if (index != -1) {
      index = 0;
    }
    return ringtones[index];
  },

  addLog:function(msg){
    this.globalData.logs.unshift({time:new Date, message:msg});
    if(this.globalData.logs.length > 100){
      this.globalData.logs.pop();
    }
  },

  globalData: {
    pixelRatio: 1,
    windowWidth: 100,
    windowHeight: 100,
    here: undefined,
    alarms: [],
    currentAlarm: null,
    logs:[],
    countDown: 0,
    lastDistance:0
  }
})