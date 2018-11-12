/**
 * Created by shao on 2018/1/18.
 * 提供获取当前登录及系统环境信息的相关接口
 */
define(['View', 'SystemInfoService'],
    function (View, SystemInfoService) {

        var systemInfoService = new SystemInfoService();

        var cacheIt = function (fn) {
            var none = {},
                cache = none;

            return function () {
                return (cache === none) ? (cache = fn.apply(this, arguments)) : cache;
            }
        };

        var cacheParameter = function (fn, parameters) {
            return function (name, defaultValue, type, cname, desc) {
                if (name in parameters && parameters[name] != undefined) {
                    return parameters[name];
                } else {
                    if (arguments.length >= 3) {
                        return parameters[name] = (fn.call(this, {name: name, defaultValue: defaultValue, type: type, cname: cname, desc: desc}) || defaultValue);
                    } else {
                        return parameters[name] = (fn.call(this, {name: name}) || defaultValue);
                    }
                }
            }
        };

        return View.add({
            /**
             * 获取当前登录人员信息
             */
            getEmpInfo: cacheIt(systemInfoService.bindThis('getLoginEmpSync')),

            /**
             * 获取系统环境信息
             */
            getEnv: cacheIt(function () {
                return {
                    /**
                     * 获取当前登陆系统
                     */
                    getCurrentSystem: cacheIt(systemInfoService.bindThis('getLoginSystemSync')),

                    /**
                     * 获取系统部署模式：CLOUD=云端，BRANCH=机构端
                     */
                    getSystemMode: cacheIt(systemInfoService.bindThis('getSystemModeSync')),

                    /**
                     * 获取当前机器信息
                     */
                    getSysComputer: cacheIt(systemInfoService.bindThis('getSysComputerSync'))
                };
            }),

            /**
             * 取系统参数
             */
            getSysParameter: cacheParameter(systemInfoService.bindThis('getSysParameterSync'), {}),

            /**
             * 取机器参数
             */
            getComputerParameter: cacheParameter(systemInfoService.bindThis('getComputerParameterSync'), {}),

            /**
             * 取人员参数
             */
            getEmpParameter: cacheParameter(systemInfoService.bindThis('getEmpParameterSync'), {})
        });
    });