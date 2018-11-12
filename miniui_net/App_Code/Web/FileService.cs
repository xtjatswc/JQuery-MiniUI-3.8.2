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
    public class FileService : BaseService
    {
        public FileService(HttpRequest Request, HttpResponse Response)
            : base(Request, Response)
        {
        }

        public void LoadFolders()
        {
            String id = Request["id"];
            if (String.IsNullOrEmpty(id)) id = "-1";

            //获取下一级节点
            String sql = "select * from plus_file where folder = 1 and pid = '" + id + "' order by updatedate";
            ArrayList folders = new DataBase().Select(sql);

            //判断节点，是否有子节点。如果有，则处理isLeaf和expanded。
            for (int i = 0, l = folders.Count; i < l; i++)
            {
                Hashtable node = (Hashtable)folders[i];
                String nodeId = node["id"].ToString();

                node["isLeaf"] = false;
                node["expanded"] = false;
            }

            //返回JSON
            String json = JSON.Encode(folders);
            Response.Write(json);
        }

        public void LoadFiles()
        {
            String folderId = Request["folderId"];

            String sql = "select * from plus_file where pid = " + folderId + " and folder = 0 order by updatedate";
            ArrayList files = new DataBase().Select(sql);

            String json = JSON.Encode(files);
            Response.Write(json);
        }

    }
}