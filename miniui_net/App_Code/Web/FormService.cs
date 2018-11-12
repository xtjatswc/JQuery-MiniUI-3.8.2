using System;
using System.Collections.Generic;
using System.Web;

using System.Collections;
using System.Reflection;
using Plusoft.Utils;
using Plusoft.BLL;
using Plusoft.DBUtility;

namespace Plusoft.Web
{
    public class FormService : BaseService
    {
        public FormService(HttpRequest Request, HttpResponse Response)
            : base(Request, Response)
        {
        }

        public void SaveData()
        {
            //获取提交的数据
            String submitJSON = Request["submitData"];
            Hashtable data = (Hashtable)JSON.Decode(submitJSON);

            //进行数据处理
            String UserName = Convert.ToString(data["UserName"]);
            String Pwd = Convert.ToString(data["Pwd"]);
            //......

            //返回处理结果
            String json = JSON.Encode(data);
            Response.Write(json);
        }

        public void LoadData()
        {
            //模拟从数据库加载数据
            //String path = MapPath(@"form.txt");
            string tempFile = Request.PhysicalApplicationPath;
            String path = tempFile + "demo\\data\\form.txt"; 
            String strJSON = Test.File.Read(path);
            Hashtable data = (Hashtable)JSON.Decode(strJSON);

            String json = JSON.Encode(data);
            Response.Write(json);
        }

    }
}