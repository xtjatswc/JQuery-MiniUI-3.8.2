# JQuery MiniUI 3.8.2

#### 项目介绍
1. miniui-js-framework-master.zip	Github上发现的最新版的miniui源码
2. miniui_net.rar	官网下载的miniui 3.8.2试用版
3. miniui_net(集成最新版&源码).rar	在官网试用版的基础上把源码替换进去，并测试没有问题

#### 软件架构
软件架构说明


#### 安装教程

1. 安装官方版，执行数据库脚本，并且修改连接字符串
2. iis环境的不同，可以会报不同的错误，具体根据错误解决
3. 给网站目录配上network server, everyone, iis_users权限，这样多文件上传的权限也有了
4. iis选择网站->功能视图->目录浏览，设置成启用，解决swfupload上传报错
5. 不出意外，可以正常访问了，然后把源码包里对应的js等资源替换到官方试用版文件夹中
6. 会发现有的示例预览不出来，后来发现需要执行mini.parse()，在线demo里不用执行，但本地不执行界面会空白，mini.parse()的作用其实就是触发miniui加载数据渲染完了之后再显示界面，不然网速一卡，没加载完的丑陋界面就暴露出来了

#### 使用说明

1. xxxx
2. xxxx
3. xxxx

#### 参与贡献

1. Fork 本项目
2. 新建 Feat_xxx 分支
3. 提交代码
4. 新建 Pull Request


#### 码云特技

1. 使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2. 码云官方博客 [blog.gitee.com](https://blog.gitee.com)
3. 你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解码云上的优秀开源项目
4. [GVP](https://gitee.com/gvp) 全称是码云最有价值开源项目，是码云综合评定出的优秀开源项目
5. 码云官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6. 码云封面人物是一档用来展示码云会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)