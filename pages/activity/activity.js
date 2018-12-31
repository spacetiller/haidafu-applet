// pages/activity/activity.js
const app = getApp();
var util = require('../../utils/util.js');
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		title: '活动报名',
		activity: {},
		iHaveReserved: false,
		reserveDate: '2019-01-01',
		dateError: false,
		name: '',
		nameError: false,
		mobile: '',
		mobileError: false,
		verify: '',
		verifyError: false,

		userInfo: {},
		//isLogin: false,
		//hasUserInfo: false,
		canIUse: wx.canIUse('button.open-type.getUserInfo')
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		const _this = this;
		// 拼接请求url
		//console.log(options.actId);
		var userinfo = wx.getStorageSync('userinfo');
		if (!userinfo || userinfo.isLogin == undefined || !userinfo.isLogin) {
			var logcb = function () {
				var userinfo = wx.getStorageSync('userinfo');
				_this.setData({
					userInfo: userinfo
				});
			};
			app.checkUserLogin(logcb);
		} else {
			this.setData({
				userInfo: userinfo
			});
		}
		
		const url = 'https://zhuabo.pk4yo.com/activity/getbyid?actId=' + options.actId;
		// 请求数据
		wx.request({
			url: url,
			data: {},
			header: {
				'content-type': 'json' // 默认值
			},
			success: function (res) {
				//console.log(res.data);
				if (res.statusCode == 200 && res.data.data.length > 0) {
					var activity = res.data.data[0];
					if (activity.startTime.length > 16 && activity.startTime.indexOf('T') > 0) {
						activity.startTime = activity.startTime.substr(0, 10) + ' ' + activity.startTime.substr(11, 5);
					}
					_this.setData({
						activity: activity,
						loading: false // 隐藏等待框
					});
					
					/*
					*	检查storage缓存，判断当前用户是否已预约。
					*/
					const key = 'myactivites';
					var activities = wx.getStorageSync(key) || [];
					var fi = util.array_find_obj(activities, "actid", activity.actId);
					if (fi >= 0) {
						_this.setData({
							iHaveReserved: true
						});
					} else if (_this.data.userInfo && _this.data.userInfo.userId > 0) {	// 存在即修正，虚无非真空
						// 拼接请求url
						const url = 'https://zhuabo.pk4yo.com/myactivity/getbycond?actId=' + options.actId + '&userId=' + _this.data.userInfo.userId;
						// 请求数据
						//var _res = res;
						wx.request({
							url: url,
							data: {},
							header: {
								'content-type': 'json' // 默认值
							},
							success: function (res) {
								if (res.statusCode == 200 && res.data.data.length > 0) {
									activities.unshift(res.data.data[0]);
									wx.setStorage({
										key: key,
										data: activities,
									});
									_this.setData({
										iHaveReserved: true
									});
								}
							}
						});
					}
				}
			},
			fail: function () {
				console.log('wx request failed !!!')
			}
		});
	
	},

	nameInput: function (e) {
		var name = e.detail.value;
		let reg = new RegExp(/^[\u4E00-\u9FA5 A-Za-z]+$/);
		if (reg.test(name)) {
			console.log("姓名格式正确");
		}
		if (name.length > 1 && name.length < 50) {
			this.setData({
				nameError: false
			});
		} else {
			this.setData({
				nameError: true
			});
		}
		this.setData({
			name: name
		});

	},

	mobileInput: function (e) {
		var mobile = e.detail.value;
		if (util.checkMobile(mobile)) {
			this.setData({
				mobileError: false
			});
		} else {
			this.setData({
				mobileError: true
			});
		}
		this.setData({
			mobile: mobile
		});
	},

	verifyInput: function (e) {
		var verify = e.detail.value;
		if (verify.length == 6) {
			this.setData({
				verifyError: true
			});
		} else {
			this.setData({
				verifyError: false
			});
		}
		this.setData({
			verify: verify
		});
	},

	sendVerify: function () {
		wx.showToast({
			title: '暂时不需要短信验证码！',
			icon: 'success',
			duration: 1000,
			mask: false
		})
	},

	goHome: function () {
		//wx.navigateTo({
		//	url: '../index/index',
		//});
		wx.navigateBack();
	},

	submit: function () {
		var _this = this;
		if (this.data.name == '') {
			this.setData({
				nameError: true
			});
		}
		if (this.data.mobile == '') {
			this.setData({
				mobileError: true
			});
		}
		if (this.data.name == '') {
			this.setData({
				verifyError: true
			});
		}
		if (!this.data.nameError && !this.data.mobileError && !this.data.verifyError) {
			var userinfo = wx.getStorageSync('userinfo');

			if (!userinfo || userinfo.userId == undefined) {
				wx.showToast({
					title: '用户未登录！',
					icon: 'none',
					duration: 1500,
					mask: false
				});
				return;
			}
			const url = 'https://zhuabo.pk4yo.com/myactivity/add?actId=' + this.data.activity.actId + '&userId=' + userinfo.userId + '&trueName=' + this.data.name + '&phone=' + this.data.mobile + '&verify=' + this.data.verify;
			// 请求数据
			wx.request({
				url: url,
				data: {},
				header: {
					'content-type': 'json' // 默认值
				},
				success: function (res) {
					//console.log(res.data);
					var key = "myactivites";
					var activities = wx.getStorageSync(key) || [];
					activities.unshift({ "actid": _this.data.activity.actId, "activity": _this.data.activity });
					wx.setStorage({
						key: key,
						data: activities
					});

					wx.navigateTo({
						url: "/pages/activityok/activityok"
					});
				}
			});
		}
	},

	getUserInfo: function (e) {
		var _this = this;
		console.log(e);
		var userinfo = wx.getStorageSync('userinfo');
		if (!userinfo){
			app.globalData.userInfo = e.detail.userInfo;
			wx.setStorage({
				key: "userinfo",
				data: e.detail.userInfo
			});
		}
		if (userinfo && userinfo.userId && userinfo.isLogin) {	// 数据不一致
			this.setData({
				userInfo: userinfo
			});
		} else {
			var logcb = function () {
				var userinfo = wx.getStorageSync('userinfo');
				_this.setData({
					userInfo: userinfo
				});
			};
			app.loginUser(logcb);
		}
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {
		wx.setNavigationBarTitle({
			title: this.data.title //"项目详情" //this.project.pName
		})

	}
})