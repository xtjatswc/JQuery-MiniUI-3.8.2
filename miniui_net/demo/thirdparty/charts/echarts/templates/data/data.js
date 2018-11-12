option1 = {
    title: {
        text: '某站点用户访问来源',
    },
    tooltip: {
        trigger: 'item',
        formatter: "{a} <br/>{b} : {c} ({d}%)"
    },
    legend: {
        orient: 'vertical',
        right: 30,
        bottom: 35,
        data: ['直接访问', '邮件营销', '联盟广告', '视频广告', '搜索引擎']
    },
    series: [
        {
            name: '访问来源',
            type: 'pie',
            radius: '55%',
            center: ['40%', '50%'],
            data: [
                { value: 335, name: '直接访问' },
                { value: 310, name: '邮件营销' },
                { value: 234, name: '联盟广告' },
                { value: 135, name: '视频广告' },
                { value: 1548, name: '搜索引擎' }
            ],
            label: {
                normal: {
                    show: false,
                },
                emphasis: {
                    show: false,
                }
            },
        }
    ]
};
option2 = {

    xAxis: [
        {


            data: ["6:45:18", "6:45:20", "6:45:22", "6:45:24", "6:45:26", "6:45:28", "6:45:30", "6:45:32", "6:45:34", "6:45:36"]

        },
         {

             data: ["3", "2", "1", "11", "12", "13", "14", "15", "16", "17"]

         }
    ],
    yAxis: [
        {
            type: 'value',
            name: '价格',
        },
        {
            type: 'value',
            name: '预购量',
            right: 30

        }
    ],
    series: [
        {
            name: '价格',
            type: 'line',

            data: ["15", "14", "13", "5", "9", "18", "21", "23", "15", "8"]
        },
        {
            name: '预购量',
            type: 'bar',
            yAxisIndex: 1,
            data: ["210", "30", "170", "410", "500", "300", "430", "230", "60", "190"]
        }

    ]
};
//option2 = {
//    xAxis: [
//    {
//        data: ["6:45:18", "6:45:20", "6:45:22", "6:45:24", "6:45:26", "6:45:28", "6:45:30", "6:45:32",  "6:45:34", "6:45:36"]
//    },

//    //{
//    //    data: ["3", "2", "1", "11", "12", "13", "14", "15", "16", "17"]
//    //}
//    ],

//    yAxis: [
//      {
//          type: 'value',
//          name: '价格',
//          //data: ["0", "5", "10", "15", "20"]
//      },

//      {
//          type: 'value',
//          name: '预购量',
//          //data: ["0", "200", "400", "600", "800", "1000"]
//      }
//    ],
//    series: [

//    {
//        name: '价格',
//        type: 'line',
//        data: ["15", "14", "13", "5", "9", "18", "21", "23", "15", "8"]

//    },
//    {
//       name: '预购量',
//       type: 'bar',
//       data: ["210", "30", "170", "410", "500", "300", "430", "230", "60", "190"]
//    }
//]

//};

option3 = {
    title: {
        text: '受理类型分布',
    },
    tooltip: {
        trigger: 'item',
        formatter: "{a} <br/>{b}: {c} ({d}%)"
    },
    series: [
    {
        name: '访问来源',
        type: 'pie',
        selectedMode: 'single',
        radius: [0, '30%'],

        label: {
            normal: {
                position: 'inner'
            }
        },
        labelLine: {
            normal: {
                show: false
            }
        },
        data: [
        {
            value: 335, name: '直达'
        },
        {
            value: 679, name: '营销广告'
        },
        { value: 1548, name: '搜索引擎' }
        ]
    },
    {
        name: '访问来源',
        type: 'pie',
        radius: ['40%', '55%'],
        data: [
        {
            value: 335, name: '直达'
        },
        {
            value: 310, name: '邮件营销'
        },
        {
            value: 234, name: '联盟广告'
        },
        {
            value: 135, name: '视频广告'
        },
        {
            value: 1048, name: '百度'
        },
        {
            value: 251, name: '谷歌'
        },
        {
            value: 147, name: '必应'
        },
        { value: 102, name: '其他' }
        ]
    }
    ]
};

option4 = {
    title: {
        text: '部门受理量',

        subtext: '平均处理时长',



    },

    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01]
    },
    yAxis: {
        type: 'category',
        data: ['巴西', '印尼', '美国', '印度', '中国', '世界人口(万)']
    },
    series: [
    {
        name: '2011年',
        type: 'bar',
        data: [18203, 23489, 29034, 104970, 131744, 630230]
    },
    {
        name: '2012年',
        type: 'bar',
        data: [19325, 23438, 31000, 121594, 134141, 681807]
    }
    ]
};